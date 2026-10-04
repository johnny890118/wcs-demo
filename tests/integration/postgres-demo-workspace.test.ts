import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";
import { PgDemoReferenceWorkspaceRepository } from "../../apps/api/src/demo/pg-demo-reference-workspace.repository";
import { LocationProjectionService } from "../../apps/api/src/operations/location-projection.service";
import { PgTopologyRepository } from "../../apps/api/src/topology/pg-topology.repository";

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
const keys = ["simulator.mobile-transport"];
function snapshotRepository() {
  return new PgDemoReferenceWorkspaceRepository(pool!, runtime, keys);
}
async function reserve() {
  const sessionId = randomUUID();
  await new PgDemoAdmissionRepository(pool!, runtime, {
    ttlSeconds: 300,
    maximumReservations: 10,
  }).reserve({ sessionId, templateWarehouseId });
  return sessionId;
}

suite("PostgreSQL isolated demo reference workspaces", () => {
  beforeEach(async () => {
    const owned = await pool!.query<{ workspace_warehouse_id: string }>(
      "SELECT workspace_warehouse_id FROM demo_reference_workspaces",
    );
    const ids = owned.rows.map((row) => row.workspace_warehouse_id);
    // Only the disposable suite's owned references; never delete template rows.
    await pool!.query(
      "TRUNCATE demo_simulator_runtime_owners,demo_simulator_owner_generations,demo_creation_budget,demo_reference_cleanup_jobs,demo_reference_cleanup_archives,demo_reference_workspaces,demo_session_control_events,demo_session_reservations",
    );
    if (ids.length) {
      await pool!.query(
        "DELETE FROM location_topology_bindings WHERE warehouse_id=ANY($1::uuid[])",
        [ids],
      );
      await pool!.query(
        "DELETE FROM equipment_descriptors WHERE warehouse_id=ANY($1::uuid[])",
        [ids],
      );
      await pool!.query(
        "DELETE FROM topology_edges WHERE topology_id IN (SELECT id FROM warehouse_topologies WHERE warehouse_id=ANY($1::uuid[]))",
        [ids],
      );
      await pool!.query(
        "DELETE FROM warehouse_topologies WHERE warehouse_id=ANY($1::uuid[])",
        [ids],
      );
      await pool!.query(
        "DELETE FROM locations WHERE warehouse_id=ANY($1::uuid[])",
        [ids],
      );
      await pool!.query("DELETE FROM warehouses WHERE id=ANY($1::uuid[])", [
        ids,
      ]);
    }
  });
  afterAll(async () => {
    await pool?.end();
  });

  it("creates disjoint scoped reference identities without stock, history or observations", async () => {
    const a = await snapshotRepository().snapshot(await reserve());
    const b = await snapshotRepository().snapshot(await reserve());
    expect(a.warehouseId).not.toBe(templateWarehouseId);
    expect(a.warehouseId).not.toBe(b.warehouseId);
    expect(a.topologyId).not.toBe(b.topologyId);
    const topology = await new PgTopologyRepository(pool!).get(a.topologyId, 1);
    expect(topology?.warehouseId).toBe(a.warehouseId);
    const source = await new PgTopologyRepository(pool!).get(
      a.templateTopologyId,
      a.templateTopologyRevision,
    );
    expect(topology?.nodes).toEqual(source?.nodes);
    expect(topology?.edges).toEqual(source?.edges);
    const locations = (
      await new LocationProjectionService(pool!).list(a.warehouseId)
    ).items;
    expect(locations).toHaveLength(3);
    expect(
      locations.every(
        (location) => location.binding?.topologyId === a.topologyId,
      ),
    ).toBe(true);
    expect(
      Object.values(a.referenceMap.locations).some((id) =>
        Object.values(b.referenceMap.locations).includes(id),
      ),
    ).toBe(false);
    expect(
      Object.values(a.referenceMap.equipment).some((id) =>
        Object.values(b.referenceMap.equipment).includes(id),
      ),
    ).toBe(false);
    const equipment = await pool!.query(
      "SELECT active FROM equipment_descriptors WHERE warehouse_id=$1",
      [a.warehouseId],
    );
    expect(equipment.rows).toEqual([{ active: false }]);
    const context = await pool!.query(
      "SELECT (SELECT count(*) FROM audit_events WHERE warehouse_id=$1)::int AS audit,(SELECT count(*) FROM transport_tasks task JOIN locations location ON location.id=task.source_location_id WHERE location.warehouse_id=$1)::int AS tasks,(SELECT count(*) FROM loads load JOIN locations location ON location.id=load.current_location_id WHERE location.warehouse_id=$1)::int AS loads,(SELECT count(*) FROM equipment_observations observation JOIN equipment_descriptors descriptor ON descriptor.equipment_id=observation.equipment_id WHERE descriptor.warehouse_id=$1)::int AS observations",
      [a.warehouseId],
    );
    expect(context.rows).toEqual([
      { audit: 0, tasks: 0, loads: 0, observations: 0 },
    ]);
    expect(
      (
        await pool!.query(
          "SELECT state FROM demo_session_reservations WHERE session_id=$1",
          [a.sessionId],
        )
      ).rows,
    ).toEqual([{ state: "provisioning" }]);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM warehouse_access_assignments WHERE warehouse_id=$1",
          [a.warehouseId],
        )
      ).rows[0].count,
    ).toBe(0);
  });

  it("replays simultaneous snapshot requests without duplicate workspaces or evidence", async () => {
    const sessionId = await reserve();
    const records = await Promise.all(
      Array.from({ length: 4 }, () => snapshotRepository().snapshot(sessionId)),
    );
    expect(
      records.every(
        (value) => JSON.stringify(value) === JSON.stringify(records[0]),
      ),
    ).toBe(true);
    const events = await pool!.query(
      "SELECT count(*)::int AS count FROM demo_session_control_events WHERE session_id=$1 AND action='demo_session.workspace_snapshotted'",
      [sessionId],
    );
    expect(events.rows[0].count).toBe(1);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_reference_workspaces",
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it("denies missing/expired reservations without allocating a warehouse", async () => {
    await expect(
      snapshotRepository().snapshot(randomUUID()),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    const sessionId = await reserve();
    await pool!.query(
      "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds' WHERE session_id=$1",
      [sessionId],
    );
    await expect(
      snapshotRepository().snapshot(sessionId),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_reference_workspaces",
        )
      ).rows[0].count,
    ).toBe(0);
  });

  it("refuses missing enabled bindings rather than infer identity from matching codes", async () => {
    const sessionId = await reserve();
    const source = await pool!.query(
      "SELECT binding.* FROM location_topology_bindings binding JOIN warehouse_topologies topology ON topology.id=binding.topology_id AND topology.revision=binding.topology_revision AND topology.status='active' WHERE binding.warehouse_id=$1 ORDER BY location_id LIMIT 1",
      [templateWarehouseId],
    );
    const row = source.rows[0];
    await pool!.query(
      "DELETE FROM location_topology_bindings WHERE location_id=$1 AND topology_id=$2 AND topology_revision=$3",
      [row.location_id, row.topology_id, row.topology_revision],
    );
    try {
      await expect(
        snapshotRepository().snapshot(sessionId),
      ).rejects.toMatchObject({ code: "INVALID_TEMPLATE" });
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_reference_workspaces",
          )
        ).rows[0].count,
      ).toBe(0);
    } finally {
      await pool!.query(
        "INSERT INTO location_topology_bindings (location_id,warehouse_id,topology_id,topology_revision,node_id) VALUES ($1,$2,$3,$4,$5)",
        [
          row.location_id,
          row.warehouse_id,
          row.topology_id,
          row.topology_revision,
          row.node_id,
        ],
      );
    }
  });

  it("rejects non-registered adapters without copying a hardware descriptor", async () => {
    const sessionId = await reserve();
    const source = await pool!.query(
      "SELECT equipment_id,adapter_key FROM equipment_descriptors WHERE warehouse_id=$1 AND active=true",
      [templateWarehouseId],
    );
    const row = source.rows[0];
    await pool!.query(
      "UPDATE equipment_descriptors SET adapter_key='unregistered.integration' WHERE equipment_id=$1",
      [row.equipment_id],
    );
    try {
      await expect(
        snapshotRepository().snapshot(sessionId),
      ).rejects.toMatchObject({ code: "INVALID_TEMPLATE" });
    } finally {
      await pool!.query(
        "UPDATE equipment_descriptors SET adapter_key=$2 WHERE equipment_id=$1",
        [row.equipment_id, row.adapter_key],
      );
    }
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_reference_workspaces",
        )
      ).rows[0].count,
    ).toBe(0);
  });

  it("rolls every reference write back when snapshot control evidence fails", async () => {
    const sessionId = await reserve();
    const before = await pool!.query(
      "SELECT count(*)::int AS count FROM warehouses",
    );
    await pool!.query(
      `CREATE FUNCTION reject_demo_snapshot_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test snapshot event failure'; END $$; CREATE TRIGGER reject_demo_snapshot_probe BEFORE INSERT ON demo_session_control_events FOR EACH ROW WHEN (NEW.action='demo_session.workspace_snapshotted') EXECUTE FUNCTION reject_demo_snapshot_probe()`,
    );
    try {
      await expect(snapshotRepository().snapshot(sessionId)).rejects.toThrow(
        "test snapshot event failure",
      );
      expect(
        (await pool!.query("SELECT count(*)::int AS count FROM warehouses"))
          .rows,
      ).toEqual(before.rows);
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_reference_workspaces",
          )
        ).rows[0].count,
      ).toBe(0);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_demo_snapshot_probe ON demo_session_control_events; DROP FUNCTION reject_demo_snapshot_probe()",
      );
    }
    expect((await snapshotRepository().snapshot(sessionId)).sessionId).toBe(
      sessionId,
    );
  });

  it("rolls references back when the deadline is crossed during copying", async () => {
    const sessionId = await reserve();
    const before = await pool!.query(
      "SELECT count(*)::int AS count FROM warehouses",
    );
    await pool!.query(
      `CREATE FUNCTION expire_demo_snapshot_probe() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds' WHERE state='provisioning'; RETURN NEW; END $$; CREATE TRIGGER expire_demo_snapshot_probe AFTER INSERT ON warehouses FOR EACH ROW WHEN (NEW.name='Isolated Demo Workspace') EXECUTE FUNCTION expire_demo_snapshot_probe()`,
    );
    try {
      await expect(
        snapshotRepository().snapshot(sessionId),
      ).rejects.toMatchObject({ code: "UNAVAILABLE" });
      expect(
        (await pool!.query("SELECT count(*)::int AS count FROM warehouses"))
          .rows,
      ).toEqual(before.rows);
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_reference_workspaces",
          )
        ).rows[0].count,
      ).toBe(0);
      expect(
        (
          await pool!.query(
            "SELECT count(*)::int AS count FROM demo_session_control_events WHERE action='demo_session.workspace_snapshotted'",
          )
        ).rows[0].count,
      ).toBe(0);
    } finally {
      await pool!.query(
        "DROP TRIGGER expire_demo_snapshot_probe ON warehouses; DROP FUNCTION expire_demo_snapshot_probe()",
      );
    }
    expect((await snapshotRepository().snapshot(sessionId)).sessionId).toBe(
      sessionId,
    );
  });

  it("preserves reference ownership and evidence through the actual reset list", async () => {
    const record = await snapshotRepository().snapshot(await reserve());
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
        (
          await client.query(
            "SELECT workspace_warehouse_id FROM demo_reference_workspaces WHERE session_id=$1",
            [record.sessionId],
          )
        ).rows,
      ).toEqual([{ workspace_warehouse_id: record.warehouseId }]);
      expect(
        (
          await client.query(
            "SELECT count(*)::int AS count FROM demo_session_control_events WHERE session_id=$1 AND action='demo_session.workspace_snapshotted'",
            [record.sessionId],
          )
        ).rows[0].count,
      ).toBe(1);
      expect(
        (
          await client.query(
            "SELECT count(*)::int AS count FROM locations WHERE warehouse_id=$1",
            [record.warehouseId],
          )
        ).rows[0].count,
      ).toBe(3);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });

  it("enforces workspace ownership references and denies non-owner direct access", async () => {
    const record = await snapshotRepository().snapshot(await reserve());
    await expect(
      pool!.query(
        "UPDATE demo_reference_workspaces SET workspace_warehouse_id=template_warehouse_id WHERE session_id=$1",
        [record.sessionId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      pool!.query(
        "UPDATE demo_reference_workspaces SET template_warehouse_id=$2 WHERE session_id=$1",
        [record.sessionId, randomUUID()],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    const client = await pool!.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "CREATE ROLE swp_demo_reference_probe NOLOGIN; GRANT USAGE ON SCHEMA public TO swp_demo_reference_probe; GRANT SELECT,UPDATE,DELETE ON demo_reference_workspaces TO swp_demo_reference_probe; SET LOCAL ROLE swp_demo_reference_probe",
      );
      expect(
        (
          await client.query(
            "SELECT count(*)::int AS count FROM demo_reference_workspaces",
          )
        ).rows,
      ).toEqual([{ count: 0 }]);
      expect(
        (await client.query("DELETE FROM demo_reference_workspaces")).rowCount,
      ).toBe(0);
      expect(
        (
          await client.query(
            "UPDATE demo_reference_workspaces SET created_at=clock_timestamp()",
          )
        ).rowCount,
      ).toBe(0);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
