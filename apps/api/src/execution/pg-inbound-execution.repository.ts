import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import {
  ExecutionConflictError,
  type CompletionMetadata,
  type InboundExecutionRepository,
  type PersistedInboundTask,
  type TransitionMetadata,
} from "../../../../src/application/execution/inbound-execution";
import { DATABASE_POOL } from "../database/database.module";

type TaskRow = {
  task_id: string;
  receipt_id: string;
  load_id: string;
  source_location_id: string;
  destination_location_id: string;
  status: PersistedInboundTask["status"];
  equipment_id: string | null;
  version: number;
};

type CompletingTaskRow = TaskRow & { destination_location_id: string };

function toTask(row: TaskRow): PersistedInboundTask {
  return {
    taskId: row.task_id,
    receiptId: row.receipt_id,
    loadId: row.load_id,
    sourceLocationId: row.source_location_id,
    destinationLocationId: row.destination_location_id,
    status: row.status,
    equipmentId: row.equipment_id,
    version: row.version,
  };
}

@Injectable()
export class PgInboundExecutionRepository
  implements InboundExecutionRepository
{
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getTask(taskId: string): Promise<PersistedInboundTask | null> {
    const result = await this.pool.query<TaskRow>(
      `${this.taskSelection()} WHERE id = $1 AND receipt_id IS NOT NULL`,
      [taskId],
    );
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  markAssigned(
    taskId: string,
    equipmentId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask> {
    return this.transition(
      taskId,
      expectedVersion,
      "queued",
      "assigned",
      actorId,
      metadata,
      equipmentId,
    );
  }

  markInProgress(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask> {
    return this.transition(
      taskId,
      expectedVersion,
      "assigned",
      "in_progress",
      actorId,
      metadata,
    );
  }

  async complete(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    metadata: CompletionMetadata,
  ): Promise<void> {
    await this.withTransaction(async (client) => {
      const taskResult = await client.query<CompletingTaskRow>(
        `UPDATE transport_tasks
         SET status = 'completed', version = version + 1, updated_at = now()
         WHERE id = $1 AND status = 'in_progress' AND version = $2
         RETURNING id AS task_id, receipt_id, load_id, source_location_id,
           destination_location_id, status, equipment_id, version`,
        [taskId, expectedVersion],
      );
      const task = taskResult.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);

      const loadResult = await client.query<{ sku: string; quantity: number }>(
        `UPDATE loads
         SET status = 'stored', current_location_id = $2,
           version = version + 1, updated_at = now()
         WHERE id = $1 AND status = 'received'
         RETURNING sku, quantity`,
        [task.load_id, task.destination_location_id],
      );
      const load = loadResult.rows[0];
      if (!load) {
        throw new ExecutionConflictError(
          `Load ${task.load_id} is not eligible for storage confirmation.`,
        );
      }

      const receiptResult = await client.query(
        `UPDATE inbound_receipts
         SET status = 'completed', version = version + 1, updated_at = now()
         WHERE id = $1 AND status IN ('requested', 'in_progress')`,
        [task.receipt_id],
      );
      if (receiptResult.rowCount !== 1) {
        throw new ExecutionConflictError(
          `Receipt ${task.receipt_id} is not eligible for completion.`,
        );
      }

      await client.query(
        `INSERT INTO inventory_units
          (id, load_id, sku, quantity, location_id, status)
         VALUES ($1, $2, $3, $4, $5, 'available')`,
        [
          metadata.inventoryUnitId,
          task.load_id,
          load.sku,
          load.quantity,
          task.destination_location_id,
        ],
      );
      await this.recordTransition(
        client,
        taskId,
        actorId,
        "transport_task.complete",
        "TransportTaskCompleted",
        {
          loadId: task.load_id,
          receiptId: task.receipt_id,
          inventoryUnitId: metadata.inventoryUnitId,
          destinationLocationId: task.destination_location_id,
        },
        metadata,
      );
    });
  }

  async markUnknown(
    taskId: string,
    expectedVersion: number,
    actorId: string,
    reason: string,
    metadata: TransitionMetadata,
  ): Promise<void> {
    await this.withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE transport_tasks
         SET status = 'unknown', version = version + 1, updated_at = now()
         WHERE id = $1 AND version = $2
           AND status IN ('queued', 'assigned', 'in_progress', 'blocked')`,
        [taskId, expectedVersion],
      );
      if (result.rowCount !== 1) throw this.conflict(taskId, expectedVersion);

      await this.recordTransition(
        client,
        taskId,
        actorId,
        "transport_task.mark_unknown",
        "TransportTaskOutcomeUnknown",
        { reason },
        metadata,
      );
    });
  }

  private async transition(
    taskId: string,
    expectedVersion: number,
    fromStatus: "queued" | "assigned",
    toStatus: "assigned" | "in_progress",
    actorId: string,
    metadata: TransitionMetadata,
    equipmentId?: string,
  ): Promise<PersistedInboundTask> {
    return this.withTransaction(async (client) => {
      const result = await client.query<TaskRow>(
        `UPDATE transport_tasks
         SET status = $3,
           equipment_id = COALESCE($4, equipment_id),
           version = version + 1,
           updated_at = now()
         WHERE id = $1 AND version = $2 AND status = $5
         RETURNING id AS task_id, receipt_id, load_id, source_location_id,
           destination_location_id, status, equipment_id, version`,
        [taskId, expectedVersion, toStatus, equipmentId ?? null, fromStatus],
      );
      const row = result.rows[0];
      if (!row) throw this.conflict(taskId, expectedVersion);

      if (toStatus === "in_progress") {
        await client.query(
          `UPDATE inbound_receipts
           SET status = 'in_progress', version = version + 1, updated_at = now()
           WHERE id = $1 AND status = 'requested'`,
          [row.receipt_id],
        );
      }
      await this.recordTransition(
        client,
        taskId,
        actorId,
        `transport_task.${toStatus}`,
        toStatus === "assigned"
          ? "TransportTaskAssigned"
          : "TransportTaskStarted",
        { equipmentId: row.equipment_id, status: toStatus },
        metadata,
      );
      return toTask(row);
    });
  }

  private async recordTransition(
    client: PoolClient,
    taskId: string,
    actorId: string,
    action: string,
    eventType: string,
    details: Record<string, unknown>,
    metadata: TransitionMetadata,
  ): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events
        (id, aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, 'TransportTask', $2, $3, $4::jsonb)`,
      [metadata.outboxEventId, taskId, eventType, JSON.stringify(details)],
    );
    await client.query(
      `INSERT INTO audit_events
        (id, actor_type, actor_id, action, aggregate_type, aggregate_id, details)
       VALUES ($1, 'service', $2, $3, 'TransportTask', $4, $5::jsonb)`,
      [metadata.auditEventId, actorId, action, taskId, JSON.stringify(details)],
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
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new ExecutionConflictError(
          "Equipment, load, or inventory is already assigned to active work.",
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private conflict(taskId: string, expectedVersion: number): Error {
    return new ExecutionConflictError(
      `Transport task ${taskId} did not match version ${expectedVersion} and the required status.`,
    );
  }

  private taskSelection(): string {
    return `SELECT id AS task_id, receipt_id, load_id, source_location_id,
      destination_location_id, status, equipment_id, version
      FROM transport_tasks`;
  }
}
