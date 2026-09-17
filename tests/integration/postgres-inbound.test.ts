import { createHash } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgInboundExecutionRepository } from "../../apps/api/src/execution/pg-inbound-execution.repository";
import { IdempotencyConflictError } from "../../apps/api/src/inbound/inbound.errors";
import { PgInboundRepository } from "../../apps/api/src/inbound/pg-inbound.repository";
import { PgOutboxRepository } from "../../apps/api/src/outbox/pg-outbox.repository";
import { OperationsSummaryService } from "../../apps/api/src/operations/operations-summary.service";
import { PgTopologyRepository } from "../../apps/api/src/topology/pg-topology.repository";
import type {
  CreateInboundReceipt,
  InboundIdentifiers,
} from "../../apps/api/src/inbound/inbound.types";
import { DeterministicInboundExecutor } from "../../src/application/execution/inbound-execution";
import { TopologyActivationService } from "../../src/application/topology/topology-activation";
import {
  OutboxProcessor,
  type OutboxEvent,
} from "../../src/application/outbox/outbox";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";

const runIntegration = process.env.RUN_POSTGRES_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;
const connectionString = process.env.DATABASE_URL;
const pool =
  runIntegration && connectionString ? new Pool({ connectionString }) : null;

const command: CreateInboundReceipt = {
  idempotencyKey: "integration-request-0001",
  actorId: "integration-test",
  externalReference: "ASN-INTEGRATION-0001",
  load: {
    externalId: "PALLET-INTEGRATION-0001",
    sku: "SKU-INTEGRATION-0001",
    quantity: 24,
  },
  sourceLocationId: "20000000-0000-4000-8000-000000000001",
  destinationLocationId: "20000000-0000-4000-8000-000000000002",
};

const identifiers: InboundIdentifiers = {
  receiptId: "30000000-0000-4000-8000-000000000001",
  loadId: "40000000-0000-4000-8000-000000000001",
  transportTaskId: "50000000-0000-4000-8000-000000000001",
  outboxEventId: "60000000-0000-4000-8000-000000000001",
  auditEventId: "70000000-0000-4000-8000-000000000001",
};

