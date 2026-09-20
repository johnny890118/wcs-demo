import type { EquipmentPort } from "../equipment/equipment-port";
import type { Clock } from "../time/clock";
import {
  inboundTransportCapabilities,
  supportsCapabilities,
} from "../../domain/equipment/equipment-descriptor";
import {
  EquipmentExecutionError,
  ExecutionConflictError,
  ExecutionTaskNotFoundError,
  type AdvancingClock,
  type TransitionMetadata,
} from "./inbound-execution";

export type PersistedOutboundTask = Readonly<{
  taskId: string;
  outboundOrderId: string;
  allocationId: string;
  inventoryUnitId: string;
  quantity: number;
  sourceLocationId: string;
  destinationLocationId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  status: "queued" | "assigned" | "in_progress" | "unknown";
  equipmentId: string | null;
  version: number;
}>;

export interface OutboundExecutionRepository {
  getTask(taskId: string): Promise<PersistedOutboundTask | null>;
  markAssigned(
    taskId: string,
    equipmentId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedOutboundTask>;
  markInProgress(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedOutboundTask>;
  complete(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<void>;
  markUnknown(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    reason: string,
    metadata: TransitionMetadata,
  ): Promise<void>;
}

export type OutboundExecutionResult = Readonly<{
  taskId: string;
  equipmentId: string;
  status: "completed";
  completedAt: number;
}>;

export class DeterministicOutboundExecutor {
  constructor(
    private readonly repository: OutboundExecutionRepository,
    private readonly equipment: EquipmentPort,
    private readonly clock: AdvancingClock & Clock,
    private readonly createId: () => string,
    private readonly stepDurationMs = 1_000,
  ) {}

  async execute(command: {
    taskId: string;
    equipmentId: string;
    actorId: string;
    confirmationReason: string;
  }): Promise<OutboundExecutionResult> {
    let task = await this.repository.getTask(command.taskId);
    if (!task) throw new ExecutionTaskNotFoundError(command.taskId);
    if (task.status !== "queued") {
      throw new ExecutionConflictError(
        `Transport task ${task.taskId} is ${task.status}, not queued.`,
      );
    }

    const [equipmentState, descriptor] = await Promise.all([
      this.equipment.getState(command.equipmentId),
      this.equipment.getDescriptor(command.equipmentId),
    ]);
    if (!equipmentState || !descriptor) {
      throw new EquipmentExecutionError(
        `Equipment ${command.equipmentId} is not registered.`,
      );
    }
    if (!supportsCapabilities(descriptor, inboundTransportCapabilities)) {
      throw new EquipmentExecutionError(
        `Equipment ${command.equipmentId} lacks capabilities required for outbound transport.`,
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
        this.metadata(command.confirmationReason),
      );

      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, { type: "start_pickup" });
      task = await this.repository.markInProgress(
        task.taskId,
        task.version,
        command.actorId,
        this.metadata(command.confirmationReason),
      );
      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, {
        type: "arrive_at_pickup",
        nodeId: task.sourceNodeId,
      });
      this.clock.advanceBy(this.stepDurationMs);
      await this.dispatch(command.equipmentId, {
        type: "complete_loading",
        loadId: task.inventoryUnitId,
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
        this.metadata(command.confirmationReason),
      );
      return {
        taskId: task.taskId,
        equipmentId: command.equipmentId,
        status: "completed",
        completedAt: this.clock.now(),
      };
    } catch (error) {
      if (executionStarted) {
        const reason =
          error instanceof Error ? error.message : "Unknown failure";
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
            this.metadata(command.confirmationReason),
          ),
        ]);
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

  private metadata(confirmationReason: string): TransitionMetadata {
    return {
      outboxEventId: this.createId(),
      auditEventId: this.createId(),
      confirmationReason,
    };
  }
}
