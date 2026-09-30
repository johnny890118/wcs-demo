import type { Alarm, AlarmSeverity } from "../../domain/alarm/alarm";
import type { EquipmentPort } from "../equipment/equipment-port";
import type { Clock } from "../time/clock";
import type { AuditActorType } from "../audit/audit-actor";

export type RecoverableTaskStatus =
  | "queued"
  | "assigned"
  | "in_progress"
  | "blocked"
  | "unknown";

export type RecoverableTask = Readonly<{
  taskId: string;
  warehouseId: string;
  equipmentId: string | null;
  status: RecoverableTaskStatus;
  blockingAlarmId: string | null;
  version: number;
}>;

export type PersistedAlarm = Alarm &
  Readonly<{
    warehouseId: string;
    taskId: string;
    equipmentId: string;
    previousTaskStatus: "assigned" | "in_progress";
  }>;

export type RecoveryMetadata = Readonly<{
  outboxEventId: string;
  auditEventId: string;
}>;

export interface FaultRecoveryRepository {
  getTask(
    taskId: string,
    warehouseId?: string,
  ): Promise<RecoverableTask | null>;
  blockForFault(input: {
    task: RecoverableTask & {
      status: "assigned" | "in_progress";
      equipmentId: string;
    };
    alarm: Pick<
      PersistedAlarm,
      "alarmId" | "code" | "severity" | "message" | "raisedAt"
    >;
    actorId: string;
    actorType: AuditActorType;
    confirmationReason: string;
    metadata: RecoveryMetadata;
  }): Promise<PersistedAlarm>;
  getAlarm(
    alarmId: string,
    warehouseId?: string,
  ): Promise<PersistedAlarm | null>;
  acknowledge(input: {
    alarmId: string;
    warehouseId: string;
    expectedVersion: number;
    actorId: string;
    actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
    confirmationReason: string;
    at: number;
    metadata: RecoveryMetadata;
  }): Promise<PersistedAlarm>;
  recover(input: {
    alarm: PersistedAlarm;
    taskVersion: number;
    strategy: "resume" | "release";
    actorId: string;
    actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
    at: number;
    resolution: string;
    confirmationReason: string;
    metadata: RecoveryMetadata;
  }): Promise<RecoverableTask>;
  markUnknown(input: {
    taskId: string;
    warehouseId: string;
    expectedVersion: number;
    actorId: string;
    actorType: AuditActorType;
    reason: string;
    metadata: RecoveryMetadata;
  }): Promise<void>;
}

export class FaultRecoveryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaultRecoveryNotFoundError";
  }
}

export class FaultRecoveryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaultRecoveryConflictError";
  }
}

export class FaultRecoveryEquipmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaultRecoveryEquipmentError";
  }
}

export class FaultRecoveryService {
  constructor(
    private readonly repository: FaultRecoveryRepository,
    private readonly equipment: EquipmentPort,
    private readonly clock: Clock,
    private readonly createId: () => string,
  ) {}

  async injectFault(command: {
    taskId: string;
    faultCode: string;
    severity: AlarmSeverity;
    message: string;
    actorId: string;
    actorType: AuditActorType;
    confirmationReason: string;
  }): Promise<PersistedAlarm> {
    const task = await this.repository.getTask(command.taskId);
    if (!task) {
      throw new FaultRecoveryNotFoundError(
        `Transport task ${command.taskId} was not found.`,
      );
    }
    if (
      (task.status !== "assigned" && task.status !== "in_progress") ||
      !task.equipmentId
    ) {
      throw new FaultRecoveryConflictError(
        `Transport task ${task.taskId} is ${task.status} and cannot accept a fault.`,
      );
    }

    const equipmentState = await this.equipment.getState(task.equipmentId);
    if (!equipmentState) {
      throw new FaultRecoveryEquipmentError(
        `Equipment ${task.equipmentId} is not registered.`,
      );
    }
    if (equipmentState.taskId !== task.taskId) {
      throw new FaultRecoveryConflictError(
        `Equipment ${task.equipmentId} is not assigned to task ${task.taskId}.`,
      );
    }

    await this.dispatch(task.equipmentId, {
      type: "inject_fault",
      faultCode: command.faultCode,
    });

    try {
      return await this.repository.blockForFault({
        task: {
          ...task,
          status: task.status,
          equipmentId: task.equipmentId,
        },
        alarm: {
          alarmId: this.createId(),
          code: command.faultCode,
          severity: command.severity,
          message: command.message,
          raisedAt: this.clock.now(),
        },
        actorId: command.actorId,
        actorType: command.actorType,
        confirmationReason: command.confirmationReason,
        metadata: this.metadata(),
      });
    } catch (error) {
      await this.reconcileAsUnknown(
        task,
        command.actorId,
        command.actorType,
        error,
      );
      throw error;
    }
  }