function requestHash(value: CreateInboundReceipt): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function idFactory(): () => string {
  let sequence = 0;
  return () =>
    `80000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
}

describeIntegration("PostgreSQL inbound vertical slice", () => {
  beforeEach(async () => {
    await pool?.query(
      `TRUNCATE route_plan_edges, route_plans, audit_events, outbox_events, inventory_units,
        transport_tasks, loads, inbound_receipts`,
    );
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("persists request, deterministic movement, and inventory confirmation", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const inbound = new PgInboundRepository(pool);
    const created = await inbound.create(
      command,
      identifiers,
      requestHash(command),
    );
    expect(created).toMatchObject({ status: "requested", duplicate: false });

    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const executor = new DeterministicInboundExecutor(
      new PgInboundExecutionRepository(pool),
      equipment,
      new ManualClock(1_000),
      idFactory(),
    );
    await executor.execute({
      taskId: identifiers.transportTaskId,
      equipmentId: "AMR-01",
      actorId: command.actorId,
    });

    const publishedEvents: OutboxEvent[] = [];
    const outbox = new OutboxProcessor(
      new PgOutboxRepository(pool),
      {
        publish: async (event) => {
          publishedEvents.push(event);
        },
      },
      "integration-worker",
      () => new Date(Date.now() + 1_000),
    );
    await expect(outbox.drainOnce()).resolves.toEqual({
      claimed: 4,
      published: 4,
      failed: 0,
    });
    expect(publishedEvents).toHaveLength(4);

    const result = await pool.query<{
      task_status: string;
      load_status: string;
      receipt_status: string;
      location_id: string;
      inventory_count: string;
      outbox_count: string;
      published_count: string;
      audit_count: string;
    }>(
      `SELECT t.status AS task_status, l.status AS load_status,
        r.status AS receipt_status, i.location_id,
        (SELECT count(*) FROM inventory_units) AS inventory_count,
        (SELECT count(*) FROM outbox_events) AS outbox_count,
        (SELECT count(*) FROM outbox_events WHERE published_at IS NOT NULL) AS published_count,
        (SELECT count(*) FROM audit_events) AS audit_count
       FROM transport_tasks t
       JOIN loads l ON l.id = t.load_id
       JOIN inbound_receipts r ON r.id = t.receipt_id
       JOIN inventory_units i ON i.load_id = l.id
       WHERE t.id = $1`,
      [identifiers.transportTaskId],
    );

    expect(result.rows[0]).toEqual({
      task_status: "completed",
      load_status: "stored",
      receipt_status: "completed",
      location_id: command.destinationLocationId,
      inventory_count: "1",
      outbox_count: "4",
      published_count: "4",
      audit_count: "4",
    });
  });

  it("returns the original records for an identical idempotent replay", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const repository = new PgInboundRepository(pool);
    await repository.create(command, identifiers, requestHash(command));

    const replay = await repository.create(
      command,
      {
        receiptId: "30000000-0000-4000-8000-000000000002",
        loadId: "40000000-0000-4000-8000-000000000002",
        transportTaskId: "50000000-0000-4000-8000-000000000002",
        outboxEventId: "60000000-0000-4000-8000-000000000002",
        auditEventId: "70000000-0000-4000-8000-000000000002",
      },
      requestHash(command),
    );

    expect(replay).toEqual({
      receiptId: identifiers.receiptId,
      loadId: identifiers.loadId,
      transportTaskId: identifiers.transportTaskId,
      status: "requested",
      duplicate: true,
    });
  });

  it("rejects reuse of an idempotency key with different input", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const repository = new PgInboundRepository(pool);
    await repository.create(command, identifiers, requestHash(command));
    const changed = {
      ...command,
      load: { ...command.load, quantity: command.load.quantity + 1 },
    };

    await expect(
      repository.create(changed, identifiers, requestHash(changed)),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("returns data-backed operations projections without inferring missing state", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const summary = await new OperationsSummaryService(pool).getSummary();

    expect(summary).toMatchObject({
      counts: {
        activeTasks: 0,
        storedInventory: 0,
        openReceipts: 0,
        configuredEquipment: 1,
      },
      topology: {
        topologyId: "90000000-0000-4000-8000-000000000001",
        revision: 1,
      },
      recentTasks: [],
    });
    expect(Number.isNaN(Date.parse(summary.generatedAt))).toBe(false);

    const details = await new OperationsSummaryService(pool).getDetails();
    expect(details).toMatchObject({
      tasks: [],
      inventory: [],
      equipment: [
        {
          equipmentId: "AMR-01",
          adapterKey: "simulator.mobile-transport",
          active: true,
        },
      ],
      topology: {
        topologyId: "90000000-0000-4000-8000-000000000001",
        revision: 1,
        nodes: [
          { nodeId: "RECEIVING-01", kind: "transfer" },
          { nodeId: "STORAGE-A-01", kind: "storage" },
        ],
        edges: [
          {
            edgeId: "RECEIVING-TO-STORAGE",
            fromNodeId: "RECEIVING-01",
            toNodeId: "STORAGE-A-01",
          },
          {
            edgeId: "STORAGE-TO-RECEIVING",
            fromNodeId: "STORAGE-A-01",
            toNodeId: "RECEIVING-01",
          },
        ],
      },
    });
  });

  it("loads persisted capabilities and atomically activates a valid topology revision", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");

    const configuration = await pool.query<{
      source_capabilities: string[];
      destination_capabilities: string[];
      equipment_capabilities: string[];
    }>(
      `SELECT
        (SELECT capabilities FROM locations WHERE id = $1) AS source_capabilities,
        (SELECT capabilities FROM locations WHERE id = $2) AS destination_capabilities,
        (SELECT capabilities FROM equipment_descriptors WHERE equipment_id = 'AMR-01') AS equipment_capabilities`,
      [command.sourceLocationId, command.destinationLocationId],
    );
    expect(configuration.rows[0]).toEqual({
      source_capabilities: ["load.pickup"],
      destination_capabilities: ["load.dropoff", "inventory.store"],
      equipment_capabilities: [
        "transport.move",
        "load.pickup",
        "load.dropoff",
        "navigation.graph",
      ],
    });

    await pool.query(
      `INSERT INTO warehouse_topologies (id, warehouse_id, revision, status)
       VALUES ('90000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 2, 'draft');
       INSERT INTO topology_nodes
         (topology_id, topology_revision, node_id, kind, capabilities)
       VALUES
         ('90000000-0000-4000-8000-000000000001', 2, 'A', 'transfer', ARRAY[]::text[]),
         ('90000000-0000-4000-8000-000000000001', 2, 'B', 'storage', ARRAY[]::text[]);
       INSERT INTO topology_edges
         (topology_id, topology_revision, edge_id, from_node_id, to_node_id, cost, status)
       VALUES
         ('90000000-0000-4000-8000-000000000001', 2, 'A-B', 'A', 'B', 1, 'available');`,
    );

    const activated = await new TopologyActivationService(
      new PgTopologyRepository(pool),
    ).activate("90000000-0000-4000-8000-000000000001", 2);
    expect(activated).toMatchObject({ revision: 2, status: "active" });

    const versions = await pool.query<{ revision: number; status: string }>(
      `SELECT revision, status
       FROM warehouse_topologies
       WHERE id = '90000000-0000-4000-8000-000000000001'
       ORDER BY revision`,
    );
    expect(versions.rows).toEqual([
      { revision: 1, status: "retired" },
      { revision: 2, status: "active" },
    ]);
  });
});
