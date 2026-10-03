import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { OperationalRuntime } from "../../../../src/application/access/operational-access";
import {
  DemoAdmissionError,
  requireDemoAdmissionPolicy,
  requireDemoCreationBudgetPolicy,
  defaultDemoCreationBudget,
  requireDemoExpiryBatch,
  requireDemoReservationInput,
  type DemoAdmissionPolicy,
  type DemoCreationBudgetPolicy,
  type DemoAdmissionRepository,
  type DemoReservation,
  type ReserveDemoSession,
} from "../../../../src/application/demo/demo-admission";

type ReservationRow = {
  session_id: string;
  template_warehouse_id: string;
  deployment_profile: "public_demo";
  ttl_seconds: number;
  state: "provisioning" | "expired" | "closed";
  created_at: Date;
  expires_at: Date;
};

function reservation(row: ReservationRow): DemoReservation {
  return {
    sessionId: row.session_id,
    templateWarehouseId: row.template_warehouse_id,
    deploymentProfile: row.deployment_profile,
    ttlSeconds: row.ttl_seconds,
    state: row.state,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

/** Control ledger only: never grants warehouse or equipment authorization. */
export class PgDemoAdmissionRepository implements DemoAdmissionRepository {
  private readonly policy: DemoAdmissionPolicy;
  private readonly creationBudget: DemoCreationBudgetPolicy;

  constructor(
    private readonly pool: Pool,
    runtime: OperationalRuntime,
    policy: DemoAdmissionPolicy,
    creationBudget: DemoCreationBudgetPolicy = defaultDemoCreationBudget,
  ) {
    requireDemoAdmissionPolicy(runtime, policy);
    requireDemoCreationBudgetPolicy(creationBudget);
    // Retain server-owned immutable configuration, not caller-mutable objects.
    this.policy = { ...policy };
    this.creationBudget = { ...creationBudget };
  }

  private async transaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      // Take the capacity snapshot after obtaining the lock, even when a
      // deployment changes its connection's default transaction isolation.
      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      // Shared across processes/templates. Only verified cleanup releases capacity.
      await client.query("SELECT pg_advisory_xact_lock($1)", [870_041_003]);
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

  async reserve(input: ReserveDemoSession): Promise<DemoReservation> {
    requireDemoReservationInput(input);
    const sessionId = input.sessionId.toLowerCase();
    const templateWarehouseId = input.templateWarehouseId.toLowerCase();
    return this.transaction(async (client) => {
      const existing = await client.query<ReservationRow>(
        "SELECT * FROM demo_session_reservations WHERE session_id=$1",
        [sessionId],
      );
      const previous = existing.rows[0];
      if (previous) {
        if (
          previous.template_warehouse_id !== templateWarehouseId ||
          previous.ttl_seconds !== this.policy.ttlSeconds ||
          previous.deployment_profile !== "public_demo"
        ) {
          throw new DemoAdmissionError("CONFLICT");
        }
        return reservation(previous);
      }
      const capacity = await client.query<{ count: string }>(
        "SELECT count(*) FROM demo_session_reservations WHERE state <> 'closed'",
      );
      if (Number(capacity.rows[0].count) >= this.policy.maximumReservations) {
        throw new DemoAdmissionError("CAPACITY");
      }
      await this.consumeCreationBudget(client);
      const created = await client.query<ReservationRow>(
        `WITH admission_time AS (SELECT clock_timestamp() AS value)
         INSERT INTO demo_session_reservations
           (session_id,template_warehouse_id,deployment_profile,ttl_seconds,state,created_at,expires_at)
         SELECT $1,$2,'public_demo',$3::integer,'provisioning',value,value + $3::integer * interval '1 second'
         FROM admission_time RETURNING *`,
        [sessionId, templateWarehouseId, this.policy.ttlSeconds],
      );
      await client.query(
        `INSERT INTO demo_session_control_events (id,session_id,action,actor_type,actor_id)
         VALUES ($1,$2,'demo_session.reserved','anonymous_demo',$3)`,
        [randomUUID(), sessionId, `anonymous-demo:${sessionId}`],
      );
      return reservation(created.rows[0]);
    });
  }

  private async consumeCreationBudget(client: PoolClient): Promise<void> {
    const current = await client.query<{
      window_seconds: number;
      maximum_creations: number;
      creations: number;
      fresh: boolean;
    }>(
      `SELECT *,clock_timestamp()<window_started_at+window_seconds*interval '1 second' AS fresh
       FROM demo_creation_budget WHERE singleton=true FOR UPDATE`,
    );
    const row = current.rows[0];
    if (row?.fresh) {
      if (
        row.window_seconds !== this.creationBudget.windowSeconds ||
        row.maximum_creations !== this.creationBudget.maximumCreations
      ) {
        throw new DemoAdmissionError("CONFLICT");
      }
      if (row.creations >= row.maximum_creations)
        throw new DemoAdmissionError("RATE_LIMITED");
      await client.query(
        "UPDATE demo_creation_budget SET creations=creations+1 WHERE singleton=true",
      );
    } else {
      await client.query(
        `INSERT INTO demo_creation_budget (singleton,window_started_at,window_seconds,maximum_creations,creations)
         VALUES (true,clock_timestamp(),$1,$2,1)
         ON CONFLICT (singleton) DO UPDATE SET window_started_at=EXCLUDED.window_started_at,
         window_seconds=EXCLUDED.window_seconds,maximum_creations=EXCLUDED.maximum_creations,creations=1`,
        [
          this.creationBudget.windowSeconds,
          this.creationBudget.maximumCreations,
        ],
      );
    }
  }

  async expireBatch(limit: number): Promise<number> {
    requireDemoExpiryBatch(limit);
    return this.transaction(async (client) => {
      const expired = await client.query<{ session_id: string }>(
        `WITH candidates AS (
           SELECT session_id FROM demo_session_reservations
           WHERE state='provisioning' AND expires_at <= clock_timestamp()
           ORDER BY expires_at,session_id LIMIT $1 FOR UPDATE
         )
         UPDATE demo_session_reservations reservation SET state='expired'
         FROM candidates WHERE reservation.session_id=candidates.session_id
         RETURNING reservation.session_id`,
        [limit],
      );
      for (const row of expired.rows) {
        await client.query(
          `INSERT INTO demo_session_control_events (id,session_id,action,actor_type,actor_id)
           VALUES ($1,$2,'demo_session.expired','system','demo-lifecycle')`,
          [randomUUID(), row.session_id],
        );
      }
      return expired.rowCount ?? 0;
    });
  }
}
