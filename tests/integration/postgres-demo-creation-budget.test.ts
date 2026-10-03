import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";
import { PgDemoReferenceCleanupRepository } from "../../apps/api/src/demo/pg-demo-reference-cleanup.repository";

const enabled = process.env.RUN_POSTGRES_INTEGRATION === "1";
const suite = enabled ? describe : describe.skip;
const pool = enabled
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const templateWarehouseId = "10000000-0000-4000-8000-000000000001";
const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;
function repository(
  maximumCreations = 2,
  windowSeconds = 60,
  maximumReservations = 10,
) {
  return new PgDemoAdmissionRepository(
    pool!,
    runtime,
    { ttlSeconds: 300, maximumReservations },
    { maximumCreations, windowSeconds },
  );
}
function input() {
  return { sessionId: randomUUID(), templateWarehouseId };
}
async function budget() {
  return (await pool!.query("SELECT * FROM demo_creation_budget")).rows[0];
}
suite("PostgreSQL global demo creation budget", () => {
  beforeEach(async () => {
    await pool!.query(
      "TRUNCATE demo_creation_budget,demo_reference_cleanup_jobs,demo_reference_cleanup_archives,demo_reference_workspaces,demo_session_control_events,demo_session_reservations",
    );
  });
  afterAll(async () => {
    await pool?.end();
  });

  it("serializes concurrent creation across instances without exceeding the global window", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => repository(3).reserve(input())),
    );
    expect(
      results.filter((value) => value.status === "fulfilled"),
    ).toHaveLength(3);
    for (const result of results.filter(
      (value) => value.status === "rejected",
    )) {
      expect(result.reason).toMatchObject({ code: "RATE_LIMITED" });
    }
    expect((await budget()).creations).toBe(3);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_session_reservations",
        )
      ).rows[0].count,
    ).toBe(3);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_session_control_events",
        )
      ).rows[0].count,
    ).toBe(3);
  });
  it("does not spend budget or slide the window for simultaneous immutable retries", async () => {
    const request = input();
    const result = await Promise.all(
      Array.from({ length: 8 }, () => repository(1).reserve(request)),
    );
    expect(
      result.every(
        (value) => JSON.stringify(value) === JSON.stringify(result[0]),
      ),
    ).toBe(true);
    const original = await budget();
    await expect(repository(1).reserve(input())).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    expect(await repository(1).reserve(request)).toEqual(result[0]);
    expect(await budget()).toEqual(original);
  });
  it("uses database deadline boundaries and fails closed for conflicting live policy", async () => {
    await repository(1, 10).reserve(input());
    await expect(repository(2, 10).reserve(input())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(repository(1, 60).reserve(input())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await pool!.query(
      "UPDATE demo_creation_budget SET window_started_at=clock_timestamp()-interval '9 seconds'",
    );
    await expect(repository(1, 10).reserve(input())).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    await pool!.query(
      "UPDATE demo_creation_budget SET window_started_at=clock_timestamp()-interval '10 seconds'",
    );
    await repository(2, 60).reserve(input());
    expect(await budget()).toMatchObject({
      creations: 1,
      window_seconds: 60,
      maximum_creations: 2,
    });
  });
  it("survives repository restart and retains budget after verified capacity release", async () => {
    const first = await repository(2, 60, 1).reserve(input());
    const close = async (sessionId: string) => {
      await pool!.query(
        "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds' WHERE session_id=$1",
        [sessionId],
      );
      const cleanup = new PgDemoReferenceCleanupRepository(pool!, runtime, {
        leaseSeconds: 30,
      });
      await cleanup.complete(await cleanup.claim(sessionId));
    };
    await close(first.sessionId);
    const second = await repository(2, 60, 1).reserve(input());
    await close(second.sessionId);
    await expect(repository(2, 60, 1).reserve(input())).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    expect(
      (
        await repository(2, 60, 1).reserve({
          sessionId: first.sessionId,
          templateWarehouseId,
        })
      ).state,
    ).toBe("closed");
    expect((await budget()).creations).toBe(2);
  });
  it("rolls budget back for invalid template and failed reservation evidence", async () => {
    await expect(
      repository(1).reserve({
        sessionId: randomUUID(),
        templateWarehouseId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "23503" });
    expect(await budget()).toBeUndefined();
    await pool!.query(
      "CREATE FUNCTION reject_budget_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'budget evidence failure'; END $$; CREATE TRIGGER reject_budget_event BEFORE INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION reject_budget_event()",
    );
    try {
      await expect(repository(1).reserve(input())).rejects.toThrow(
        "budget evidence failure",
      );
      expect(await budget()).toBeUndefined();
      expect(
        (await pool!.query("SELECT session_id FROM demo_session_reservations"))
          .rowCount,
      ).toBe(0);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_budget_event ON demo_session_control_events; DROP FUNCTION reject_budget_event()",
      );
    }
    await repository(1).reserve(input());
    expect((await budget()).creations).toBe(1);
  });
  it("rolls back an existing-window increment when reservation evidence fails", async () => {
    await repository(2).reserve(input());
    const original = await budget();
    await pool!.query(
      "CREATE FUNCTION reject_existing_budget_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'existing budget evidence failure'; END $$; CREATE TRIGGER reject_existing_budget_event BEFORE INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION reject_existing_budget_event()",
    );
    try {
      await expect(repository(2).reserve(input())).rejects.toThrow(
        "existing budget evidence failure",
      );
      expect(await budget()).toEqual(original);
      expect(
        (await pool!.query("SELECT session_id FROM demo_session_reservations"))
          .rowCount,
      ).toBe(1);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_existing_budget_event ON demo_session_control_events; DROP FUNCTION reject_existing_budget_event()",
      );
    }
    await repository(2).reserve(input());
    expect((await budget()).creations).toBe(2);
  });

  it("does not charge failed capacity checks and copies server-owned configuration", async () => {
    const config = { maximumCreations: 1, windowSeconds: 60 };
    const admission = new PgDemoAdmissionRepository(
      pool!,
      runtime,
      { ttlSeconds: 300, maximumReservations: 1 },
      config,
    );
    config.maximumCreations = 10;
    await admission.reserve(input());
    await expect(admission.reserve(input())).rejects.toMatchObject({
      code: "CAPACITY",
    });
    expect(await budget()).toMatchObject({
      creations: 1,
      maximum_creations: 1,
    });
  });
  it("retains the bounded counter through the actual operational reset list", async () => {
    await repository().reserve(input());
    const original = await budget();
    const source = await readFile(
      "apps/api/src/database/reset-demo.ts",
      "utf8",
    );
    const reset = source.match(/TRUNCATE[\s\S]*?inbound_receipts/)?.[0];
    expect(reset).toBeDefined();
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(reset!);
      expect(
        (await client.query("SELECT * FROM demo_creation_budget")).rows,
      ).toEqual([original]);
      await expect(
        client.query(
          "INSERT INTO demo_creation_budget(singleton,window_started_at,window_seconds,maximum_creations,creations) VALUES(false,clock_timestamp(),60,1,1)",
        ),
      ).rejects.toMatchObject({ code: "23514" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
  it("denies non-owner counter read/write via row-level security", async () => {
    await repository().reserve(input());
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "CREATE ROLE swp_demo_budget_probe NOLOGIN; GRANT USAGE ON SCHEMA public TO swp_demo_budget_probe; GRANT SELECT,INSERT,UPDATE,DELETE ON demo_creation_budget TO swp_demo_budget_probe; SET LOCAL ROLE swp_demo_budget_probe",
      );
      expect(
        (await client.query("SELECT * FROM demo_creation_budget")).rowCount,
      ).toBe(0);
      expect(
        (
          await client.query(
            "UPDATE demo_creation_budget SET creations=creations",
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (await client.query("DELETE FROM demo_creation_budget")).rowCount,
      ).toBe(0);
      await expect(
        client.query(
          "INSERT INTO demo_creation_budget(singleton,window_started_at,window_seconds,maximum_creations,creations) VALUES(true,clock_timestamp(),60,1,1)",
        ),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
