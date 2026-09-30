import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import { DATABASE_POOL } from "../database/database.module";
import { auditCorrelationId } from "../logging/request-context";
import {
  IdempotencyConflictError,
  InvalidLocationError,
} from "./inbound.errors";
import type {
  CreateInboundReceipt,
  InboundIdentifiers,
  InboundReceiptResult,
  InboundRepository,
} from "./inbound.types";

type ExistingReceiptRow = {
  receipt_id: string;
  request_hash: string;
  load_id: string;
  transport_task_id: string;
};

@Injectable()
export class PgInboundRepository implements InboundRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    command: CreateInboundReceipt,
    identifiers: InboundIdentifiers,
    requestHash: string,
  ): Promise<InboundReceiptResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO inbound_receipts
          (id, warehouse_id, external_reference, idempotency_key, request_hash, status)
         VALUES ($1, $2, $3, $4, $5, 'requested')
         ON CONFLICT (warehouse_id, idempotency_key) DO NOTHING
         RETURNING id`,
        [
          identifiers.receiptId,
          command.warehouseId,
          command.externalReference,
          command.idempotencyKey,
          requestHash,
        ],
      );

      if (inserted.rowCount === 0) {
        const existing = await this.findExisting(
          client,
          command.warehouseId,
          command.idempotencyKey,
        );
        await client.query("COMMIT");
        if (existing.request_hash !== requestHash) {
          throw new IdempotencyConflictError(command.idempotencyKey);
        }
        return {
          receiptId: existing.receipt_id,
          loadId: existing.load_id,
          transportTaskId: existing.transport_task_id,
          status: "requested",
          duplicate: true,
        };
      }

      await this.assertLocations(client, command);
      await client.query(
        `INSERT INTO loads
          (id, external_id, receipt_id, sku, quantity, status, current_location_id)
         VALUES ($1, $2, $3, $4, $5, 'received', $6)`,
        [
          identifiers.loadId,
          command.load.externalId,
          identifiers.receiptId,
          command.load.sku,
          command.load.quantity,
          command.sourceLocationId,
        ],
      );
      await client.query(
        `INSERT INTO transport_tasks
          (id, receipt_id, load_id, source_location_id, destination_location_id, status)
         VALUES ($1, $2, $3, $4, $5, 'queued')`,
        [
          identifiers.transportTaskId,
          identifiers.receiptId,
          identifiers.loadId,
          command.sourceLocationId,
          command.destinationLocationId,
        ],
      );
      await client.query(
        `INSERT INTO outbox_events
          (id, aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, 'InboundReceipt', $2, 'InboundReceiptRequested', $3::jsonb)`,
        [
          identifiers.outboxEventId,
          identifiers.receiptId,
          JSON.stringify({
            receiptId: identifiers.receiptId,
            loadId: identifiers.loadId,
            transportTaskId: identifiers.transportTaskId,
          }),
        ],
      );
      await client.query(
        `INSERT INTO audit_events
          (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES ($1, $2, $3, $4, 'inbound_receipt.create', 'InboundReceipt', $5, $6::jsonb, $7)`,
        [
          identifiers.auditEventId,
          command.warehouseId,
          command.actorType,
          command.actorId,
          identifiers.receiptId,
          JSON.stringify({
            externalReference: command.externalReference,
            loadExternalId: command.load.externalId,
            transportTaskId: identifiers.transportTaskId,
          }),
          auditCorrelationId(identifiers.auditEventId),
        ],
      );
      await client.query("COMMIT");

      return {
        receiptId: identifiers.receiptId,
        loadId: identifiers.loadId,
        transportTaskId: identifiers.transportTaskId,
        status: "requested",
        duplicate: false,
      };
    } catch (error) {
      if (!this.isAfterCommitDomainError(error)) {
        await client.query("ROLLBACK");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private isAfterCommitDomainError(error: unknown): boolean {
    return error instanceof IdempotencyConflictError;
  }

  private async findExisting(
    client: PoolClient,
    warehouseId: string,
    idempotencyKey: string,
  ): Promise<ExistingReceiptRow> {
    const result = await client.query<ExistingReceiptRow>(
      `SELECT r.id AS receipt_id, r.request_hash, l.id AS load_id, t.id AS transport_task_id
       FROM inbound_receipts r
       JOIN loads l ON l.receipt_id = r.id
       JOIN transport_tasks t ON t.receipt_id = r.id
       WHERE r.warehouse_id = $1 AND r.idempotency_key = $2`,
      [warehouseId, idempotencyKey],
    );
    const row = result.rows[0];
    if (!row)
      throw new Error(
        "Idempotent receipt exists without its transaction records.",
      );
    return row;
  }

  private async assertLocations(
    client: PoolClient,
    command: CreateInboundReceipt,
  ): Promise<void> {
    const result = await client.query<{
      id: string;
      capabilities: string[];
      status: string;
    }>(
      `SELECT id, capabilities, status
       FROM locations
       WHERE id = ANY($1::uuid[]) AND warehouse_id = $2`,
      [
        [command.sourceLocationId, command.destinationLocationId],
        command.warehouseId,
      ],
    );
    const source = result.rows.find(
      (row) => row.id === command.sourceLocationId,
    );
    const destination = result.rows.find(
      (row) => row.id === command.destinationLocationId,
    );
    if (
      !source ||
      !source.capabilities.includes("load.pickup") ||
      source.status !== "available"
    ) {
      throw new InvalidLocationError(
        "Source must be available and support load.pickup.",
      );
    }
    if (
      !destination ||
      !destination.capabilities.includes("load.dropoff") ||
      destination.status !== "available"
    ) {
      throw new InvalidLocationError(
        "Destination must be available and support load.dropoff.",
      );
    }
  }
}
