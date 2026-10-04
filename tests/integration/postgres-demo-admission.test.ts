import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";

const runIntegration = process.env.RUN_POSTGRES_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;
const pool = runIntegration
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const templateWarehouseId = "10000000-0000-4000-8000-000000000001";
const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;

function repository(maximumReservations = 2, ttlSeconds = 300) {
  if (!pool) throw new Error("Integration pool is required.");
  return new PgDemoAdmissionRepository(pool, runtime, {
    ttlSeconds,
    maximumReservations,
  });
}

describeIntegration("PostgreSQL demo admission control ledger", () => {
  beforeEach(async () => {
    await pool?.query(
      "TRUNCATE demo_simulator_runtime_owners,demo_simulator_owner_generations,demo_creation_budget,demo_reference_cleanup_jobs,demo_reference_cleanup_archives,demo_reference_workspaces,demo_session_control_events,demo_session_reservations",
    );
  });
  afterAll(async () => {
    await pool?.end();
  });

  it("persists immutable replay without renewing TTL or duplicating evidence", async () => {
    const input = { sessionId: randomUUID(), templateWarehouseId };
    const first = await repository(1).reserve(input);
    expect(first.state).toBe("provisioning");
    expect(Date.parse(first.expiresAt) - Date.parse(first.createdAt)).toBe(
      300_000,
    );
    expect(await repository(1).reserve(input)).toEqual(first);
    const events = await pool!.query(
      "SELECT action,actor_type,actor_id FROM demo_session_control_events",
    );
    expect(events.rows).toEqual([
      {
        action: "demo_session.reserved",
        actor_type: "anonymous_demo",
        actor_id: `anonymous-demo:${input.sessionId}`,
      },
    ]);
    await expect(repository(1, 600).reserve(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      repository(1).reserve({ ...input, templateWarehouseId: randomUUID() }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("serializes independent connections so concurrent admissions cannot exceed capacity", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        repository(2).reserve({ sessionId: randomUUID(), templateWarehouseId }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(2);
    for (const result of results.filter(
      (result) => result.status === "rejected",
    )) {
      expect(result.reason).toMatchObject({ code: "CAPACITY" });
    }
    const counts = await pool!.query(
      "SELECT (SELECT count(*) FROM demo_session_reservations)::int AS sessions,(SELECT count(*) FROM demo_session_control_events)::int AS events",
    );
    expect(counts.rows).toEqual([{ sessions: 2, events: 2 }]);
  });

  it("keeps admission safe with repeatable-read connection defaults", async () => {
    const connections = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
    });
    const clients = await Promise.all([
      connections.connect(),
      connections.connect(),
    ]);
    try {
      try {
        await Promise.all(
          clients.map((client) =>
            client.query(
              "SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL REPEATABLE READ",
            ),
          ),
        );
      } finally {
        for (const client of clients) client.release();
      }
      const admission = new PgDemoAdmissionRepository(connections, runtime, {
        maximumReservations: 1,
        ttlSeconds: 300,
      });
      const results = await Promise.allSettled([
        admission.reserve({ sessionId: randomUUID(), templateWarehouseId }),
        admission.reserve({ sessionId: randomUUID(), templateWarehouseId }),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const denied = results.find((result) => result.status === "rejected");
      expect(denied).toMatchObject({ reason: { code: "CAPACITY" } });
    } finally {
      await connections.end();
    }
  });

  it("replays one session under simultaneous retries across repository instances", async () => {
    const input = { sessionId: randomUUID(), templateWarehouseId };
    const results = await Promise.all(
      Array.from({ length: 5 }, () => repository(1).reserve(input)),
    );
    expect(
      results.every(
        (value) => JSON.stringify(value) === JSON.stringify(results[0]),
      ),
    ).toBe(true);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_session_control_events",
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it("expires bounded batches durably and does not release uncleaned capacity", async () => {
    const admission = repository(2);
    const input = { sessionId: randomUUID(), templateWarehouseId };
    await admission.reserve(input);
    await admission.reserve({ sessionId: randomUUID(), templateWarehouseId });
    await pool!.query(
      "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds'",
    );
    expect(await admission.expireBatch(1)).toBe(1);
    expect(await repository(2).expireBatch(1)).toBe(1); // restart-resumable candidates
    expect(await admission.expireBatch(100)).toBe(0);
    expect((await admission.reserve(input)).state).toBe("expired");
    await expect(
      admission.reserve({ sessionId: randomUUID(), templateWarehouseId }),
    ).rejects.toMatchObject({ code: "CAPACITY" });
    const actions = await pool!.query(
      "SELECT action,count(*)::int AS count FROM demo_session_control_events GROUP BY action ORDER BY action",
    );
    expect(actions.rows).toEqual([
      { action: "demo_session.expired", count: 2 },
      { action: "demo_session.reserved", count: 2 },
    ]);
  });

  it("rolls admission back when template or its control evidence cannot persist", async () => {
    await expect(
      repository().reserve({
        sessionId: randomUUID(),
        templateWarehouseId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "23503" });
    const input = { sessionId: randomUUID(), templateWarehouseId };
    // A test-only trigger proves a failed event write rolls the reservation back.
    await pool!.query(
      `CREATE FUNCTION reject_demo_control_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test control event failure'; END $$; CREATE TRIGGER reject_demo_control_probe BEFORE INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION reject_demo_control_probe()`,
    );
    try {
      await expect(repository().reserve(input)).rejects.toThrow(
        "test control event failure",
      );
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_session_reservations",
          )
        ).rows[0].count,
      ).toBe(0);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_demo_control_probe ON demo_session_control_events; DROP FUNCTION reject_demo_control_probe()",
      );
    }
    expect((await repository().reserve(input)).sessionId).toBe(input.sessionId);
  });

  it("rolls expiry state back when expiry evidence cannot persist", async () => {
    const input = { sessionId: randomUUID(), templateWarehouseId };
    await repository().reserve(input);
    await pool!.query(
      "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds'",
    );
    await pool!.query(
      `CREATE FUNCTION reject_demo_expiry_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test expiry event failure'; END $$; CREATE TRIGGER reject_demo_expiry_probe BEFORE INSERT ON demo_session_control_events FOR EACH ROW WHEN (NEW.action='demo_session.expired') EXECUTE FUNCTION reject_demo_expiry_probe()`,
    );
    try {
      await expect(repository().expireBatch(1)).rejects.toThrow(
        "test expiry event failure",
      );
      expect((await repository().reserve(input)).state).toBe("provisioning");
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_session_control_events",
          )
        ).rows[0].count,
      ).toBe(1);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_demo_expiry_probe ON demo_session_control_events; DROP FUNCTION reject_demo_expiry_probe()",
      );
    }
    expect(await repository().expireBatch(1)).toBe(1);
  });

  it("preserves its ledger/evidence through the actual global reset truncate list", async () => {
    const first = await repository().reserve({
      sessionId: randomUUID(),
      templateWarehouseId,
    });
    const source = await readFile(
      "apps/api/src/database/reset-demo.ts",
      "utf8",
    );
    const resetSql = source.match(/TRUNCATE[\s\S]*?inbound_receipts/)?.[0];
    expect(resetSql).toBeDefined();
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(resetSql!); // disposable test DB only; runner executes suites sequentially
      expect(
        (await client.query("SELECT session_id FROM demo_session_reservations"))
          .rows,
      ).toEqual([{ session_id: first.sessionId }]);
      expect(
        (await client.query("SELECT action FROM demo_session_control_events"))
          .rows,
      ).toEqual([{ action: "demo_session.reserved" }]);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });

  it("denies direct non-owner reads and writes despite table grants", async () => {
    await repository().reserve({
      sessionId: randomUUID(),
      templateWarehouseId,
    });
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "CREATE ROLE swp_demo_admission_probe NOLOGIN; GRANT USAGE ON SCHEMA public TO swp_demo_admission_probe; GRANT SELECT,INSERT,UPDATE,DELETE ON demo_session_reservations,demo_session_control_events TO swp_demo_admission_probe; SET LOCAL ROLE swp_demo_admission_probe",
      );
      for (const table of [
        "demo_session_reservations",
        "demo_session_control_events",
      ]) {
        expect(
          (await client.query(`SELECT count(*)::int AS count FROM ${table}`))
            .rows,
        ).toEqual([{ count: 0 }]);
        expect((await client.query(`DELETE FROM ${table}`)).rowCount).toBe(0);
      }
      expect(
        (
          await client.query(
            "UPDATE demo_session_reservations SET state='expired'",
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await client.query(
            "UPDATE demo_session_control_events SET actor_id='probe'",
          )
        ).rowCount,
      ).toBe(0);
      await expect(
        client.query(
          "INSERT INTO demo_session_control_events (id,session_id,action,actor_type,actor_id) VALUES ($1,$2,'demo_session.reserved','system','probe')",
          [randomUUID(), randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
