import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";
import { PgDemoReferenceWorkspaceRepository } from "../../apps/api/src/demo/pg-demo-reference-workspace.repository";
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
const policy = { ttlSeconds: 300, maximumReservations: 1 };
function admission() {
  return new PgDemoAdmissionRepository(pool!, runtime, policy);
}
function cleanup() {
  return new PgDemoReferenceCleanupRepository(pool!, runtime, {
    leaseSeconds: 30,
  });
}
async function reserve() {
  const sessionId = randomUUID();
  await admission().reserve({ sessionId, templateWarehouseId });
  return sessionId;
}
async function expire(sessionId: string) {
  await pool!.query(
    "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds' WHERE session_id=$1",
    [sessionId],
  );
}
async function workspace() {
  const sessionId = await reserve();
  const result = await new PgDemoReferenceWorkspaceRepository(pool!, runtime, [
    "simulator.mobile-transport",
  ]).snapshot(sessionId);
  await expire(sessionId);
  return result;
}
async function state(sessionId: string) {
  return (
    await pool!.query(
      "SELECT state FROM demo_session_reservations WHERE session_id=$1",
      [sessionId],
    )
  ).rows[0].state;
}
async function waitForBlockedQuery(fragment: string) {
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const blocked = await pool!.query(
      "SELECT pid FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND wait_event_type='Lock' AND query LIKE $1",
      [`%${fragment}%`],
    );
    if (blocked.rowCount) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Expected independently blocked query: ${fragment}`);
}
suite("PostgreSQL fenced inactive reference cleanup", () => {
  beforeEach(async () => {
    const ids = (
      await pool!.query<{ workspace_warehouse_id: string }>(
        "SELECT workspace_warehouse_id FROM demo_reference_workspaces",
      )
    ).rows.map((row) => row.workspace_warehouse_id);
    await pool!.query(
      "TRUNCATE demo_reference_cleanup_jobs,demo_reference_cleanup_archives,demo_reference_workspaces,demo_session_control_events,demo_session_reservations",
    );
    if (ids.length) {
      // Only this disposable suite's explicit owned namespaces, including rejection fixtures.
      await pool!.query(
        "DELETE FROM equipment_observations WHERE equipment_id IN (SELECT equipment_id FROM equipment_descriptors WHERE warehouse_id=ANY($1::uuid[]))",
        [ids],
      );
      for (const table of [
        "warehouse_access_assignments",
        "audit_events",
        "location_topology_bindings",
        "equipment_descriptors",
      ]) {
        await pool!.query(
          `DELETE FROM ${table} WHERE warehouse_id=ANY($1::uuid[])`,
          [ids],
        );
      }
      await pool!.query(
        "DELETE FROM topology_edges WHERE topology_id IN (SELECT id FROM warehouse_topologies WHERE warehouse_id=ANY($1::uuid[]))",
        [ids],
      );
      for (const table of ["warehouse_topologies", "locations"]) {
        await pool!.query(
          `DELETE FROM ${table} WHERE warehouse_id=ANY($1::uuid[])`,
          [ids],
        );
      }
      await pool!.query("DELETE FROM warehouses WHERE id=ANY($1::uuid[])", [
        ids,
      ]);
    }
  });
  afterAll(async () => {
    await pool?.end();
  });

  it("atomically archives owned resources, preserves template and releases capacity only once", async () => {
    const owned = await workspace();
    await expect(reserve()).rejects.toMatchObject({ code: "CAPACITY" });
    const lease = await cleanup().claim(owned.sessionId);
    await cleanup().complete(lease);
    await cleanup().complete(lease);
    expect(await state(owned.sessionId)).toBe("closed");
    expect(
      (
        await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
          owned.warehouseId,
        ])
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
          templateWarehouseId,
        ])
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await pool!.query(
          "SELECT active FROM equipment_descriptors WHERE warehouse_id=$1",
          [templateWarehouseId],
        )
      ).rows,
    ).toEqual([{ active: true }]);
    const archive = (
      await pool!.query(
        "SELECT reference_snapshot FROM demo_reference_cleanup_archives WHERE session_id=$1",
        [owned.sessionId],
      )
    ).rows[0].reference_snapshot;
    expect(archive.workspace_warehouse_id).toBe(owned.warehouseId);
    expect(archive.reference_map).toEqual(owned.referenceMap);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_session_control_events WHERE session_id=$1 AND action='demo_session.references_cleaned'",
          [owned.sessionId],
        )
      ).rows[0].count,
    ).toBe(1);
    const replay = await admission().reserve({
      sessionId: owned.sessionId,
      templateWarehouseId,
    });
    expect(replay.state).toBe("closed");
    await expect(
      new PgDemoReferenceWorkspaceRepository(pool!, runtime, [
        "simulator.mobile-transport",
      ]).snapshot(owned.sessionId),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await reserve()).not.toBe(owned.sessionId);
  });
  it("rejects unexpired/missing reservations and serializes simultaneous claims", async () => {
    const sessionId = await reserve();
    await expect(cleanup().claim(sessionId)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await expect(cleanup().claim(randomUUID())).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await expire(sessionId);
    const result = await Promise.allSettled(
      Array.from({ length: 4 }, () => cleanup().claim(sessionId)),
    );
    expect(result.filter((value) => value.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(result.filter((value) => value.status === "rejected")).toHaveLength(
      3,
    );
  });
  it("reclaims after restart with a new fencing token and rejects old/expired attempts", async () => {
    const owned = await workspace();
    const old = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "UPDATE demo_reference_cleanup_jobs SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE session_id=$1",
      [owned.sessionId],
    );
    await expect(cleanup().complete(old)).rejects.toMatchObject({
      code: "FENCED",
    });
    const next = await cleanup().claim(owned.sessionId);
    expect(next.token).not.toBe(old.token);
    expect(next.attempt).toBe(2);
    await expect(cleanup().complete(old)).rejects.toMatchObject({
      code: "FENCED",
    });
    expect(await state(owned.sessionId)).toBe("provisioning");
    await cleanup().complete(next);
  });
  it("can close failed provisioning with no namespace but never guesses orphan ownership", async () => {
    const sessionId = await reserve();
    await expire(sessionId);
    await cleanup().complete(await cleanup().claim(sessionId));
    expect(
      (
        await pool!.query(
          "SELECT reference_snapshot FROM demo_reference_cleanup_archives WHERE session_id=$1",
          [sessionId],
        )
      ).rows[0].reference_snapshot,
    ).toBeNull();
    const orphanSession = await reserve();
    await expire(orphanSession);
    const orphanId = randomUUID();
    await pool!.query(
      "INSERT INTO warehouses(id,code,name) VALUES($1,$2,'Unexplained')",
      [orphanId, `DEMO-${orphanSession}`],
    );
    try {
      await expect(
        cleanup().complete(await cleanup().claim(orphanSession)),
      ).rejects.toMatchObject({ code: "BUSY" });
      expect(
        (await pool!.query("SELECT id FROM warehouses WHERE id=$1", [orphanId]))
          .rowCount,
      ).toBe(1);
    } finally {
      await pool!.query("DELETE FROM warehouses WHERE id=$1", [orphanId]);
    }
  });
  it("refuses active equipment and any disconnected observation without deletion/release", async () => {
    const owned = await workspace();
    const equipmentId = Object.values(owned.referenceMap.equipment)[0];
    const lease = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "UPDATE equipment_descriptors SET active=true WHERE equipment_id=$1",
      [equipmentId],
    );
    await expect(cleanup().complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    await pool!.query(
      "UPDATE equipment_descriptors SET active=false WHERE equipment_id=$1",
      [equipmentId],
    );
    await pool!.query(
      "INSERT INTO equipment_observations(equipment_id,status,connection_status,quality,sequence,observed_at,source) VALUES($1,'offline','disconnected','unknown',0,clock_timestamp(),'test')",
      [equipmentId],
    );
    await expect(cleanup().complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    expect(
      (
        await pool!.query(
          "SELECT equipment_id FROM equipment_observations WHERE equipment_id=$1",
          [equipmentId],
        )
      ).rowCount,
    ).toBe(1);
    expect(await state(owned.sessionId)).toBe("provisioning");
    await expect(reserve()).rejects.toMatchObject({ code: "CAPACITY" });
  });

  it("sees an observation committed while waiting for the equipment parent lock", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    const equipmentId = Object.values(owned.referenceMap.equipment)[0];
    const writer = await pool!.connect();
    let result: Promise<unknown> | undefined;
    try {
      await writer.query("BEGIN");
      await writer.query(
        "SELECT equipment_id FROM equipment_descriptors WHERE equipment_id=$1 FOR UPDATE",
        [equipmentId],
      );
      result = cleanup()
        .complete(lease)
        .then(
          () => null,
          (error) => error,
        );
      await waitForBlockedQuery(
        "SELECT equipment_id,active FROM equipment_descriptors",
      );
      await writer.query(
        "INSERT INTO equipment_observations(equipment_id,status,connection_status,quality,sequence,observed_at,source) VALUES($1,'offline','disconnected','unknown',0,clock_timestamp(),'race')",
        [equipmentId],
      );
      await writer.query("COMMIT");
      expect(await result).toMatchObject({ code: "BUSY" });
      expect(
        (
          await pool!.query(
            "SELECT equipment_id FROM equipment_observations WHERE equipment_id=$1",
            [equipmentId],
          )
        ).rowCount,
      ).toBe(1);
      expect(await state(owned.sessionId)).toBe("provisioning");
    } finally {
      await writer.query("ROLLBACK");
      writer.release();
      await result;
    }
  });

  it("blocks late observation insertion and rejects its FK instead of silently cascading", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    const equipmentId = Object.values(owned.referenceMap.equipment)[0];
    const gate = await pool!.connect();
    const writer = await pool!.connect();
    let cleaning: Promise<unknown> | undefined;
    let inserting: Promise<unknown> | undefined;
    await pool!.query(
      "CREATE FUNCTION gate_cleanup_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(870041004); RETURN OLD; END $$; CREATE TRIGGER gate_cleanup_delete BEFORE DELETE ON demo_reference_workspaces FOR EACH ROW EXECUTE FUNCTION gate_cleanup_delete()",
    );
    try {
      await gate.query("SELECT pg_advisory_lock(870041004)");
      cleaning = cleanup()
        .complete(lease)
        .then(
          () => null,
          (error) => error,
        );
      await waitForBlockedQuery(
        "DELETE FROM demo_reference_workspaces WHERE session_id",
      );
      inserting = writer
        .query(
          "INSERT INTO equipment_observations(equipment_id,status,connection_status,quality,sequence,observed_at,source) VALUES($1,'offline','disconnected','unknown',0,clock_timestamp(),'late-race')",
          [equipmentId],
        )
        .then(
          () => null,
          (error) => error,
        );
      await waitForBlockedQuery(
        "INSERT INTO equipment_observations(equipment_id,status",
      );
      await gate.query("SELECT pg_advisory_unlock(870041004)");
      expect(await cleaning).toBeNull();
      expect(await inserting).toMatchObject({ code: "23503" });
      expect(await state(owned.sessionId)).toBe("closed");
    } finally {
      await gate.query("SELECT pg_advisory_unlock(870041004)");
      await cleaning;
      await inserting;
      gate.release();
      writer.release();
      await pool!.query(
        "DROP TRIGGER gate_cleanup_delete ON demo_reference_workspaces; DROP FUNCTION gate_cleanup_delete()",
      );
    }
  });
  it("refuses human assignments, operational audit and unexpected reference identities", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "INSERT INTO warehouse_access_assignments(principal_id,warehouse_id,permissions,status) VALUES('a0000000-0000-4000-8000-000000000001',$1,ARRAY['operations.view'],'revoked')",
      [owned.warehouseId],
    );
    await expect(cleanup().complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    await pool!.query(
      "DELETE FROM warehouse_access_assignments WHERE warehouse_id=$1",
      [owned.warehouseId],
    );
    await pool!.query(
      "INSERT INTO audit_events(id,actor_type,actor_id,action,aggregate_type,aggregate_id,details,warehouse_id,correlation_id) VALUES($1::uuid,'system','test','test','Warehouse',$2,'{}',$2,$1::text)",
      [randomUUID(), owned.warehouseId],
    );
    await expect(cleanup().complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    await pool!.query("DELETE FROM audit_events WHERE warehouse_id=$1", [
      owned.warehouseId,
    ]);
    await pool!.query(
      "INSERT INTO locations(id,warehouse_id,code,kind) VALUES($1,$2,'Unexpected','storage')",
      [randomUUID(), owned.warehouseId],
    );
    await expect(cleanup().complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    expect(await state(owned.sessionId)).toBe("provisioning");
  });
  it("rolls back all deletion/archive/capacity changes when control evidence fails", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "CREATE FUNCTION reject_cleanup_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='demo_session.references_cleaned' THEN RAISE EXCEPTION 'cleanup evidence failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_cleanup_event BEFORE INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION reject_cleanup_event()",
    );
    try {
      await expect(cleanup().complete(lease)).rejects.toThrow(
        "cleanup evidence failure",
      );
      expect(
        (
          await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
            owned.warehouseId,
          ])
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool!.query(
            "SELECT session_id FROM demo_reference_workspaces WHERE session_id=$1",
            [owned.sessionId],
          )
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool!.query(
            "SELECT session_id FROM demo_reference_cleanup_archives WHERE session_id=$1",
            [owned.sessionId],
          )
        ).rowCount,
      ).toBe(0);
      await expect(reserve()).rejects.toMatchObject({ code: "CAPACITY" });
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_cleanup_event ON demo_session_control_events; DROP FUNCTION reject_cleanup_event()",
      );
    }
    await cleanup().complete(lease);
  });
  it("fences a deadline crossed during deletion and restores removed resources", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "CREATE FUNCTION expire_cleanup_lease() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE demo_reference_cleanup_jobs SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE session_id=OLD.session_id; RETURN OLD; END $$; CREATE TRIGGER expire_cleanup_lease AFTER DELETE ON demo_reference_workspaces FOR EACH ROW EXECUTE FUNCTION expire_cleanup_lease()",
    );
    try {
      await expect(cleanup().complete(lease)).rejects.toMatchObject({
        code: "FENCED",
      });
      expect(
        (
          await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
            owned.warehouseId,
          ])
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool!.query(
            "SELECT session_id FROM demo_reference_cleanup_archives WHERE session_id=$1",
            [owned.sessionId],
          )
        ).rowCount,
      ).toBe(0);
      expect(await state(owned.sessionId)).toBe("provisioning");
    } finally {
      await pool!.query(
        "DROP TRIGGER expire_cleanup_lease ON demo_reference_workspaces; DROP FUNCTION expire_cleanup_lease()",
      );
    }
    await cleanup().complete(lease);
  });
  it("fences deadline expiry during control evidence insertion and rolls back everything", async () => {
    const owned = await workspace();
    const lease = await cleanup().claim(owned.sessionId);
    await pool!.query(
      "CREATE FUNCTION expire_cleanup_event_lease() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='demo_session.references_cleaned' THEN UPDATE demo_reference_cleanup_jobs SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE session_id=NEW.session_id; END IF; RETURN NEW; END $$; CREATE TRIGGER expire_cleanup_event_lease AFTER INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION expire_cleanup_event_lease()",
    );
    try {
      await expect(cleanup().complete(lease)).rejects.toMatchObject({
        code: "FENCED",
      });
      expect(
        (
          await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
            owned.warehouseId,
          ])
        ).rowCount,
      ).toBe(1);
      expect(
        (
          await pool!.query(
            "SELECT session_id FROM demo_reference_cleanup_archives WHERE session_id=$1",
            [owned.sessionId],
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await pool!.query(
            "SELECT id FROM demo_session_control_events WHERE session_id=$1 AND action='demo_session.references_cleaned'",
            [owned.sessionId],
          )
        ).rowCount,
      ).toBe(0);
      await expect(reserve()).rejects.toMatchObject({ code: "CAPACITY" });
    } finally {
      await pool!.query(
        "DROP TRIGGER expire_cleanup_event_lease ON demo_session_control_events; DROP FUNCTION expire_cleanup_event_lease()",
      );
    }
    await cleanup().complete(lease);
  });

  it("preserves cleanup evidence through the real reset list and denies non-owner RLS", async () => {
    const owned = await workspace();
    await cleanup().complete(await cleanup().claim(owned.sessionId));
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
      for (const table of [
        "demo_reference_cleanup_jobs",
        "demo_reference_cleanup_archives",
      ]) {
        expect(
          (
            await client.query(
              `SELECT session_id FROM ${table} WHERE session_id=$1`,
              [owned.sessionId],
            )
          ).rowCount,
        ).toBe(1);
      }
      await client.query(
        "CREATE ROLE swp_demo_cleanup_probe NOLOGIN; GRANT USAGE ON SCHEMA public TO swp_demo_cleanup_probe; GRANT SELECT,INSERT,UPDATE,DELETE ON demo_reference_cleanup_jobs,demo_reference_cleanup_archives TO swp_demo_cleanup_probe; SET LOCAL ROLE swp_demo_cleanup_probe",
      );
      for (const table of [
        "demo_reference_cleanup_jobs",
        "demo_reference_cleanup_archives",
      ]) {
        expect((await client.query(`SELECT * FROM ${table}`)).rowCount).toBe(0);
        expect(
          (await client.query(`UPDATE ${table} SET session_id=session_id`))
            .rowCount,
        ).toBe(0);
        expect((await client.query(`DELETE FROM ${table}`)).rowCount).toBe(0);
      }
      await client.query("SAVEPOINT insert_probe");
      await expect(
        client.query(
          "INSERT INTO demo_reference_cleanup_archives(session_id,lease_token) VALUES($1,$2)",
          [randomUUID(), randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("ROLLBACK TO SAVEPOINT insert_probe");
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