  async acknowledge(command: {
    alarmId: string;
    actorId: string;
    actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
    warehouseId: string;
    confirmationReason: string;
  }): Promise<PersistedAlarm> {
    const alarm = await this.repository.getAlarm(
      command.alarmId,
      command.warehouseId,
    );
    if (!alarm) {
      throw new FaultRecoveryNotFoundError(
        `Alarm ${command.alarmId} was not found.`,
      );
    }
    if (alarm.status !== "active") {
      throw new FaultRecoveryConflictError(
        `Alarm ${alarm.alarmId} is ${alarm.status}, not active.`,
      );
    }
    return this.repository.acknowledge({
      alarmId: alarm.alarmId,
      warehouseId: command.warehouseId,
      expectedVersion: alarm.version,
      actorId: command.actorId,
      actorType: command.actorType,
      confirmationReason: command.confirmationReason,
      at: this.clock.now(),
      metadata: this.metadata(),
    });
  }

  async recover(command: {
    alarmId: string;
    strategy: "resume" | "release";
    resolution: string;
    actorId: string;
    actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
    warehouseId: string;
    confirmationReason: string;
  }): Promise<RecoverableTask> {
    const alarm = await this.repository.getAlarm(
      command.alarmId,
      command.warehouseId,
    );
    if (!alarm) {
      throw new FaultRecoveryNotFoundError(
        `Alarm ${command.alarmId} was not found.`,
      );
    }
    if (alarm.status !== "acknowledged") {
      throw new FaultRecoveryConflictError(
        `Alarm ${alarm.alarmId} must be acknowledged before recovery.`,
      );
    }
    const task = await this.repository.getTask(
      alarm.taskId,
      command.warehouseId,
    );
    if (
      !task ||
      task.status !== "blocked" ||
      task.blockingAlarmId !== alarm.alarmId ||
      task.equipmentId !== alarm.equipmentId
    ) {
      throw new FaultRecoveryConflictError(
        `Task ${alarm.taskId} is not safely recoverable from alarm ${alarm.alarmId}.`,
      );
    }

    await this.dispatch(alarm.equipmentId, {
      type: "recover",
      strategy: command.strategy,
    });
    try {
      return await this.repository.recover({
        alarm,
        taskVersion: task.version,
        strategy: command.strategy,
        actorId: command.actorId,
        actorType: command.actorType,
        at: this.clock.now(),
        resolution: command.resolution,
        confirmationReason: command.confirmationReason,
        metadata: this.metadata(),
      });
    } catch (error) {
      await this.reconcileAsUnknown(
        task,
        command.actorId,
        command.actorType,
        error,
      );
      throw error;
    }
  }

  private async dispatch(
    equipmentId: string,
    command: Parameters<EquipmentPort["dispatch"]>[0]["command"],
  ): Promise<void> {
    const result = await this.equipment.dispatch({
      commandId: this.createId(),
      equipmentId,
      command,
    });
    if (!result.transition.accepted) {
      throw new FaultRecoveryEquipmentError(result.transition.message);
    }
  }

  private metadata(): RecoveryMetadata {
    return { outboxEventId: this.createId(), auditEventId: this.createId() };
  }

  private async reconcileAsUnknown(
    task: RecoverableTask,
    actorId: string,
    actorType: AuditActorType,
    error: unknown,
  ): Promise<void> {
    if (!task.equipmentId) return;
    const reason = error instanceof Error ? error.message : "Unknown failure";
    await Promise.allSettled([
      this.equipment.dispatch({
        commandId: this.createId(),
        equipmentId: task.equipmentId,
        command: { type: "mark_unknown" },
      }),
      this.repository.markUnknown({
        taskId: task.taskId,
        warehouseId: task.warehouseId,
        expectedVersion: task.version,
        actorId,
        actorType,
        reason,
        metadata: this.metadata(),
      }),
    ]);
  }
}
