import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import {
  ExecutionConflictError,
  type TransitionMetadata,
} from "../../../../src/application/execution/inbound-execution";
import type {
  OutboundExecutionRepository,
  PersistedOutboundTask,
} from "../../../../src/application/execution/outbound-execution";
import { DATABASE_POOL } from "../database/database.module";

type TaskRow = {
  task_id: string;
  outbound_order_id: string;
  allocation_id: string;
  inventory_unit_id: string;
  quantity: number;
  source_location_id: string;
  destination_location_id: string;
  status: PersistedOutboundTask["status"];
  equipment_id: string | null;
  version: number;
};

function toTask(row: TaskRow): PersistedOutboundTask {
  return {
    taskId: row.task_id,
    outboundOrderId: row.outbound_order_id,
    allocationId: row.allocation_id,
    inventoryUnitId: row.inventory_unit_id,
    quantity: row.quantity,
    sourceLocationId: row.source_location_id,
    destinationLocationId: row.destination_location_id,
    status: row.status,
    equipmentId: row.equipment_id,
    version: row.version,
  };
}

@Injectable()
export class PgOutboundExecutionRepository
  implements OutboundExecutionRepository
{
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getTask(taskId: string): Promise<PersistedOutboundTask | null> {
    const result = await this.pool.query<TaskRow>(
      `${this.selection()} WHERE task.id = $1 AND task.outbound_order_id IS NOT NULL`,
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
  ): Promise<PersistedOutboundTask> {
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
  ): Promise<PersistedOutboundTask> {
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
    metadata: TransitionMetadata,
  ): Promise<void> {
    await this.withTransaction(async (client) => {
      const taskResult = await client.query<TaskRow>(
        this.returningSelection(
          `UPDATE transport_tasks SET status = 'completed', version = version + 1, updated_at = now() WHERE id = $1 AND status = 'in_progress' AND version = $2 RETURNING *`,
        ),
        [taskId, expectedVersion],
      );
      const task = taskResult.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);

      const allocation = await client.query(
        `UPDATE inventory_allocations SET status = 'consumed', updated_at = now()
         WHERE id = $1 AND status = 'reserved'`,
        [task.allocation_id],
      );
      if (allocation.rowCount !== 1)
        throw new ExecutionConflictError(
          "Outbound allocation is not reserved.",
        );

      const inventory = await client.query<{ quantity: number }>(
        `SELECT quantity FROM inventory_units WHERE id = $1 AND status = 'available' FOR UPDATE`,
        [task.inventory_unit_id],
      );
      const unit = inventory.rows[0];
      if (!unit || unit.quantity < task.quantity)
        throw new ExecutionConflictError(
          "Allocated inventory is no longer consumable.",
        );
      if (unit.quantity === task.quantity) {
        await client.query(
          `UPDATE inventory_units SET status = 'shipped', version = version + 1, updated_at = now() WHERE id = $1`,
          [task.inventory_unit_id],
        );
      } else {
        await client.query(
          `UPDATE inventory_units SET quantity = quantity - $2, version = version + 1, updated_at = now() WHERE id = $1`,
          [task.inventory_unit_id, task.quantity],
        );
      }

      await client.query(
        `UPDATE outbound_orders SET status = CASE WHEN EXISTS (
           SELECT 1 FROM transport_tasks WHERE outbound_order_id = $1 AND status <> 'completed'
         ) THEN 'in_progress' ELSE 'completed' END,
         version = version + 1, updated_at = now() WHERE id = $1`,
        [task.outbound_order_id],
      );
      await this.record(
        client,
        task,
        actorId,
        "transport_task.complete",
        "OutboundTransportTaskCompleted",
        { quantity: task.quantity },
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
      const result = await client.query<TaskRow>(
        this.returningSelection(
          `UPDATE transport_tasks SET status = 'unknown', version = version + 1, updated_at = now() WHERE id = $1 AND version = $2 AND status IN ('queued', 'assigned', 'in_progress', 'blocked') RETURNING *`,
        ),
        [taskId, expectedVersion],
      );
      const task = result.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);
      await this.record(
        client,
        task,
        actorId,
        "transport_task.mark_unknown",
        "OutboundTransportTaskOutcomeUnknown",
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
  ): Promise<PersistedOutboundTask> {
    return this.withTransaction(async (client) => {
      const result = await client.query<TaskRow>(
        this.returningSelection(
          `UPDATE transport_tasks SET status = $3, equipment_id = COALESCE($4, equipment_id), version = version + 1, updated_at = now() WHERE id = $1 AND version = $2 AND status = $5 RETURNING *`,
        ),
        [taskId, expectedVersion, toStatus, equipmentId ?? null, fromStatus],
      );
      const task = result.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);
      if (toStatus === "in_progress")
        await client.query(
          `UPDATE outbound_orders SET status = 'in_progress', version = version + 1, updated_at = now() WHERE id = $1 AND status = 'allocated'`,
          [task.outbound_order_id],
        );
      await this.record(
        client,
        task,
        actorId,
        `transport_task.${toStatus}`,
        toStatus === "assigned"
          ? "OutboundTransportTaskAssigned"
          : "OutboundTransportTaskStarted",
        { equipmentId: task.equipment_id },
        metadata,
      );
      return toTask(task);
    });
  }

  private selection(): string {
    return `SELECT task.id AS task_id, task.outbound_order_id, task.inventory_allocation_id AS allocation_id,
      allocation.inventory_unit_id, allocation.quantity, task.source_location_id,
      task.destination_location_id, task.status, task.equipment_id, task.version
      FROM transport_tasks task JOIN inventory_allocations allocation ON allocation.id = task.inventory_allocation_id`;
  }

  private returningSelection(update: string): string {
    return `WITH task AS (${update})
      SELECT task.id AS task_id, task.outbound_order_id, task.inventory_allocation_id AS allocation_id,
        allocation.inventory_unit_id, allocation.quantity, task.source_location_id,
        task.destination_location_id, task.status, task.equipment_id, task.version
      FROM task JOIN inventory_allocations allocation ON allocation.id = task.inventory_allocation_id`;
  }

  private async record(
    client: PoolClient,
    task: TaskRow,
    actorId: string,
    action: string,
    eventType: string,
    details: Record<string, unknown>,
    metadata: TransitionMetadata,
  ): Promise<void> {
    const payload = {
      outboundOrderId: task.outbound_order_id,
      allocationId: task.allocation_id,
      inventoryUnitId: task.inventory_unit_id,
      ...details,
    };
    await client.query(
      `INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload) VALUES ($1, 'TransportTask', $2, $3, $4::jsonb)`,
      [
        metadata.outboxEventId,
        task.task_id,
        eventType,
        JSON.stringify(payload),
      ],
    );
    await client.query(
      `INSERT INTO audit_events (id, actor_type, actor_id, action, aggregate_type, aggregate_id, details) VALUES ($1, 'service', $2, $3, 'TransportTask', $4, $5::jsonb)`,
      [
        metadata.auditEventId,
        actorId,
        action,
        task.task_id,
        JSON.stringify(payload),
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

  private conflict(taskId: string, version: number): Error {
    return new ExecutionConflictError(
      `Outbound transport task ${taskId} did not match version ${version} and the required status.`,
    );
  }
}
