import type { EquipmentPort } from "../equipment/equipment-port";
import type { Clock } from "../time/clock";
import {
  inboundTransportCapabilities,
  supportsCapabilities,
} from "../../domain/equipment/equipment-descriptor";

export type PersistedInboundTask = Readonly<{
  taskId: string;
  receiptId: string;
  loadId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  status: "queued" | "assigned" | "in_progress" | "unknown";
  equipmentId: string | null;
  version: number;
}>;

export type TransitionMetadata = Readonly<{
  outboxEventId: string;
  auditEventId: string;
  confirmationReason?: string;
}>;

export type CompletionMetadata = TransitionMetadata &
  Readonly<{ inventoryUnitId: string }>;

export interface InboundExecutionRepository {
  getTask(taskId: string): Promise<PersistedInboundTask | null>;
  markAssigned(
    taskId: string,
    equipmentId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask>;
  markInProgress(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask>;
  complete(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: CompletionMetadata,
  ): Promise<void>;
  markUnknown(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    reason: string,
    metadata: TransitionMetadata,
  ): Promise<void>;
}

export interface AdvancingClock extends Clock {
  advanceBy(durationMs: number): void;
}

export type ExecuteInboundTask = Readonly<{
  taskId: string;
  equipmentId: string;
  actorId: string;
  confirmationReason: string;
}>;

export type InboundExecutionResult = Readonly<{
  taskId: string;
  equipmentId: string;
  status: "completed";
  completedAt: number;
}>;

export class ExecutionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionConflictError";
  }
}

export class ExecutionTaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Transport task ${taskId} was not found.`);
    this.name = "ExecutionTaskNotFoundError";
  }
}

export class EquipmentExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EquipmentExecutionError";
  }
}

export class DeterministicInboundExecutor {
  constructor(
    private readonly repository: InboundExecutionRepository,
    private readonly equipment: EquipmentPort,
    private readonly clock: AdvancingClock,
    private readonly createId: () => string,
    private readonly stepDurationMs = 1_000,
  ) {}

  async execute(command: ExecuteInboundTask): Promise<InboundExecutionResult> {
    let task = await this.repository.getTask(command.taskId);
    if (!task) throw new ExecutionTaskNotFoundError(command.taskId);
    if (task.status !== "queued") {
      throw new ExecutionConflictError(
        `Transport task ${task.taskId} is ${task.status}, not queued.`,
      );
    }

    const [equipmentState, equipmentDescriptor] = await Promise.all([
      this.equipment.getState(command.equipmentId),
      this.equipment.getDescriptor(command.equipmentId),
    ]);
    if (!equipmentState || !equipmentDescriptor) {
      throw new EquipmentExecutionError(
        `Equipment ${command.equipmentId} is not registered.`,
      );
    }
    if (
      !supportsCapabilities(equipmentDescriptor, inboundTransportCapabilities)
    ) {
      throw new EquipmentExecutionError(
        `Equipment ${command.equipmentId} lacks capabilities required for inbound transport.`,
      );
    }
    if (equipmentState.status !== "idle") {
      throw new ExecutionConflictError(
        `Equipment ${command.equipmentId} is ${equipmentState.status}, not idle.`,
      );
    }

    let executionStarted = false;
    try {
      await this.dispatch(command.equipmentId, {
        type: "assign_task",
        taskId: task.taskId,
      });
      executionStarted = true;
      task = await this.repository.markAssigned(
        task.taskId,
        command.equipmentId,
        task.version,
        command.actorId,
        this.transitionMetadata(command.confirmationReason),
      );

      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, { type: "start_pickup" });
      task = await this.repository.markInProgress(
        task.taskId,
        task.version,
        command.actorId,
        this.transitionMetadata(command.confirmationReason),
      );

      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, {
        type: "arrive_at_pickup",
        nodeId: task.sourceNodeId,
      });
      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, {
        type: "complete_loading",
        loadId: task.loadId,
      });
      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, {
        type: "arrive_at_destination",
        nodeId: task.destinationNodeId,
      });
      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, { type: "complete_unloading" });

      await this.repository.complete(
        task.taskId,
        task.version,
        command.actorId,
        {
          ...this.transitionMetadata(command.confirmationReason),
          inventoryUnitId: this.createId(),
        },
      );

      return {
        taskId: task.taskId,
        equipmentId: command.equipmentId,
        status: "completed",
        completedAt: this.clock.now(),
      };
    } catch (error) {
      if (executionStarted) {
        await this.reconcileAsUnknown(task, command, error);
      }
      throw error;
    }
  }

  private async dispatch(
    equipmentId: string,
    equipmentCommand: Parameters<EquipmentPort["dispatch"]>[0]["command"],
  ): Promise<void> {
    const result = await this.equipment.dispatch({
      commandId: this.createId(),
      equipmentId,
      command: equipmentCommand,
    });
    if (!result.transition.accepted) {
      throw new EquipmentExecutionError(result.transition.message);
    }
  }

  private transitionMetadata(confirmationReason?: string): TransitionMetadata {
    return {
      outboxEventId: this.createId(),
      auditEventId: this.createId(),
      ...(confirmationReason ? { confirmationReason } : {}),
    };
  }

  private async reconcileAsUnknown(
    task: PersistedInboundTask,
    command: ExecuteInboundTask,
    error: unknown,
  ): Promise<void> {
    const reason = error instanceof Error ? error.message : "Unknown failure";
    await Promise.allSettled([
      this.equipment.dispatch({
        commandId: this.createId(),
        equipmentId: command.equipmentId,
        command: { type: "mark_unknown" },
      }),
      this.repository.markUnknown(
        task.taskId,
        task.version,
        command.actorId,
        reason,
        this.transitionMetadata(command.confirmationReason),
      ),
    ]);
  }
}
