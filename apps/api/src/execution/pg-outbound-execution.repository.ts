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
import { auditCorrelationId } from "../logging/request-context";

type TaskRow = {
  task_id: string;
  outbound_order_id: string;
  allocation_id: string;
  inventory_unit_id: string;
  quantity: number;
  source_location_id: string;
  destination_location_id: string;
  source_node_id: string;
  destination_node_id: string;
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
    sourceNodeId: row.source_node_id,
    destinationNodeId: row.destination_node_id,
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

  async getTask(
    taskId: string,
    warehouseId: string,
  ): Promise<PersistedOutboundTask | null> {
    const result = await this.pool.query<TaskRow>(
      `${this.selection()} WHERE task.id = $1 AND task.outbound_order_id IS NOT NULL
        AND source_location.warehouse_id = $2
        AND destination_location.warehouse_id = $2`,
      [taskId, warehouseId],
    );
    return result.rows[0] ? toTask(result.rows[0]) : null;
  }

  async isEquipmentAvailableInWarehouse(
    equipmentId: string,
    warehouseId: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM equipment_descriptors
       WHERE equipment_id = $1 AND warehouse_id = $2 AND active = true`,
      [equipmentId, warehouseId],
    );
    return result.rowCount === 1;
  }

  markAssigned(
    taskId: string,
    warehouseId: string,
    equipmentId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedOutboundTask> {
    return this.transition(
      taskId,
      warehouseId,
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
    warehouseId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<PersistedOutboundTask> {
    return this.transition(
      taskId,
      warehouseId,
      expectedVersion,
      "assigned",
      "in_progress",
      actorId,
      metadata,
    );
  }

  async complete(
    taskId: string,
    warehouseId: string,
    expectedVersion: number,
    actorId: string,
    metadata: TransitionMetadata,
  ): Promise<void> {
    await this.withTransaction(async (client) => {
      const taskResult = await client.query<TaskRow>(
        this.returningSelection(
          `UPDATE transport_tasks SET status = 'completed', version = version + 1, updated_at = now()
           WHERE id = $1 AND status = 'in_progress' AND version = $2
             AND EXISTS (
               SELECT 1 FROM locations source, locations destination
               WHERE source.id = transport_tasks.source_location_id
                 AND destination.id = transport_tasks.destination_location_id
                 AND source.warehouse_id = $3 AND destination.warehouse_id = $3
             )
           RETURNING *`,
        ),
        [taskId, expectedVersion, warehouseId],
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
         version = version + 1, updated_at = now()
         WHERE id = $1 AND warehouse_id = $2`,
        [task.outbound_order_id, warehouseId],
      );
      await this.record(
        client,
        task,
        warehouseId,
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
    warehouseId: string,
    expectedVersion: number,
    actorId: string,
    reason: string,
    metadata: TransitionMetadata,
  ): Promise<void> {
    await this.withTransaction(async (client) => {
      const result = await client.query<TaskRow>(
        this.returningSelection(
          `UPDATE transport_tasks SET status = 'unknown', version = version + 1, updated_at = now()
           WHERE id = $1 AND version = $2
             AND status IN ('queued', 'assigned', 'in_progress', 'blocked')
             AND EXISTS (
               SELECT 1 FROM locations source, locations destination
               WHERE source.id = transport_tasks.source_location_id
                 AND destination.id = transport_tasks.destination_location_id
                 AND source.warehouse_id = $3 AND destination.warehouse_id = $3
             )
           RETURNING *`,
        ),
        [taskId, expectedVersion, warehouseId],
      );
      const task = result.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);
      await this.record(
        client,
        task,
        warehouseId,
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
    warehouseId: string,
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
          `UPDATE transport_tasks SET status = $3, equipment_id = COALESCE($4, equipment_id), version = version + 1, updated_at = now()
           WHERE id = $1 AND version = $2 AND status = $5
             AND EXISTS (
               SELECT 1 FROM locations source, locations destination
               WHERE source.id = transport_tasks.source_location_id
                 AND destination.id = transport_tasks.destination_location_id
                 AND source.warehouse_id = $6 AND destination.warehouse_id = $6
             )
           RETURNING *`,
        ),
        [
          taskId,
          expectedVersion,
          toStatus,
          equipmentId ?? null,
          fromStatus,
          warehouseId,
        ],
      );
      const task = result.rows[0];
      if (!task) throw this.conflict(taskId, expectedVersion);
      if (toStatus === "in_progress")
        await client.query(
          `UPDATE outbound_orders SET status = 'in_progress', version = version + 1, updated_at = now()
           WHERE id = $1 AND warehouse_id = $2 AND status = 'allocated'`,
          [task.outbound_order_id, warehouseId],
        );
      await this.record(
        client,
        task,
        warehouseId,
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
      task.destination_location_id, source_binding.node_id AS source_node_id,
      destination_binding.node_id AS destination_node_id,
      task.status, task.equipment_id, task.version
      FROM transport_tasks task
      JOIN inventory_allocations allocation ON allocation.id = task.inventory_allocation_id
      JOIN locations source_location ON source_location.id = task.source_location_id
      JOIN locations destination_location ON destination_location.id = task.destination_location_id
      JOIN warehouse_topologies topology
        ON topology.warehouse_id = source_location.warehouse_id
       AND topology.status = 'active'
      JOIN location_topology_bindings source_binding
        ON source_binding.location_id = task.source_location_id
       AND source_binding.topology_id = topology.id
       AND source_binding.topology_revision = topology.revision
      JOIN location_topology_bindings destination_binding
        ON destination_binding.location_id = task.destination_location_id
       AND destination_binding.topology_id = topology.id
       AND destination_binding.topology_revision = topology.revision`;
  }

  private returningSelection(update: string): string {
    return `WITH task AS (${update})
      SELECT task.id AS task_id, task.outbound_order_id, task.inventory_allocation_id AS allocation_id,
        allocation.inventory_unit_id, allocation.quantity, task.source_location_id,
        task.destination_location_id, source_binding.node_id AS source_node_id,
        destination_binding.node_id AS destination_node_id,
        task.status, task.equipment_id, task.version
      FROM task
      JOIN inventory_allocations allocation ON allocation.id = task.inventory_allocation_id
      JOIN locations source_location ON source_location.id = task.source_location_id
      JOIN locations destination_location ON destination_location.id = task.destination_location_id
      JOIN warehouse_topologies topology
        ON topology.warehouse_id = source_location.warehouse_id
       AND topology.status = 'active'
      JOIN location_topology_bindings source_binding
        ON source_binding.location_id = task.source_location_id
       AND source_binding.topology_id = topology.id
       AND source_binding.topology_revision = topology.revision
      JOIN location_topology_bindings destination_binding
        ON destination_binding.location_id = task.destination_location_id
       AND destination_binding.topology_id = topology.id
       AND destination_binding.topology_revision = topology.revision`;
  }

  private async record(
    client: PoolClient,
    task: TaskRow,
    warehouseId: string,
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
      ...(metadata.confirmationReason
        ? { confirmationReason: metadata.confirmationReason }
        : {}),
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
      `INSERT INTO audit_events (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
       VALUES ($1, $2, $3, $4, $5, 'TransportTask', $6, $7::jsonb, $8)`,
      [
        metadata.auditEventId,
        warehouseId,
        metadata.actorType,
        actorId,
        action,
        task.task_id,
        JSON.stringify(payload),
        auditCorrelationId(metadata.auditEventId),
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
