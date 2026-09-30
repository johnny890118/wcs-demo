import type { EquipmentPort } from "../equipment/equipment-port";
import type { Clock } from "../time/clock";
import type { AuditActorType } from "../audit/audit-actor";
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
  actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
  confirmationReason?: string;
}>;

export type CompletionMetadata = TransitionMetadata &
  Readonly<{ inventoryUnitId: string }>;

export interface InboundExecutionRepository {
  getTask(
    taskId: string,
    warehouseId: string,
  ): Promise<PersistedInboundTask | null>;
  isEquipmentAvailableInWarehouse(
    equipmentId: string,
    warehouseId: string,
  ): Promise<boolean>;
  markAssigned(
    taskId: string,
    warehouseId: string,
    equipmentId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask>;
  markInProgress(
    taskId: string,
    warehouseId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask>;
  complete(
    taskId: string,
    warehouseId: string,
    expectedVersion: number,
    actorId: string,
    metadata: CompletionMetadata,
  ): Promise<void>;
  markUnknown(
    taskId: string,
    warehouseId: string,
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
  actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
  warehouseId: string;
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
    let task = await this.repository.getTask(
      command.taskId,
      command.warehouseId,
    );
    if (!task) throw new ExecutionTaskNotFoundError(command.taskId);
    if (task.status !== "queued") {
      throw new ExecutionConflictError(
        `Transport task ${task.taskId} is ${task.status}, not queued.`,
      );
    }

    const [equipmentInWarehouse, equipmentState, equipmentDescriptor] =
      await Promise.all([
        this.repository.isEquipmentAvailableInWarehouse(
          command.equipmentId,
          command.warehouseId,
        ),
        this.equipment.getState(command.equipmentId),
        this.equipment.getDescriptor(command.equipmentId),
      ]);
    if (!equipmentInWarehouse || !equipmentState || !equipmentDescriptor) {
      throw new EquipmentExecutionError(
        `Equipment ${command.equipmentId} is not available in the current warehouse.`,
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
        command.warehouseId,
        command.equipmentId,
        task.version,
        command.actorId,
        this.transitionMetadata(command.confirmationReason, command.actorType),
      );

      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, { type: "start_pickup" });
      task = await this.repository.markInProgress(
        task.taskId,
        command.warehouseId,
        task.version,
        command.actorId,
        this.transitionMetadata(command.confirmationReason, command.actorType),
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
        command.warehouseId,
        task.version,
        command.actorId,
        {
          ...this.transitionMetadata(
            command.confirmationReason,
            command.actorType,
          ),
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

  private transitionMetadata(
    confirmationReason: string | undefined,
    actorType: Extract<AuditActorType, "user" | "anonymous_demo">,
  ): TransitionMetadata {
    return {
      outboxEventId: this.createId(),
      auditEventId: this.createId(),
      actorType,
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
        command.warehouseId,
        task.version,
        command.actorId,
        reason,
        this.transitionMetadata(command.confirmationReason, command.actorType),
      ),
    ]);
  }
}
