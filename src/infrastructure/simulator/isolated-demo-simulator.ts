import type { OperationalRuntime } from "../../application/access/operational-access";
import {
  requireAnonymousDemoRuntime,
  requireDemoReservationInput,
} from "../../application/demo/demo-admission";
import type { DemoReferenceWorkspace } from "../../application/demo/demo-reference-workspace";
import type {
  EquipmentCommandEnvelope,
  EquipmentPort,
} from "../../application/equipment/equipment-port";
import type { EquipmentObservationSink } from "../../application/equipment/equipment-observation-sink";
import type { AdvancingClock } from "../../application/execution/inbound-execution";
import type { ScheduledAction } from "../../application/time/clock";
import { validateEquipmentDescriptor } from "../../domain/equipment/equipment-descriptor";
import { validateTopology } from "../../domain/topology/warehouse-topology";
import { ManualClock } from "./manual-clock";
import { SimulatorEquipmentAdapter } from "./simulator-equipment-adapter";
import { ObservationPublishingEquipmentPort } from "./observation-publishing-equipment-port";

export type IsolatedDemoSimulator = Readonly<{
  sessionId: string;
  warehouseId: string;
  equipment: EquipmentPort;
  clock: AdvancingClock;
  heartbeat(): Promise<void>;
  stop(): Promise<void>;
}>;

