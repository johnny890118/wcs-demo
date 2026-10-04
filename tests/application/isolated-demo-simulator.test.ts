import { describe, expect, it, vi } from "vitest";
import type { DemoReferenceWorkspace } from "../../src/application/demo/demo-reference-workspace";
import type {
  EquipmentObservationSink,
  EquipmentObservationWrite,
} from "../../src/application/equipment/equipment-observation-sink";
import type { EquipmentCommand } from "../../src/domain/equipment/equipment-state-machine";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { createIsolatedDemoSimulator } from "../../src/infrastructure/simulator/isolated-demo-simulator";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;
const id = (value: number) =>
  `90000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
function workspace(offset = 0): DemoReferenceWorkspace {
  return {
    warehouseId: id(offset + 1),
    topology: {
      warehouseId: id(offset + 1),
      topologyId: id(offset + 2),
      revision: 1,
      status: "active",
      nodes: [
        { nodeId: "pickup", kind: "station", capabilities: [] },
        { nodeId: "dropoff", kind: "station", capabilities: [] },
      ],
      edges: [
        {
          edgeId: "transport",
          fromNodeId: "pickup",
          toNodeId: "dropoff",
          cost: 1,
          status: "available",
          requiredCapabilities: [],
          resourceIds: ["shared-semantic-name"],
        },
      ],
    },
    locations: [],
    bindings: [],
    equipment: [createMobileTransportDescriptor(id(offset + 3))],
    referenceMap: {
      locations: {},
      equipment: { "source-equipment": id(offset + 3) },
    },
  };
}
function recorder() {
  const observations: EquipmentObservationWrite[] = [];
  const sink: EquipmentObservationSink = {
    publish: async (observation) => {
      observations.push(structuredClone(observation));
      return "applied";
    },
  };
  return { sink, observations };
}
function make(offset = 0, maximumCommands = 20) {
  const record = recorder();
  const bundle = createIsolatedDemoSimulator(
    runtime,
    id(offset + 4),
    workspace(offset),
    record.sink,
    { maximumCommands },
    () => new Date("2026-10-04T00:00:00Z"),
  );
  return { ...record, bundle, equipmentId: id(offset + 3) };
}
async function send(
  value: ReturnType<typeof make>,
  commandId: string,
  command: EquipmentCommand,
) {
  return value.bundle.equipment.dispatch({
    equipmentId: value.equipmentId,
    commandId,
    command,
  });
}
describe("isolated fresh demo simulator bundles", () => {
  it("uses independent state, command replay, clocks and observation identities", async () => {
    const a = make();
    const b = make(10);
    expect(await a.bundle.equipment.getState(a.equipmentId)).toMatchObject({
      status: "offline",
      nodeId: null,
    });
    expect(
      await send(a, "same-command", { type: "bring_online" }),
    ).toMatchObject({ duplicate: false });
    expect(await b.bundle.equipment.getState(b.equipmentId)).toMatchObject({
      status: "offline",
    });
    expect(
      await send(b, "same-command", { type: "bring_online" }),
    ).toMatchObject({ duplicate: false });
    expect(
      await send(a, "same-command", { type: "bring_online" }),
    ).toMatchObject({ duplicate: true });
    a.bundle.clock.advanceBy(5000);
    expect(a.bundle.clock.now()).toBe(5000);
    expect(b.bundle.clock.now()).toBe(0);
    await send(a, "assign", { type: "assign_task", taskId: id(100) });
    await send(a, "start", { type: "start_pickup" });
    await send(a, "arrive", { type: "arrive_at_pickup", nodeId: "pickup" });
    await send(a, "same-command", { type: "bring_online" });
    expect(a.observations.at(-1)).toMatchObject({
      equipmentId: a.equipmentId,
      topologyId: id(2),
      topologyRevision: 1,
      nodeId: "pickup",
      status: "loading",
    });
    expect(
      b.observations.every(
        (observation) => observation.equipmentId === b.equipmentId,
      ),
    ).toBe(true);
    expect(await b.bundle.equipment.getState(b.equipmentId)).toMatchObject({
      status: "idle",
      nodeId: null,
      taskId: null,
    });
  });
  it("denies foreign equipment and node commands before mutation or publication", async () => {
    const a = make();
    const b = make(10);
    expect(await a.bundle.equipment.getState(b.equipmentId)).toBeNull();
    expect(await a.bundle.equipment.getDescriptor(b.equipmentId)).toBeNull();
    await expect(
      a.bundle.equipment.dispatch({
        equipmentId: b.equipmentId,
        commandId: "foreign",
        command: { type: "bring_online" },
      }),
    ).rejects.toThrow("Invalid");
    await expect(
      send(a, "bad-node", { type: "arrive_at_pickup", nodeId: "foreign-node" }),
    ).rejects.toThrow("Invalid");
    expect(a.observations).toHaveLength(0);
    expect(await a.bundle.equipment.getState(a.equipmentId)).toMatchObject({
      status: "offline",
      version: 0,
    });
  });
  it("defensively copies input descriptors, reads and accepted results", async () => {
    const input = workspace();
    const record = recorder();
    const bundle = createIsolatedDemoSimulator(
      runtime,
      id(4),
      input,
      record.sink,
      { maximumCommands: 10 },
    );
    (input.equipment[0].capabilities as string[]).push("mutated-input");
    const descriptor = await bundle.equipment.getDescriptor(id(3));
    expect(descriptor?.capabilities).not.toContain("mutated-input");
    (descriptor!.capabilities as string[]).push("mutated-read");
    expect(
      (await bundle.equipment.getDescriptor(id(3)))?.capabilities,
    ).not.toContain("mutated-read");
    const result = await bundle.equipment.dispatch({
      equipmentId: id(3),
      commandId: "online",
      command: { type: "bring_online" },
    });
    (result.transition.state as { status: string }).status = "faulted";
    const state = await bundle.equipment.getState(id(3));
    expect(state?.status).toBe("idle");
    (state as { status: string }).status = "unknown";
    expect((await bundle.equipment.getState(id(3)))?.status).toBe("idle");
  });
  it("preserves original dedup results at the command budget and never evicts them", async () => {
    const a = make(0, 1);
    await send(a, "online", { type: "bring_online" });
    await expect(send(a, "offline", { type: "mark_offline" })).rejects.toThrow(
      "budget exhausted",
    );
    expect(await send(a, "online", { type: "bring_online" })).toMatchObject({
      duplicate: true,
    });
    await expect(send(a, "online", { type: "mark_offline" })).rejects.toThrow(
      "reused with different content",
    );
    expect(await a.bundle.equipment.getState(a.equipmentId)).toMatchObject({
      status: "idle",
    });
  });
  it("bounds cancelled scheduled actions for the entire bundle lifetime", async () => {
    const a = make();
    const action = vi.fn();
    for (let i = 0; i < 1000; i++)
      a.bundle.clock.schedule(100, action).cancel();
    expect(() => a.bundle.clock.schedule(100, action)).toThrow(
      "schedule budget exhausted",
    );
    a.bundle.clock.advanceBy(100);
    expect(action).not.toHaveBeenCalled();
    await a.bundle.stop();
  });
  it("stops scheduled actions and all new work while leaving other sessions available", async () => {
    const a = make();
    const b = make(10);
    const action = vi.fn();
    a.bundle.clock.schedule(100, action);
    await a.bundle.stop();
    await a.bundle.stop();
    expect(() => a.bundle.clock.advanceBy(100)).toThrow("stopped");
    expect(() => a.bundle.clock.schedule(1, action)).toThrow("stopped");
    await expect(a.bundle.heartbeat()).rejects.toThrow("stopped");
    await expect(a.bundle.equipment.getState(a.equipmentId)).rejects.toThrow(
      "stopped",
    );
    await expect(send(a, "online", { type: "bring_online" })).rejects.toThrow(
      "stopped",
    );
    expect(action).not.toHaveBeenCalled();
    expect(a.observations.at(-1)).toMatchObject({
      connectionStatus: "disconnected",
      quality: "unknown",
    });
    await send(b, "online", { type: "bring_online" });
  });
  it("waits for in-flight publication before recording disconnect", async () => {
    const record = recorder();
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let first = true;
    const bundle = createIsolatedDemoSimulator(
      runtime,
      id(4),
      workspace(),
      {
        publish: async (observation) => {
          if (first) {
            first = false;
            entered();
            await gate;
          }
          return record.sink.publish(observation);
        },
      },
      { maximumCommands: 10 },
    );
    const dispatch = bundle.equipment.dispatch({
      equipmentId: id(3),
      commandId: "online",
      command: { type: "bring_online" },
    });
    await started;
    let stopped = false;
    const stop = bundle.stop().then(() => {
      stopped = true;
    });
    await expect(bundle.heartbeat()).rejects.toThrow("stopped");
    expect(stopped).toBe(false);
    release();
    await dispatch;
    await stop;
    expect(record.observations.map((value) => value.connectionStatus)).toEqual([
      "connected",
      "disconnected",
    ]);
    expect(record.observations.map((value) => value.sequence)).toEqual([0, 1]);
  });
  it("serializes heartbeat capture behind transitions and bounds pending work", async () => {
    const record = recorder();
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let first = true;
    const bundle = createIsolatedDemoSimulator(
      runtime,
      id(4),
      workspace(),
      {
        publish: async (observation) => {
          if (first) {
            first = false;
            entered();
            await gate;
          }
          return record.sink.publish(observation);
        },
      },
      { maximumCommands: 10, maximumPendingOperations: 2 },
    );
    const dispatch = bundle.equipment.dispatch({
      equipmentId: id(3),
      commandId: "online",
      command: { type: "bring_online" },
    });
    await started;
    const heartbeat = bundle.heartbeat();
    await expect(bundle.equipment.getState(id(3))).rejects.toThrow(
      "pending-operation budget exhausted",
    );
    release();
    await dispatch;
    await heartbeat;
    expect(record.observations.map((value) => value.status)).toEqual([
      "idle",
      "idle",
    ]);
    expect(record.observations.map((value) => value.sequence)).toEqual([0, 1]);
    await bundle.stop();
  });

  it("captures command intent before queueing and rejects invalid payload without occupying a slot", async () => {
    const record = recorder();
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let first = true;
    const bundle = createIsolatedDemoSimulator(
      runtime,
      id(4),
      workspace(),
      {
        publish: async (observation) => {
          if (first) {
            first = false;
            entered();
            await gate;
          }
          return record.sink.publish(observation);
        },
      },
      { maximumCommands: 10, maximumPendingOperations: 2 },
    );
    const online = bundle.equipment.dispatch({
      equipmentId: id(3),
      commandId: "online",
      command: { type: "bring_online" },
    });
    await started;
    await expect(
      bundle.equipment.dispatch({
        equipmentId: id(3),
        commandId: "x".repeat(121),
        command: { type: "mark_offline" },
      }),
    ).rejects.toThrow("Invalid");
    const envelope = {
      equipmentId: id(3),
      commandId: "original",
      command: { type: "assign_task" as const, taskId: id(100) },
    };
    const assigning = bundle.equipment.dispatch(envelope);
    envelope.commandId = "mutated";
    envelope.command.taskId = id(101);
    release();
    await online;
    await assigning;
    expect(await bundle.equipment.getState(id(3))).toMatchObject({
      status: "assigned",
      taskId: id(100),
    });
    expect(
      await bundle.equipment.dispatch({
        equipmentId: id(3),
        commandId: "original",
        command: { type: "assign_task", taskId: id(100) },
      }),
    ).toMatchObject({ duplicate: true });
    await bundle.stop();
  });

  it("does not report failed disconnect as success and permits a safe retry", async () => {
    let fail = true;
    const record = recorder();
    const bundle = createIsolatedDemoSimulator(
      runtime,
      id(4),
      workspace(),
      {
        publish: async (observation) => {
          if (fail) throw new Error("sink unavailable");
          return record.sink.publish(observation);
        },
      },
      { maximumCommands: 10 },
    );
    await expect(bundle.stop()).rejects.toThrow("sink unavailable");
    await expect(bundle.heartbeat()).rejects.toThrow("stopped");
    fail = false;
    await bundle.stop();
    expect(record.observations).toHaveLength(1);
    expect(record.observations[0]).toMatchObject({
      sequence: 0,
      connectionStatus: "disconnected",
      quality: "unknown",
    });
  });
  it("rejects unknown adapters, opaque constraints, bad ownership and invalid budgets", () => {
    const record = recorder();
    for (const value of [
      { ...workspace(), warehouseId: id(100) },
      {
        ...workspace(),
        referenceMap: { locations: {}, equipment: { source: id(100) } },
      },
      {
        ...workspace(),
        equipment: [
          { ...workspace().equipment[0], adapterKey: "hardware.vendor" },
        ],
      },
      {
        ...workspace(),
        equipment: [
          {
            ...workspace().equipment[0],
            constraints: { siteEndpoint: "opaque" },
          },
        ],
      },
    ])
      expect(() =>
        createIsolatedDemoSimulator(runtime, id(4), value, record.sink, {
          maximumCommands: 10,
        }),
      ).toThrow();
    for (const maximumCommands of [0, 1001, 1.5, NaN, Infinity])
      expect(() =>
        createIsolatedDemoSimulator(runtime, id(4), workspace(), record.sink, {
          maximumCommands,
        }),
      ).toThrow();
    expect(record.observations).toHaveLength(0);
    for (const maximumProcessedCommands of [0, 100001, 1.5, NaN, Infinity])
      expect(
        () => new SimulatorEquipmentAdapter({ maximumProcessedCommands }),
      ).toThrow();
  });
  it("rejects malformed command references and bounded payloads without spending budget", async () => {
    const a = make(0, 1);
    for (const command of [
      { type: "assign_task", taskId: "foreign" },
      { type: "complete_loading", loadId: "foreign" },
      { type: "recover", strategy: "invalid" },
      { type: "inject_fault", faultCode: " " },
    ] as unknown as EquipmentCommand[]) {
      await expect(send(a, "invalid", command)).rejects.toThrow();
    }
    await expect(
      send(a, "x".repeat(121), { type: "bring_online" }),
    ).rejects.toThrow();
    await send(a, "valid", { type: "bring_online" });
    expect(a.observations).toHaveLength(1);
  });
  it("hard-denies private/production/hardware profiles before local registration", () => {
    const record = recorder();
    for (const deploymentProfile of [
      "private_demo",
      "pilot",
      "production",
    ] as const)
      expect(() =>
        createIsolatedDemoSimulator(
          { ...runtime, deploymentProfile },
          id(4),
          workspace(),
          record.sink,
          { maximumCommands: 10 },
        ),
      ).toThrow("UNAVAILABLE");
    for (const equipmentSource of ["hardware", "hybrid"] as const)
      expect(() =>
        createIsolatedDemoSimulator(
          { ...runtime, equipmentSource },
          id(4),
          workspace(),
          record.sink,
          { maximumCommands: 10 },
        ),
      ).toThrow("UNAVAILABLE");
  });
});
