import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";
import { PgDemoReferenceWorkspaceRepository } from "../../apps/api/src/demo/pg-demo-reference-workspace.repository";
import { PgDemoRuntimeOwnershipRepository } from "../../apps/api/src/demo/pg-demo-runtime-ownership.repository";
import { PgDemoReferenceCleanupRepository } from "../../apps/api/src/demo/pg-demo-reference-cleanup.repository";
import { PgTopologyRepository } from "../../apps/api/src/topology/pg-topology.repository";
import { PgInboundRepository } from "../../apps/api/src/inbound/pg-inbound.repository";
import { InboundService } from "../../apps/api/src/inbound/inbound.service";
import { OutboundService } from "../../apps/api/src/outbound/outbound.service";
import { PgOutboundRepository } from "../../apps/api/src/outbound/pg-outbound.repository";
import { PgOutboundExecutionRepository } from "../../apps/api/src/execution/pg-outbound-execution.repository";
import { DeterministicOutboundExecutor } from "../../src/application/execution/outbound-execution";
import { PgInboundExecutionRepository } from "../../apps/api/src/execution/pg-inbound-execution.repository";
import { DeterministicInboundExecutor } from "../../src/application/execution/inbound-execution";
import type { DemoReferenceWorkspaceRecord } from "../../src/application/demo/demo-reference-workspace";
import type { EquipmentDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import type { EquipmentObservationWrite } from "../../src/application/equipment/equipment-observation-sink";
import { createIsolatedDemoSimulator } from "../../src/infrastructure/simulator/isolated-demo-simulator";

const enabled = process.env.RUN_POSTGRES_INTEGRATION === "1";
const suite = enabled ? describe : describe.skip;
const pool = enabled
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;
const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;
const templateWarehouseId = "10000000-0000-4000-8000-000000000001";
function ownership(leaseSeconds = 30) {
  return new PgDemoRuntimeOwnershipRepository(pool!, runtime, { leaseSeconds });
}
async function workspace() {
  const sessionId = randomUUID();
  await new PgDemoAdmissionRepository(pool!, runtime, {
    ttlSeconds: 300,
    maximumReservations: 10,
  }).reserve({ sessionId, templateWarehouseId });
  return new PgDemoReferenceWorkspaceRepository(pool!, runtime, [
    "simulator.mobile-transport",
  ]).snapshot(sessionId);
}
function initial(
  record: DemoReferenceWorkspaceRecord,
  sequence = 0,
): EquipmentObservationWrite {
  return {
    equipmentId: Object.values(record.referenceMap.equipment)[0],
    topologyId: null,
    topologyRevision: null,
    nodeId: null,
    status: "offline",
    taskId: null,
    loadId: null,
    faultCode: null,
    connectionStatus: "connected",
    quality: "good",
    sequence,
    // Host and disposable Docker DB clocks may differ by a few milliseconds;
    // test evidence is intentionally recent, never ahead of the DB authority.
    observedAt: new Date(Date.now() - 1000),
    source: "isolated-demo-simulator",
  };
}
async function expireSession(sessionId: string) {
  await pool!.query(
    "UPDATE demo_session_reservations SET created_at=created_at-interval '301 seconds',expires_at=expires_at-interval '301 seconds' WHERE session_id=$1",
    [sessionId],
  );
}
async function bundle(record: DemoReferenceWorkspaceRecord) {
  const owner = ownership();
  const lease = await owner.claim(record.sessionId);
  const topology = await new PgTopologyRepository(pool!).get(
    record.topologyId,
    1,
  );
  const equipment = await pool!.query(
    "SELECT equipment_id,adapter_key,capabilities,supported_commands,constraints FROM equipment_descriptors WHERE warehouse_id=$1",
    [record.warehouseId],
  );
  const local = createIsolatedDemoSimulator(
    runtime,
    record.sessionId,
    {
      warehouseId: record.warehouseId,
      topology: topology!,
      locations: [],
      bindings: [],
      equipment: equipment.rows.map(
        (row) =>
          ({
            equipmentId: row.equipment_id,
            adapterKey: row.adapter_key,
            capabilities: row.capabilities,
            supportedCommands: row.supported_commands,
            constraints: row.constraints,
          }) as EquipmentDescriptor,
      ),
      referenceMap: record.referenceMap,
    },
    owner.observationSink(lease),
    { maximumCommands: 50 },
    () => new Date(Date.now() - 1000),
  );
  await local.heartbeat();
  await owner.activate(lease);
  return { local, lease, owner };
}
suite("PostgreSQL durable demo simulator ownership", () => {
  beforeEach(async () => {
    const source = await readFile(
      "apps/api/src/database/reset-demo.ts",
      "utf8",
    );
    const reset = source.match(/TRUNCATE[\s\S]*?inbound_receipts/)?.[0];
    expect(reset).toBeDefined();
    // Actual reset is confined to this dedicated disposable suite database.
    await pool!.query(reset!);
    const ids = (
      await pool!.query<{ workspace_warehouse_id: string }>(
        "SELECT workspace_warehouse_id FROM demo_reference_workspaces",
      )
    ).rows.map((row) => row.workspace_warehouse_id);
    await pool!.query(
      "TRUNCATE demo_simulator_runtime_owners,demo_simulator_owner_generations,demo_creation_budget,demo_reference_cleanup_jobs,demo_reference_cleanup_archives,demo_reference_workspaces,demo_session_control_events,demo_session_reservations",
    );
    if (ids.length) {
      await pool!.query(
        "DELETE FROM equipment_observations WHERE equipment_id IN (SELECT equipment_id FROM equipment_descriptors WHERE warehouse_id=ANY($1::uuid[]))",
        [ids],
      );
      for (const table of [
        "warehouse_access_assignments",
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

  it("serializes independent claims and persists exactly one initial owner generation", async () => {
    const record = await workspace();
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () => ownership().claim(record.sessionId)),
    );
    expect(
      results.filter((value) => value.status === "fulfilled"),
    ).toHaveLength(1);
    for (const result of results.filter((value) => value.status === "rejected"))
      expect(result.reason).toMatchObject({ code: "BUSY" });
    expect(
      (
        await pool!.query(
          "SELECT generation,initial_state FROM demo_simulator_owner_generations",
        )
      ).rows,
    ).toEqual([{ generation: 1, initial_state: "initializing" }]);
    expect(
      (
        await pool!.query(
          "SELECT count(*)::int AS count FROM demo_session_control_events WHERE action='demo_session.runtime_claimed'",
        )
      ).rows[0].count,
    ).toBe(1);
  });
  it("requires offline initialization before activation and does not grant session access", async () => {
    const record = await workspace();
    const owner = ownership();
    const lease = await owner.claim(record.sessionId);
    await expect(owner.activate(lease)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await expect(
      owner
        .observationSink(lease)
        .publish({ ...initial(record), status: "idle" }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await owner.observationSink(lease).publish(initial(record));
    expect((await owner.activate(lease)).state).toBe("active");
    expect((await owner.activate(lease)).state).toBe("active");
    expect(
      (
        await pool!.query(
          "SELECT state FROM demo_session_reservations WHERE session_id=$1",
          [record.sessionId],
        )
      ).rows[0].state,
    ).toBe("provisioning");
    expect(
      (
        await pool!.query(
          "SELECT principal_id FROM warehouse_access_assignments WHERE warehouse_id=$1",
          [record.warehouseId],
        )
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool!.query(
          "SELECT active FROM equipment_descriptors WHERE warehouse_id=$1",
          [record.warehouseId],
        )
      ).rows,
    ).toEqual([{ active: true }]);
  });
  it("runs the normalized WMS Lite/WCS/observation path without affecting a second workspace", async () => {
    const a = await workspace();
    const b = await workspace();
    const ownedA = await bundle(a);
    const ownedB = await bundle(b);
    const equipmentId = Object.values(a.referenceMap.equipment)[0];
    await ownedA.local.equipment.dispatch({
      equipmentId,
      commandId: randomUUID(),
      command: { type: "bring_online" },
    });
    const locations = (
      await pool!.query("SELECT id,kind FROM locations WHERE warehouse_id=$1", [
        a.warehouseId,
      ])
    ).rows;
    const receipt = await new InboundService(
      new PgInboundRepository(pool!),
    ).create({
      idempotencyKey: randomUUID(),
      actorId: `anonymous-demo:${a.sessionId}`,
      actorType: "anonymous_demo",
      warehouseId: a.warehouseId,
      externalReference: "OWNED-RECEIPT",
      load: { externalId: randomUUID(), sku: "OWNED-SKU", quantity: 3 },
      sourceLocationId: locations.find((row) => row.kind === "receiving").id,
      destinationLocationId: locations.find((row) => row.kind === "storage").id,
    });
    const result = await new DeterministicInboundExecutor(
      new PgInboundExecutionRepository(pool!),
      ownedA.local.equipment,
      ownedA.local.clock,
      randomUUID,
    ).execute({
      taskId: receipt.transportTaskId,
      equipmentId,
      actorId: `anonymous-demo:${a.sessionId}`,
      actorType: "anonymous_demo",
      warehouseId: a.warehouseId,
      confirmationReason: "Verify owned demo simulator execution.",
    });
    expect(result.status).toBe("completed");
    expect(ownedA.local.clock.now()).toBe(5000);
    expect(ownedB.local.clock.now()).toBe(0);
    expect(
      (
        await pool!.query(
          "SELECT inventory.quantity FROM inventory_units inventory JOIN locations location ON location.id=inventory.location_id WHERE location.warehouse_id=$1",
          [a.warehouseId],
        )
      ).rows,
    ).toEqual([{ quantity: 3 }]);
    expect(
      (
        await pool!.query(
          "SELECT id FROM inbound_receipts WHERE warehouse_id=$1",
          [b.warehouseId],
        )
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await pool!.query(
          "SELECT equipment_id,status,topology_id FROM equipment_observations WHERE equipment_id=$1",
          [equipmentId],
        )
      ).rows[0],
    ).toMatchObject({ status: "idle", topology_id: a.topologyId });
    expect(
      await ownedB.local.equipment.getState(
        Object.values(b.referenceMap.equipment)[0],
      ),
    ).toMatchObject({ status: "offline", taskId: null, nodeId: null });
    const outbound = await new OutboundService(
      new PgOutboundRepository(pool!),
    ).create({
      idempotencyKey: randomUUID(),
      actorId: `anonymous-demo:${a.sessionId}`,
      actorType: "anonymous_demo",
      warehouseId: a.warehouseId,
      externalReference: "OWNED-OUTBOUND",
      sku: "OWNED-SKU",
      quantity: 3,
      destinationLocationId: locations.find((row) => row.kind === "shipping")
        .id,
    });
    const allocation = (
      await pool!.query(
        "SELECT inventory.id,inventory.location_id,inventory.load_id FROM inventory_allocations allocation JOIN inventory_units inventory ON inventory.id=allocation.inventory_unit_id WHERE allocation.id=$1",
        [outbound.allocationIds[0]],
      )
    ).rows[0];
    const foreignLocation = (
      await pool!.query(
        "SELECT id FROM locations WHERE warehouse_id=$1 LIMIT 1",
        [b.warehouseId],
      )
    ).rows[0].id;
    await pool!.query("UPDATE inventory_units SET location_id=$2 WHERE id=$1", [
      allocation.id,
      foreignLocation,
    ]);
    await expect(
      ownedA.owner.observationSink(ownedA.lease).publish({
        ...initial(a),
        sequence: 100,
        taskId: outbound.transportTaskIds[0]!,
        loadId: allocation.id,
      }),
    ).rejects.toMatchObject({ code: "INVALID" });
    await pool!.query("UPDATE inventory_units SET location_id=$2 WHERE id=$1", [
      allocation.id,
      allocation.location_id,
    ]);
    // Existing disjoint-flow DB constraint also rejects bypassing allocation
    // with a non-null outbound task load; sink independently checks this shape.
    await expect(
      pool!.query("UPDATE transport_tasks SET load_id=$2 WHERE id=$1", [
        outbound.transportTaskIds[0],
        allocation.load_id,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
    const shipped = await new DeterministicOutboundExecutor(
      new PgOutboundExecutionRepository(pool!),
      ownedA.local.equipment,
      ownedA.local.clock,
      randomUUID,
    ).execute({
      taskId: outbound.transportTaskIds[0]!,
      equipmentId,
      actorId: `anonymous-demo:${a.sessionId}`,
      actorType: "anonymous_demo",
      warehouseId: a.warehouseId,
      confirmationReason: "Verify owned outbound observation lineage.",
    });
    expect(shipped.status).toBe("completed");
    expect(ownedB.local.clock.now()).toBe(0);
    await ownedA.local.stop();
    await ownedB.local.stop();
  });
  it("fences old tokens and marks expired takeover unknown instead of restoring idle", async () => {
    const record = await workspace();
    const owner = ownership();
    const old = await owner.claim(record.sessionId);
    await owner.observationSink(old).publish(initial(record));
    await owner.activate(old);
    await pool!.query(
      "UPDATE demo_simulator_runtime_owners SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE session_id=$1",
      [record.sessionId],
    );
    await expect(owner.renew(old)).rejects.toMatchObject({ code: "FENCED" });
    const next = await ownership().claim(record.sessionId);
    expect(next).toMatchObject({ generation: 2, state: "unknown" });
    expect(next.token).not.toBe(old.token);
    await expect(
      owner.observationSink(old).publish(initial(record, 99)),
    ).rejects.toMatchObject({ code: "FENCED" });
    await expect(
      owner.observationSink(next).publish(initial(record, 99)),
    ).rejects.toMatchObject({ code: "FENCED" });
    await expect(owner.activate(next)).rejects.toMatchObject({
      code: "FENCED",
    });
    await expect(owner.renew(next)).rejects.toMatchObject({ code: "FENCED" });
    expect(
      (
        await pool!.query(
          "SELECT sequence FROM equipment_observations WHERE equipment_id=$1",
          [initial(record).equipmentId],
        )
      ).rows[0].sequence,
    ).toBe("0");
    expect(
      (
        await pool!.query(
          "SELECT generation,initial_state FROM demo_simulator_owner_generations ORDER BY generation",
        )
      ).rows,
    ).toEqual([
      { generation: 1, initial_state: "initializing" },
      { generation: 2, initial_state: "unknown" },
    ]);
  });
  it("caps renewals at session expiry and refuses expired session writes/activation", async () => {
    const record = await workspace();
    const owner = ownership(300);
    const lease = await owner.claim(record.sessionId);
    const expiry = (
      await pool!.query(
        "SELECT expires_at FROM demo_session_reservations WHERE session_id=$1",
        [record.sessionId],
      )
    ).rows[0].expires_at;
    expect(Date.parse((await owner.renew(lease)).expiresAt)).toBe(
      expiry.getTime(),
    );
    await expireSession(record.sessionId);
    await expect(owner.renew(lease)).rejects.toMatchObject({ code: "FENCED" });
    await expect(owner.activate(lease)).rejects.toMatchObject({
      code: "FENCED",
    });
    await expect(
      owner.observationSink(lease).publish(initial(record)),
    ).rejects.toMatchObject({ code: "FENCED" });
    await expect(owner.claim(record.sessionId)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
  });
  it("denies foreign equipment/topology/node and task/load lineage without updating observations", async () => {
    const a = await workspace();
    const b = await workspace();
    const owned = await bundle(a);
    const sink = owned.owner.observationSink(owned.lease);
    const locations = (
      await pool!.query("SELECT id,kind FROM locations WHERE warehouse_id=$1", [
        b.warehouseId,
      ])
    ).rows;
    const foreign = await new InboundService(
      new PgInboundRepository(pool!),
    ).create({
      idempotencyKey: randomUUID(),
      actorId: `anonymous-demo:${b.sessionId}`,
      actorType: "anonymous_demo",
      warehouseId: b.warehouseId,
      externalReference: "FOREIGN-LINEAGE",
      load: { externalId: randomUUID(), sku: "FOREIGN", quantity: 1 },
      sourceLocationId: locations.find((row) => row.kind === "receiving").id,
      destinationLocationId: locations.find((row) => row.kind === "storage").id,
    });
    const localLocations = (
      await pool!.query("SELECT id,kind FROM locations WHERE warehouse_id=$1", [
        a.warehouseId,
      ])
    ).rows;
    const foreignLoad = (
      await pool!.query("SELECT load_id FROM transport_tasks WHERE id=$1", [
        foreign.transportTaskId,
      ])
    ).rows[0].load_id;
    // Deliberately corrupt endpoint/location ownership in this disposable DB;
    // receipt lineage must still prevent a foreign task/load being laundered.
    await pool!.query("UPDATE loads SET current_location_id=$2 WHERE id=$1", [
      foreignLoad,
      localLocations.find((row) => row.kind === "receiving").id,
    ]);
    await pool!.query(
      "UPDATE transport_tasks SET source_location_id=$2,destination_location_id=$3 WHERE id=$1",
      [
        foreign.transportTaskId,
        localLocations.find((row) => row.kind === "receiving").id,
        localLocations.find((row) => row.kind === "storage").id,
      ],
    );
    for (const observation of [
      { ...initial(b), sequence: 10 },
      {
        ...initial(a),
        sequence: 10,
        nodeId: "RECEIVING-01",
        topologyId: b.topologyId,
        topologyRevision: 1,
      },
      {
        ...initial(a),
        sequence: 10,
        nodeId: "foreign",
        topologyId: a.topologyId,
        topologyRevision: 1,
      },
      { ...initial(a), sequence: 10, taskId: randomUUID() },
      { ...initial(a), sequence: 10, loadId: randomUUID() },
      { ...initial(a), sequence: 10, taskId: foreign.transportTaskId },
      { ...initial(a), sequence: 10, loadId: foreignLoad },
    ])
      await expect(sink.publish(observation)).rejects.toMatchObject({
        code: "INVALID",
      });
    expect(
      (
        await pool!.query(
          "SELECT sequence FROM equipment_observations WHERE equipment_id=$1",
          [initial(a).equipmentId],
        )
      ).rows[0].sequence,
    ).toBe("0");
  });
  it("rejects stale/future initialization and expired activation telemetry using database time", async () => {
    const record = await workspace();
    const owner = ownership(300);
    const lease = await owner.claim(record.sessionId);
    const sink = owner.observationSink(lease);
    for (const observedAt of [
      new Date(Date.now() - 60_000),
      new Date(Date.now() + 60_000),
    ])
      await expect(
        sink.publish({ ...initial(record), observedAt }),
      ).rejects.toMatchObject({ code: "INVALID" });
    await sink.publish(initial(record));
    await pool!.query(
      "UPDATE equipment_observations SET observed_at=clock_timestamp()-interval '31 seconds',received_at=clock_timestamp()-interval '31 seconds' WHERE equipment_id=$1",
      [initial(record).equipmentId],
    );
    await expect(owner.activate(lease)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await pool!.query(
      "UPDATE equipment_observations SET observed_at=clock_timestamp()+interval '60 seconds',received_at=clock_timestamp() WHERE equipment_id=$1",
      [initial(record).equipmentId],
    );
    await expect(owner.activate(lease)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    await sink.publish(initial(record, 1));
    expect((await owner.activate(lease)).state).toBe("active");
  });
  it("rolls activation back if control evidence fails", async () => {
    const record = await workspace();
    const owner = ownership();
    const lease = await owner.claim(record.sessionId);
    await owner.observationSink(lease).publish(initial(record));
    await pool!.query(
      "CREATE FUNCTION reject_runtime_activation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='demo_session.runtime_activated' THEN RAISE EXCEPTION 'runtime activation evidence failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_runtime_activation BEFORE INSERT ON demo_session_control_events FOR EACH ROW EXECUTE FUNCTION reject_runtime_activation()",
    );
    try {
      await expect(owner.activate(lease)).rejects.toThrow(
        "runtime activation evidence failure",
      );
      expect(
        (
          await pool!.query(
            "SELECT state FROM demo_simulator_runtime_owners WHERE session_id=$1",
            [record.sessionId],
          )
        ).rows[0].state,
      ).toBe("initializing");
      expect(
        (
          await pool!.query(
            "SELECT active FROM equipment_descriptors WHERE warehouse_id=$1",
            [record.warehouseId],
          )
        ).rows,
      ).toEqual([{ active: false }]);
    } finally {
      await pool!.query(
        "DROP TRIGGER reject_runtime_activation ON demo_session_control_events; DROP FUNCTION reject_runtime_activation()",
      );
    }
    await owner.activate(lease);
  });
  it("rolls publication back if the lease expires during its write", async () => {
    const record = await workspace();
    const owner = ownership();
    const lease = await owner.claim(record.sessionId);
    await pool!.query(
      `CREATE FUNCTION expire_runtime_publication() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE demo_simulator_runtime_owners SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE warehouse_id=(SELECT warehouse_id FROM equipment_descriptors WHERE equipment_id=NEW.equipment_id); RETURN NEW; END $$; CREATE TRIGGER expire_runtime_publication AFTER INSERT ON equipment_observations FOR EACH ROW EXECUTE FUNCTION expire_runtime_publication()`,
    );
    try {
      await expect(
        owner.observationSink(lease).publish(initial(record)),
      ).rejects.toMatchObject({ code: "FENCED" });
      expect(
        (
          await pool!.query(
            "SELECT equipment_id FROM equipment_observations WHERE equipment_id=$1",
            [initial(record).equipmentId],
          )
        ).rowCount,
      ).toBe(0);
    } finally {
      await pool!.query(
        "DROP TRIGGER expire_runtime_publication ON equipment_observations; DROP FUNCTION expire_runtime_publication()",
      );
    }
    await owner.observationSink(lease).publish(initial(record));
  });
  it("refuses inactive cleanup even after local stop or live owner row removal", async () => {
    const record = await workspace();
    const owned = await bundle(record);
    await owned.local.stop();
    await expireSession(record.sessionId);
    const cleanup = new PgDemoReferenceCleanupRepository(pool!, runtime, {
      leaseSeconds: 30,
    });
    const lease = await cleanup.claim(record.sessionId);
    await expect(cleanup.complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    await pool!.query(
      "DELETE FROM demo_simulator_runtime_owners WHERE session_id=$1",
      [record.sessionId],
    );
    await expect(cleanup.complete(lease)).rejects.toMatchObject({
      code: "BUSY",
    });
    expect(
      (
        await pool!.query("SELECT id FROM warehouses WHERE id=$1", [
          record.warehouseId,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it("retains ownership generations through operational reset and denies non-owner RLS", async () => {
    const record = await workspace();
    await ownership().claim(record.sessionId);
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
        "demo_simulator_runtime_owners",
        "demo_simulator_owner_generations",
      ])
        expect(
          (
            await client.query(
              `SELECT session_id FROM ${table} WHERE session_id=$1`,
              [record.sessionId],
            )
          ).rowCount,
        ).toBe(1);
      await client.query(
        "CREATE ROLE swp_demo_owner_probe NOLOGIN; GRANT USAGE ON SCHEMA public TO swp_demo_owner_probe; GRANT SELECT,UPDATE,DELETE,INSERT ON demo_simulator_runtime_owners,demo_simulator_owner_generations TO swp_demo_owner_probe; SET LOCAL ROLE swp_demo_owner_probe",
      );
      for (const table of [
        "demo_simulator_runtime_owners",
        "demo_simulator_owner_generations",
      ]) {
        expect((await client.query(`SELECT * FROM ${table}`)).rowCount).toBe(0);
        expect(
          (await client.query(`UPDATE ${table} SET generation=generation`))
            .rowCount,
        ).toBe(0);
        expect((await client.query(`DELETE FROM ${table}`)).rowCount).toBe(0);
      }
      await expect(
        client.query(
          "INSERT INTO demo_simulator_owner_generations(session_id,generation,lease_token,initial_state,initial_lease_expires_at) VALUES($1,1,$2,'initializing',clock_timestamp())",
          [randomUUID(), randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