/** Fresh local bundle only; caller must establish durable ownership before activation. */
export function createIsolatedDemoSimulator(
  runtime: OperationalRuntime,
  sessionId: string,
  input: DemoReferenceWorkspace,
  sink: EquipmentObservationSink,
  policy: Readonly<{
    maximumCommands: number;
    maximumPendingOperations?: number;
  }>,
  now: () => Date = () => new Date(),
): IsolatedDemoSimulator {
  requireAnonymousDemoRuntime(runtime);
  requireDemoReservationInput({
    sessionId,
    templateWarehouseId: input.warehouseId,
  });
  const workspace = structuredClone(input);
  const invalid = () => {
    throw new Error("Invalid isolated simulator workspace.");
  };
  if (
    !Number.isSafeInteger(policy.maximumCommands) ||
    policy.maximumCommands < 1 ||
    policy.maximumCommands > 1_000
  )
    invalid();
  if (
    workspace.topology.warehouseId !== workspace.warehouseId ||
    workspace.topology.topologyId === workspace.warehouseId ||
    workspace.topology.status !== "active" ||
    validateTopology(workspace.topology).length ||
    workspace.topology.nodes.length > 1_000 ||
    workspace.equipment.length < 1 ||
    workspace.equipment.length > 100 ||
    new TextEncoder().encode(JSON.stringify(workspace)).length > 1_048_576
  )
    invalid();
  const maximumPendingOperations = policy.maximumPendingOperations ?? 32;
  if (
    !Number.isSafeInteger(maximumPendingOperations) ||
    maximumPendingOperations < 1 ||
    maximumPendingOperations > 100
  )
    invalid();
  const ownedIds = new Set(Object.values(workspace.referenceMap.equipment));
  if (ownedIds.size !== workspace.equipment.length) invalid();
  const descriptors = new Set<string>();
  for (const descriptor of workspace.equipment) {
    requireDemoReservationInput({
      sessionId: descriptor.equipmentId,
      templateWarehouseId: workspace.topology.topologyId,
    });
    if (
      !ownedIds.has(descriptor.equipmentId) ||
      descriptor.equipmentId === workspace.warehouseId ||
      descriptor.equipmentId === workspace.topology.topologyId ||
      descriptors.has(descriptor.equipmentId) ||
      descriptor.adapterKey !== "simulator.mobile-transport" ||
      validateEquipmentDescriptor(descriptor).length ||
      Array.isArray(descriptor.constraints) ||
      Object.keys(descriptor.constraints).length
    )
      invalid();
    descriptors.add(descriptor.equipmentId);
  }
  const nodes = new Set(workspace.topology.nodes.map((node) => node.nodeId));
  const adapter = new SimulatorEquipmentAdapter({
    maximumProcessedCommands: policy.maximumCommands,
  });
  for (const descriptor of workspace.equipment)
    adapter.register(descriptor, "offline");
  const publisher = new ObservationPublishingEquipmentPort(
    adapter,
    {
      publish: async (observation) => {
        if (
          !ownedIds.has(observation.equipmentId) ||
          (observation.nodeId !== null &&
            (!nodes.has(observation.nodeId) ||
              observation.topologyId !== workspace.topology.topologyId ||
              observation.topologyRevision !== workspace.topology.revision))
        )
          invalid();
        return sink.publish(structuredClone(observation));
      },
    },
    now,
  );
  for (const descriptor of workspace.equipment) {
    publisher.track(descriptor.equipmentId, -1, {
      topologyId: workspace.topology.topologyId,
      topologyRevision: workspace.topology.revision,
      source: "isolated-demo-simulator",
    });
  }
  const virtualClock = new ManualClock();
  const scheduled = new Set<ScheduledAction>();
  let scheduledCount = 0;
  const inFlight = new Set<Promise<unknown>>();
  let operationTail: Promise<void> = Promise.resolve();
  let closing = false;
  let stopAttempt: Promise<void> | null = null;
  const requireOpen = () => {
    if (closing) throw new Error("Isolated simulator is stopped.");
  };
  const run = async <T>(work: () => Promise<T>): Promise<T> => {
    requireOpen();
    if (inFlight.size >= maximumPendingOperations)
      throw new Error("Isolated simulator pending-operation budget exhausted.");
    // Serialize capture/publication too: an older heartbeat cannot overtake a transition.
    const pending = operationTail.then(work);
    operationTail = pending.then(
      () => undefined,
      () => undefined,
    );
    inFlight.add(pending);
    try {
      return await pending;
    } finally {
      inFlight.delete(pending);
    }
  };
  const validateCommand = (envelope: EquipmentCommandEnvelope) => {
    if (
      !ownedIds.has(envelope.equipmentId) ||
      typeof envelope.commandId !== "string" ||
      !envelope.commandId.trim() ||
      envelope.commandId.length > 120 ||
      new TextEncoder().encode(JSON.stringify(envelope)).length > 2_048
    )
      invalid();
    const command = envelope.command;
    if (
      command.type === "recover" &&
      !["resume", "release"].includes(command.strategy)
    )
      invalid();
    if (
      command.type === "inject_fault" &&
      (typeof command.faultCode !== "string" ||
        !command.faultCode.trim() ||
        command.faultCode.length > 120)
    )
      invalid();
    if (
      (command.type === "arrive_at_pickup" ||
        command.type === "arrive_at_destination") &&
      !nodes.has(command.nodeId)
    )
      invalid();
    if (command.type === "assign_task")
      requireDemoReservationInput({
        sessionId: command.taskId,
        templateWarehouseId: workspace.warehouseId,
      });
    if (command.type === "complete_loading")
      requireDemoReservationInput({
        sessionId: command.loadId,
        templateWarehouseId: workspace.warehouseId,
      });
  };
  return Object.freeze({
    sessionId: sessionId.toLowerCase(),
    warehouseId: workspace.warehouseId,
    equipment: Object.freeze({
      getDescriptor: (equipmentId: string) =>
        run(async () =>
          structuredClone(await publisher.getDescriptor(equipmentId)),
        ),
      getState: (equipmentId: string) =>
        run(async () => structuredClone(await publisher.getState(equipmentId))),
      dispatch: async (inputEnvelope: EquipmentCommandEnvelope) => {
        // Capture accepted intent before queueing; callers cannot mutate a
        // pending command or its dedup identity while another publication waits.
        requireOpen();
        const envelope = structuredClone(inputEnvelope);
        validateCommand(envelope);
        return run(async () => {
          return structuredClone(await publisher.dispatch(envelope));
        });
      },
    }),
    clock: Object.freeze({
      now: () => virtualClock.now(),
      advanceBy: (durationMs: number) => {
        requireOpen();
        virtualClock.advanceBy(durationMs);
      },
      schedule: (delayMs: number, action: () => void) => {
        requireOpen();
        // Lifetime bound also covers cancelled entries retained by ManualClock
        // until the next advance; cancellation cannot replenish memory budget.
        if (scheduledCount >= 1_000)
          throw new Error("Isolated simulator schedule budget exhausted.");
        let scheduledAction: ScheduledAction;
        scheduledAction = virtualClock.schedule(delayMs, () => {
          scheduled.delete(scheduledAction);
          if (!closing) action();
        });
        scheduledCount++;
        scheduled.add(scheduledAction);
        return {
          id: scheduledAction.id,
          cancel: () => {
            scheduledAction.cancel();
            scheduled.delete(scheduledAction);
          },
        };
      },
    }),
    heartbeat: () => run(() => publisher.heartbeat()),
    stop: () => {
      if (stopAttempt) return stopAttempt;
      closing = true;
      for (const action of scheduled) action.cancel();
      scheduled.clear();
      stopAttempt = (async () => {
        await Promise.allSettled([...inFlight]);
        await publisher.disconnect();
      })().catch((error) => {
        stopAttempt = null;
        throw error;
      });
      return stopAttempt;
    },
  });
}
