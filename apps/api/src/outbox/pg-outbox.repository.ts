import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  OutboxEvent,
  OutboxRepository,
} from "../../../../src/application/outbox/outbox";
import { DATABASE_POOL } from "../database/database.module";

type OutboxRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
  attempts: number;
};

@Injectable()
export class PgOutboxRepository implements OutboxRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async claimBatch(
    workerId: string,
    batchSize: number,
    leaseMs: number,
    now: Date,
  ): Promise<readonly OutboxEvent[]> {
    const result = await this.pool.query<OutboxRow>(
      `WITH candidates AS (
         SELECT id
         FROM outbox_events
         WHERE published_at IS NULL
           AND next_attempt_at <= $1
           AND (locked_until IS NULL OR locked_until <= $1)
         ORDER BY occurred_at, id
         LIMIT $2
         FOR UPDATE SKIP LOCKED
       )
       UPDATE outbox_events e
       SET locked_by = $3,
         locked_until = $1 + ($4 * interval '1 millisecond')
       FROM candidates c
       WHERE e.id = c.id
       RETURNING e.id, e.aggregate_type, e.aggregate_id, e.event_type,
         e.payload, e.occurred_at, e.attempts`,
      [now, batchSize, workerId, leaseMs],
    );
    return result.rows.map((row) => ({
      id: row.id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      payload: row.payload,
      occurredAt: row.occurred_at,
      attempts: row.attempts,
    }));
  }

  async markPublished(
    eventId: string,
    workerId: string,
    at: Date,
  ): Promise<void> {
    const result = await this.pool.query(
      `UPDATE outbox_events
       SET published_at = $3, locked_by = NULL, locked_until = NULL, last_error = NULL
       WHERE id = $1 AND locked_by = $2 AND published_at IS NULL`,
      [eventId, workerId, at],
    );
    if (result.rowCount !== 1) {
      throw new Error(
        `Outbox lease for ${eventId} is no longer owned by ${workerId}.`,
      );
    }
  }

  async markFailed(
    eventId: string,
    workerId: string,
    error: string,
    retryAt: Date,
  ): Promise<void> {
    const result = await this.pool.query(
      `UPDATE outbox_events
       SET attempts = attempts + 1,
         next_attempt_at = $3,
         last_error = left($4, 1000),
         locked_by = NULL,
         locked_until = NULL
       WHERE id = $1 AND locked_by = $2 AND published_at IS NULL`,
      [eventId, workerId, retryAt, error],
    );
    if (result.rowCount !== 1) {
      throw new Error(
        `Outbox lease for ${eventId} is no longer owned by ${workerId}.`,
      );
    }
  }
}
