import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import type {
  AlarmSeverity,
  AlarmStatus,
} from "../../../../src/domain/alarm/alarm";
import {
  FaultRecoveryConflictError,
  type FaultRecoveryRepository,
  type PersistedAlarm,
  type RecoverableTask,
  type RecoveryMetadata,
} from "../../../../src/application/recovery/fault-recovery";
import { DATABASE_POOL } from "../database/database.module";

type TaskRow = {
  task_id: string;
  equipment_id: string | null;
  status: RecoverableTask["status"];
  blocking_alarm_id: string | null;
  version: number;
};

type AlarmRow = {
  alarm_id: string;
  transport_task_id: string;
  equipment_id: string;
  source_id: string;
  code: string;
  severity: AlarmSeverity;
  message: string;
  status: AlarmStatus;
  previous_task_status: "assigned" | "in_progress";
  raised_at: Date;
  acknowledged_at: Date | null;
  acknowledged_by: string | null;
  cleared_at: Date | null;
  cleared_by: string | null;
  resolution: string | null;
  version: number;
};

function toTask(row: TaskRow): RecoverableTask {
  return {
    taskId: row.task_id,
    equipmentId: row.equipment_id,
    status: row.status,
    blockingAlarmId: row.blocking_alarm_id,
    version: row.version,
  };
}

function toAlarm(row: AlarmRow): PersistedAlarm {
  return {
    alarmId: row.alarm_id,
    taskId: row.transport_task_id,
    equipmentId: row.equipment_id,
    sourceId: row.source_id,
    code: row.code,
    severity: row.severity,
    message: row.message,
    status: row.status,
    previousTaskStatus: row.previous_task_status,
    raisedAt: row.raised_at.getTime(),
    acknowledgedAt: row.acknowledged_at?.getTime() ?? null,
    acknowledgedBy: row.acknowledged_by,
    clearedAt: row.cleared_at?.getTime() ?? null,
    clearedBy: row.cleared_by,
    resolution: row.resolution,
    version: row.version,
  };
}

@Injectable()
export class PgFaultRecoveryRepository implements FaultRecoveryRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getTask(taskId: string): Promise<RecoverableTask | null> {
    const result = await this.pool.query<TaskRow>(
      `SELECT id AS task_id, equipment_id, status, blocking_alarm_id, version
       FROM transport_tasks
       WHERE id = $1 AND status IN ('assigned', 'in_progress', 'blocked', 'unknown')`,
      [taskId],
    );
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  blockForFault(
    input: Parameters<FaultRecoveryRepository["blockForFault"]>[0],
  ): Promise<PersistedAlarm> {
    return this.withTransaction(async (client) => {
      const alarm = await client.query<AlarmRow>(
        `${this.alarmInsert()} RETURNING ${this.alarmColumns()}`,
        [
          input.alarm.alarmId,
          input.task.taskId,
          input.task.equipmentId,
          input.alarm.code,
          input.alarm.severity,
          input.alarm.message,
          input.task.status,
          new Date(input.alarm.raisedAt),
        ],
      );
      const task = await client.query<TaskRow>(
        `UPDATE transport_tasks
         SET status = 'blocked', blocking_alarm_id = $4, version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND status = $3 AND equipment_id = $5
         RETURNING id AS task_id, equipment_id, status, blocking_alarm_id, version`,
        [
          input.task.taskId,
          input.task.version,
          input.task.status,
          input.alarm.alarmId,
          input.task.equipmentId,
        ],
      );
      if (!task.rows[0]) throw this.conflict(input.task.taskId);
      await this.record(
        client,
        input.metadata,
        input.actorId,
        "transport_task.block_for_fault",
        "TransportTaskBlockedByFault",
        input.task.taskId,
        {
          alarmId: input.alarm.alarmId,
          equipmentId: input.task.equipmentId,
          faultCode: input.alarm.code,
          severity: input.alarm.severity,
          confirmationReason: input.confirmationReason,
        },
      );
      return toAlarm(alarm.rows[0]!);
    });
  }

  async getAlarm(alarmId: string): Promise<PersistedAlarm | null> {
    const result = await this.pool.query<AlarmRow>(
      `SELECT ${this.alarmColumns()} FROM alarms WHERE id = $1`,
      [alarmId],
    );
    return result.rows[0] ? toAlarm(result.rows[0]) : null;
  }

