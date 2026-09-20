import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import { DATABASE_POOL } from "../database/database.module";
import { auditCorrelationId } from "../logging/request-context";
import {
  InsufficientInventoryError,
  InvalidOutboundDestinationError,
  OutboundIdempotencyConflictError,
} from "./outbound.errors";
import type {
  CreateOutboundOrder,
  OutboundIdentifiers,
  OutboundOrderResult,
  OutboundRepository,
} from "./outbound.types";

type ExistingOrderRow = {
  outbound_order_id: string;
  request_hash: string;
  allocation_ids: string[];
  transport_task_ids: string[];
};

type InventoryCandidateRow = {
  id: string;
  location_id: string;
  allocatable_quantity: number;
};

@Injectable()
export class PgOutboundRepository implements OutboundRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    command: CreateOutboundOrder,
    identifiers: OutboundIdentifiers,
    requestHash: string,
  ): Promise<OutboundOrderResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO outbound_orders
          (id, external_reference, idempotency_key, request_hash, sku, quantity,
           destination_location_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested')
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [
          identifiers.outboundOrderId,
          command.externalReference,
          command.idempotencyKey,
          requestHash,
          command.sku,
          command.quantity,
          command.destinationLocationId,
        ],
      );

      if (inserted.rowCount === 0) {
        const existing = await this.findExisting(
          client,
          command.idempotencyKey,
        );
        await client.query("COMMIT");
        if (existing.request_hash !== requestHash) {
          throw new OutboundIdempotencyConflictError(command.idempotencyKey);
        }
        return {
          outboundOrderId: existing.outbound_order_id,
          allocationIds: existing.allocation_ids,
          transportTaskIds: existing.transport_task_ids,
          status: "allocated",
          duplicate: true,
        };
      }

      await this.assertDestination(client, command.destinationLocationId);
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [command.sku],
      );
      const candidates = await client.query<InventoryCandidateRow>(
        `SELECT inventory.id, inventory.location_id,
          (inventory.quantity - COALESCE((
            SELECT sum(allocation.quantity)::integer
            FROM inventory_allocations allocation
            WHERE allocation.inventory_unit_id = inventory.id
              AND allocation.status = 'reserved'
          ), 0))::integer AS allocatable_quantity
         FROM inventory_units inventory
         WHERE inventory.sku = $1
           AND inventory.status = 'available'
           AND inventory.quantity > COALESCE((
             SELECT sum(allocation.quantity)::integer
             FROM inventory_allocations allocation
             WHERE allocation.inventory_unit_id = inventory.id
               AND allocation.status = 'reserved'
           ), 0)
         ORDER BY inventory.created_at, inventory.id
         FOR UPDATE OF inventory`,
        [command.sku],
      );

      const available = candidates.rows.reduce(
        (total, row) => total + row.allocatable_quantity,
        0,
      );
      if (available < command.quantity) {
        throw new InsufficientInventoryError(
          command.sku,
          command.quantity,
          available,
        );
      }

      let remaining = command.quantity;
      const allocationIds: string[] = [];
      const transportTaskIds: string[] = [];
      for (const candidate of candidates.rows) {
        if (remaining === 0) break;
        const quantity = Math.min(remaining, candidate.allocatable_quantity);
        const allocationId = randomUUID();
        const transportTaskId = randomUUID();
        await client.query(
          `INSERT INTO inventory_allocations
            (id, outbound_order_id, inventory_unit_id, source_location_id, quantity, status)
           VALUES ($1, $2, $3, $4, $5, 'reserved')`,
          [
            allocationId,
            identifiers.outboundOrderId,
            candidate.id,
            candidate.location_id,
            quantity,
          ],
        );
        await client.query(
          `INSERT INTO transport_tasks
            (id, receipt_id, load_id, outbound_order_id, inventory_allocation_id,
             source_location_id, destination_location_id, status)
           VALUES ($1, NULL, NULL, $2, $3, $4, $5, 'queued')`,
          [
            transportTaskId,
            identifiers.outboundOrderId,
            allocationId,
            candidate.location_id,
            command.destinationLocationId,
          ],
        );
        allocationIds.push(allocationId);
        transportTaskIds.push(transportTaskId);
        remaining -= quantity;
      }

      await client.query(
        `UPDATE outbound_orders
         SET status = 'allocated', version = version + 1, updated_at = now()
         WHERE id = $1 AND status = 'requested'`,
        [identifiers.outboundOrderId],
      );
      const eventDetails = {
        outboundOrderId: identifiers.outboundOrderId,
        sku: command.sku,
        quantity: command.quantity,
        allocationIds,
        transportTaskIds,
      };
      await client.query(
        `INSERT INTO outbox_events
          (id, aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, 'OutboundOrder', $2, 'OutboundInventoryAllocated', $3::jsonb)`,
        [
          identifiers.outboxEventId,
          identifiers.outboundOrderId,
          JSON.stringify(eventDetails),
        ],
      );
      await client.query(
        `INSERT INTO audit_events
          (id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES ($1, 'user', $2, 'outbound_order.allocate', 'OutboundOrder', $3, $4::jsonb, $5)`,
        [
          identifiers.auditEventId,
          command.actorId,
          identifiers.outboundOrderId,
          JSON.stringify(eventDetails),
          auditCorrelationId(identifiers.auditEventId),
        ],
      );
      await client.query("COMMIT");

      return {
        outboundOrderId: identifiers.outboundOrderId,
        allocationIds,
        transportTaskIds,
        status: "allocated",
        duplicate: false,
      };
    } catch (error) {
      if (!(error instanceof OutboundIdempotencyConflictError)) {
        await client.query("ROLLBACK");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private async assertDestination(
    client: PoolClient,
    destinationLocationId: string,
  ): Promise<void> {
    const result = await client.query<{
      capabilities: string[];
      status: string;
    }>("SELECT capabilities, status FROM locations WHERE id = $1", [
      destinationLocationId,
    ]);
    const destination = result.rows[0];
    if (
      !destination ||
      destination.status !== "available" ||
      !destination.capabilities.includes("outbound.stage")
    ) {
      throw new InvalidOutboundDestinationError(
        "Destination must be available and support outbound.stage.",
      );
    }
  }

  private async findExisting(
    client: PoolClient,
    idempotencyKey: string,
  ): Promise<ExistingOrderRow> {
    const result = await client.query<ExistingOrderRow>(
      `SELECT outbound.id AS outbound_order_id, outbound.request_hash,
        array_agg(allocation.id ORDER BY allocation.id) AS allocation_ids,
        array_agg(task.id ORDER BY allocation.id) AS transport_task_ids
       FROM outbound_orders outbound
       JOIN inventory_allocations allocation ON allocation.outbound_order_id = outbound.id
       JOIN transport_tasks task ON task.inventory_allocation_id = allocation.id
       WHERE outbound.idempotency_key = $1
       GROUP BY outbound.id, outbound.request_hash`,
      [idempotencyKey],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(
        "Idempotent outbound order is missing allocation records.",
      );
    }
    return row;
  }
}