  acknowledge(
    input: Parameters<FaultRecoveryRepository["acknowledge"]>[0],
  ): Promise<PersistedAlarm> {
    return this.withTransaction(async (client) => {
      const result = await client.query<AlarmRow>(
        `UPDATE alarms
         SET status = 'acknowledged', acknowledged_at = $3, acknowledged_by = $4,
           version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND status = 'active'
         RETURNING ${this.alarmColumns()}`,
        [
          input.alarmId,
          input.expectedVersion,
          new Date(input.at),
          input.actorId,
        ],
      );
      const alarm = result.rows[0];
      if (!alarm) throw this.conflict(input.alarmId);
      await this.record(
        client,
        input.metadata,
        input.actorId,
        "alarm.acknowledge",
        "AlarmAcknowledged",
        input.alarmId,
        { taskId: alarm.transport_task_id, equipmentId: alarm.equipment_id },
        "Alarm",
      );
      return toAlarm(alarm);
    });
  }

  recover(
    input: Parameters<FaultRecoveryRepository["recover"]>[0],
  ): Promise<RecoverableTask> {
    return this.withTransaction(async (client) => {
      const destinationStatus =
        input.strategy === "resume" ? input.alarm.previousTaskStatus : "queued";
      const task = await client.query<TaskRow>(
        `UPDATE transport_tasks
         SET status = $4,
           equipment_id = CASE WHEN $5 = 'release' THEN NULL ELSE equipment_id END,
           blocking_alarm_id = NULL, version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND status = 'blocked' AND blocking_alarm_id = $3
         RETURNING id AS task_id, equipment_id, status, blocking_alarm_id, version`,
        [
          input.alarm.taskId,
          input.taskVersion,
          input.alarm.alarmId,
          destinationStatus,
          input.strategy,
        ],
      );
      if (!task.rows[0]) throw this.conflict(input.alarm.taskId);

      const alarm = await client.query(
        `UPDATE alarms
         SET status = 'cleared', cleared_at = $3, cleared_by = $4, resolution = $5,
           version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND status = 'acknowledged'`,
        [
          input.alarm.alarmId,
          input.alarm.version,
          new Date(input.at),
          input.actorId,
          input.resolution,
        ],
      );
      if (alarm.rowCount !== 1) throw this.conflict(input.alarm.alarmId);

      await this.record(
        client,
        input.metadata,
        input.actorId,
        `transport_task.recover_${input.strategy}`,
        input.strategy === "resume"
          ? "TransportTaskResumed"
          : "TransportTaskReleasedForReassignment",
        input.alarm.taskId,
        {
          alarmId: input.alarm.alarmId,
          equipmentId: input.alarm.equipmentId,
          resolution: input.resolution,
          strategy: input.strategy,
          confirmationReason: input.confirmationReason,
        },
      );
      return toTask(task.rows[0]);
    });
  }

  markUnknown(
    input: Parameters<FaultRecoveryRepository["markUnknown"]>[0],
  ): Promise<void> {
    return this.withTransaction(async (client) => {
      const task = await client.query<TaskRow>(
        `UPDATE transport_tasks SET status = 'unknown', version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2 AND status IN ('assigned', 'in_progress', 'blocked')
         RETURNING id AS task_id, equipment_id, status, blocking_alarm_id, version`,
        [input.taskId, input.expectedVersion],
      );
      if (!task.rows[0]) throw this.conflict(input.taskId);
      await this.record(
        client,
        input.metadata,
        input.actorId,
        "transport_task.mark_unknown",
        "TransportTaskOutcomeUnknown",
        input.taskId,
        { reason: input.reason },
      );
    });
  }

  private alarmInsert(): string {
    return `INSERT INTO alarms
      (id, transport_task_id, equipment_id, source_id, code, severity, message,
       status, previous_task_status, raised_at)
      VALUES ($1, $2, $3, $3, $4, $5, $6, 'active', $7, $8)`;
  }

  private alarmColumns(): string {
    return `id AS alarm_id, transport_task_id, equipment_id, source_id, code, severity,
      message, status, previous_task_status, raised_at, acknowledged_at,
      acknowledged_by, cleared_at, cleared_by, resolution, version`;
  }

  private async record(
    client: PoolClient,
    metadata: RecoveryMetadata,
    actorId: string,
    action: string,
    eventType: string,
    aggregateId: string,
    details: Record<string, unknown>,
    aggregateType = "TransportTask",
  ): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        metadata.outboxEventId,
        aggregateType,
        aggregateId,
        eventType,
        JSON.stringify(details),
      ],
    );
    await client.query(
      `INSERT INTO audit_events
       (id, actor_type, actor_id, action, aggregate_type, aggregate_id, details)
       VALUES ($1, 'service', $2, $3, $4, $5, $6::jsonb)`,
      [
        metadata.auditEventId,
        actorId,
        action,
        aggregateType,
        aggregateId,
        JSON.stringify(details),
      ],
    );
  }

  private async withTransaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private conflict(id: string): FaultRecoveryConflictError {
    return new FaultRecoveryConflictError(
      `Fault recovery state for ${id} changed concurrently.`,
    );
  }
}
