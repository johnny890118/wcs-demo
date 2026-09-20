import { createHash } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgInboundExecutionRepository } from "../../apps/api/src/execution/pg-inbound-execution.repository";
import { PgFaultRecoveryRepository } from "../../apps/api/src/execution/pg-fault-recovery.repository";
import { PgOutboundExecutionRepository } from "../../apps/api/src/execution/pg-outbound-execution.repository";
import { PgEquipmentObservationSink } from "../../apps/api/src/execution/pg-equipment-observation.sink";
import { IdempotencyConflictError } from "../../apps/api/src/inbound/inbound.errors";
import { PgInboundRepository } from "../../apps/api/src/inbound/pg-inbound.repository";
import { PgOutboxRepository } from "../../apps/api/src/outbox/pg-outbox.repository";
import { OperationsSummaryService } from "../../apps/api/src/operations/operations-summary.service";
import { InsufficientInventoryError } from "../../apps/api/src/outbound/outbound.errors";
import { PgOutboundRepository } from "../../apps/api/src/outbound/pg-outbound.repository";
import type {
  CreateOutboundOrder,
  OutboundIdentifiers,
} from "../../apps/api/src/outbound/outbound.types";
import { PgTopologyRepository } from "../../apps/api/src/topology/pg-topology.repository";
import type {
  CreateInboundReceipt,
  InboundIdentifiers,
} from "../../apps/api/src/inbound/inbound.types";
import { DeterministicInboundExecutor } from "../../src/application/execution/inbound-execution";
import { DeterministicOutboundExecutor } from "../../src/application/execution/outbound-execution";
import { FaultRecoveryService } from "../../src/application/recovery/fault-recovery";
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

const outboundCommand: CreateOutboundOrder = {
  idempotencyKey: "integration-outbound-0001",
  actorId: "integration-test",
  externalReference: "SO-INTEGRATION-0001",
  sku: command.load.sku,
  quantity: 10,
  destinationLocationId: "20000000-0000-4000-8000-000000000003",
};

const outboundIdentifiers: OutboundIdentifiers = {
  outboundOrderId: "a0000000-0000-4000-8000-000000000001",
  outboxEventId: "a0000000-0000-4000-8000-000000000002",
  auditEventId: "a0000000-0000-4000-8000-000000000003",
};

function requestHash(value: unknown): string {
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
      `TRUNCATE route_plan_edges, route_plans, audit_events, outbox_events, alarms,
        inventory_allocations, transport_tasks, outbound_orders, inventory_units,
        loads, inbound_receipts`,
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
      confirmationReason: "Verified integration inbound execution.",
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
      confirmation_reason: string;
    }>(
      `SELECT t.status AS task_status, l.status AS load_status,
        r.status AS receipt_status, i.location_id,
        (SELECT count(*) FROM inventory_units) AS inventory_count,
        (SELECT count(*) FROM outbox_events) AS outbox_count,
        (SELECT count(*) FROM outbox_events WHERE published_at IS NOT NULL) AS published_count,
        (SELECT count(*) FROM audit_events) AS audit_count,
        (SELECT details ->> 'confirmationReason' FROM audit_events
          WHERE action = 'transport_task.complete') AS confirmation_reason
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
      confirmation_reason: "Verified integration inbound execution.",
    });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "idle",
      nodeId: "STORAGE-A-01",
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
      alarms: [],
      equipment: [
        {
          equipmentId: "AMR-01",
          adapterKey: "simulator.mobile-transport",
          active: true,
          telemetry: {
            status: "idle",
            topologyId: "90000000-0000-4000-8000-000000000001",
            topologyRevision: 1,
            nodeId: "RECEIVING-01",
            connectionStatus: "connected",
            quality: "good",
            freshness: "current",
            sequence: 0,
            source: "deterministic-demo-seed",
          },
        },
      ],
      topology: {
        topologyId: "90000000-0000-4000-8000-000000000001",
        revision: 1,
        nodes: [
          {
            nodeId: "RECEIVING-01",
            kind: "transfer",
            position: { coordinateSystem: "demo", x: 0, y: 0 },
          },
          { nodeId: "SHIPPING-01", kind: "shipping" },
          { nodeId: "STORAGE-A-01", kind: "storage" },
        ],
        edges: [
          {
            edgeId: "RECEIVING-TO-STORAGE",
            fromNodeId: "RECEIVING-01",
            toNodeId: "STORAGE-A-01",
          },
          {
            edgeId: "SHIPPING-TO-STORAGE",
            fromNodeId: "SHIPPING-01",
            toNodeId: "STORAGE-A-01",
          },
          {
            edgeId: "STORAGE-TO-RECEIVING",
            fromNodeId: "STORAGE-A-01",
            toNodeId: "RECEIVING-01",
          },
          {
            edgeId: "STORAGE-TO-SHIPPING",
            fromNodeId: "STORAGE-A-01",
            toNodeId: "SHIPPING-01",
          },
        ],
      },
    });
    expect(details.equipment[0]?.telemetry?.ageMs).toBeGreaterThanOrEqual(0);
    expect(
      Number.isNaN(
        Date.parse(details.equipment[0]?.telemetry?.observedAt ?? ""),
      ),
    ).toBe(false);
  });

  it("persists only monotonic equipment observations and rejects older evidence", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const sink = new PgEquipmentObservationSink(pool);
    const observation = {
      equipmentId: "AMR-01",
      topologyId: "90000000-0000-4000-8000-000000000001",
      topologyRevision: 1,
      nodeId: "STORAGE-A-01",
      status: "idle" as const,
      taskId: null,
      loadId: null,
      faultCode: null,
      connectionStatus: "connected" as const,
      quality: "good" as const,
      sequence: 10,
      observedAt: new Date("2026-09-19T14:00:00.000Z"),
      source: "integration-simulator",
    };

    await expect(sink.publish(observation)).resolves.toBe("applied");
    await expect(
      sink.publish({
        ...observation,
        nodeId: "RECEIVING-01",
        status: "faulted",
        faultCode: "STALE-EVIDENCE",
        sequence: 9,
      }),
    ).resolves.toBe("ignored");

    const stored = await pool.query<{
      node_id: string;
      status: string;
      fault_code: string | null;
      sequence: string;
    }>(
      `SELECT node_id, status, fault_code, sequence::text
       FROM equipment_observations WHERE equipment_id = 'AMR-01'`,
    );
    expect(stored.rows[0]).toEqual({
      node_id: "STORAGE-A-01",
      status: "idle",
      fault_code: null,
      sequence: "10",
    });

    await pool.query(
      `UPDATE equipment_observations
       SET received_at = now() - interval '1 minute'
       WHERE equipment_id = 'AMR-01'`,
    );
    const stale = await new OperationsSummaryService(pool).getDetails();
    expect(stale.equipment[0]?.telemetry).toMatchObject({
      freshness: "stale",
      connectionStatus: "connected",
      sequence: 10,
    });

    await expect(
      sink.publish({
        ...observation,
        sequence: 11,
        observedAt: new Date(),
      }),
    ).resolves.toBe("applied");
    const refreshed = await new OperationsSummaryService(pool).getDetails();
    expect(refreshed.equipment[0]?.telemetry).toMatchObject({
      freshness: "current",
      sequence: 11,
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

    const activation = new TopologyActivationService(
      new PgTopologyRepository(pool),
    );
    await expect(
      activation.activate("90000000-0000-4000-8000-000000000001", 2),
    ).rejects.toThrow("missing bindings");

    await pool.query(
      `INSERT INTO location_topology_bindings
        (location_id, warehouse_id, topology_id, topology_revision, node_id)
       VALUES
        ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 2, 'A'),
        ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 2, 'B'),
        ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 2, 'B')`,
    );
    const activated = await activation.activate(
      "90000000-0000-4000-8000-000000000001",
      2,
    );
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

  it("atomically allocates outbound inventory and rejects over-allocation", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const inbound = new PgInboundRepository(pool);
    await inbound.create(command, identifiers, requestHash(command));

    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const executionIds = idFactory();
    await new DeterministicInboundExecutor(
      new PgInboundExecutionRepository(pool),
      equipment,
      new ManualClock(1_000),
      executionIds,
    ).execute({
      taskId: identifiers.transportTaskId,
      equipmentId: "AMR-01",
      actorId: command.actorId,
      confirmationReason: "Verified integration inbound execution.",
    });

    const outbound = new PgOutboundRepository(pool);
    const allocated = await outbound.create(
      outboundCommand,
      outboundIdentifiers,
      requestHash(outboundCommand),
    );
    expect(allocated).toMatchObject({
      outboundOrderId: outboundIdentifiers.outboundOrderId,
      status: "allocated",
      duplicate: false,
      allocationIds: [expect.any(String)],
      transportTaskIds: [expect.any(String)],
    });

    const replay = await outbound.create(
      outboundCommand,
      {
        outboundOrderId: "a0000000-0000-4000-8000-000000000011",
        outboxEventId: "a0000000-0000-4000-8000-000000000012",
        auditEventId: "a0000000-0000-4000-8000-000000000013",
      },
      requestHash(outboundCommand),
    );
    expect(replay).toEqual({ ...allocated, duplicate: true });

    const unavailable = {
      ...outboundCommand,
      idempotencyKey: "integration-outbound-0002",
      externalReference: "SO-INTEGRATION-0002",
      quantity: 15,
    };
    await expect(
      outbound.create(
        unavailable,
        {
          outboundOrderId: "a0000000-0000-4000-8000-000000000021",
          outboxEventId: "a0000000-0000-4000-8000-000000000022",
          auditEventId: "a0000000-0000-4000-8000-000000000023",
        },
        requestHash(unavailable),
      ),
    ).rejects.toBeInstanceOf(InsufficientInventoryError);

    const state = await pool.query<{
      order_count: string;
      allocation_quantity: string;
      task_count: string;
      outbound_event_count: string;
      outbound_audit_count: string;
    }>(
      `SELECT
        (SELECT count(*) FROM outbound_orders) AS order_count,
        (SELECT sum(quantity) FROM inventory_allocations WHERE status = 'reserved') AS allocation_quantity,
        (SELECT count(*) FROM transport_tasks WHERE outbound_order_id IS NOT NULL) AS task_count,
        (SELECT count(*) FROM outbox_events WHERE aggregate_type = 'OutboundOrder') AS outbound_event_count,
        (SELECT count(*) FROM audit_events WHERE aggregate_type = 'OutboundOrder') AS outbound_audit_count`,
    );
    expect(state.rows[0]).toEqual({
      order_count: "1",
      allocation_quantity: "10",
      task_count: "1",
      outbound_event_count: "1",
      outbound_audit_count: "1",
    });

    await expect(
      new PgInboundExecutionRepository(pool).getTask(
        allocated.transportTaskIds[0]!,
      ),
    ).resolves.toBeNull();

    await new DeterministicOutboundExecutor(
      new PgOutboundExecutionRepository(pool),
      equipment,
      new ManualClock(10_000),
      executionIds,
    ).execute({
      taskId: allocated.transportTaskIds[0]!,
      equipmentId: "AMR-01",
      actorId: outboundCommand.actorId,
      confirmationReason: "Verified integration outbound execution.",
    });

    const shipped = await pool.query<{
      order_status: string;
      task_status: string;
      allocation_status: string;
      remaining_quantity: number;
      inventory_status: string;
    }>(
      `SELECT outbound.status AS order_status, task.status AS task_status,
        allocation.status AS allocation_status,
        inventory.quantity AS remaining_quantity, inventory.status AS inventory_status
       FROM outbound_orders outbound
       JOIN inventory_allocations allocation ON allocation.outbound_order_id = outbound.id
       JOIN transport_tasks task ON task.inventory_allocation_id = allocation.id
       JOIN inventory_units inventory ON inventory.id = allocation.inventory_unit_id
       WHERE outbound.id = $1`,
      [outboundIdentifiers.outboundOrderId],
    );
    expect(shipped.rows[0]).toEqual({
      order_status: "completed",
      task_status: "completed",
      allocation_status: "consumed",
      remaining_quantity: 14,
      inventory_status: "available",
    });
    const outboundAudit = await pool.query<{
      actor_id: string;
      confirmation_reason: string;
    }>(
      `SELECT actor_id, details ->> 'confirmationReason' AS confirmation_reason
       FROM audit_events
       WHERE aggregate_id = $1 AND action = 'transport_task.complete'`,
      [allocated.transportTaskIds[0]],
    );
    expect(outboundAudit.rows[0]).toEqual({
      actor_id: outboundCommand.actorId,
      confirmation_reason: "Verified integration outbound execution.",
    });

    const concurrentCommands: CreateOutboundOrder[] = [1, 2].map(
      (sequence) => ({
        ...outboundCommand,
        idempotencyKey: `integration-outbound-concurrent-${sequence}`,
        externalReference: `SO-INTEGRATION-CONCURRENT-${sequence}`,
        quantity: 8,
      }),
    );
    const concurrentResults = await Promise.allSettled(
      concurrentCommands.map((concurrentCommand, index) =>
        outbound.create(
          concurrentCommand,
          {
            outboundOrderId: `b0000000-0000-4000-8000-${String(
              index + 1,
            ).padStart(12, "0")}`,
            outboxEventId: `b0000000-0000-4000-8001-${String(
              index + 1,
            ).padStart(12, "0")}`,
            auditEventId: `b0000000-0000-4000-8002-${String(index + 1).padStart(
              12,
              "0",
            )}`,
          },
          requestHash(concurrentCommand),
        ),
      ),
    );
    expect(
      concurrentResults.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = concurrentResults.find(
      (result) => result.status === "rejected",
    );
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: expect.any(InsufficientInventoryError),
    });

    const concurrencyState = await pool.query<{
      order_count: string;
      reserved_quantity: string;
    }>(
      `SELECT
        (SELECT count(*) FROM outbound_orders) AS order_count,
        (SELECT sum(quantity) FROM inventory_allocations WHERE status = 'reserved') AS reserved_quantity`,
    );
    expect(concurrencyState.rows[0]).toEqual({
      order_count: "2",
      reserved_quantity: "8",
    });
  });

  it("persists fault acknowledgement and release-for-reassignment atomically", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );

    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    await equipment.dispatch({
      commandId: "90000000-0000-4000-8000-000000000011",
      equipmentId: "AMR-01",
      command: { type: "assign_task", taskId: identifiers.transportTaskId },
    });
    await equipment.dispatch({
      commandId: "90000000-0000-4000-8000-000000000012",
      equipmentId: "AMR-01",
      command: { type: "start_pickup" },
    });

    const execution = new PgInboundExecutionRepository(pool);
    const assigned = await execution.markAssigned(
      identifiers.transportTaskId,
      "AMR-01",
      0,
      "integration-test",
      {
        outboxEventId: "90000000-0000-4000-8000-000000000013",
        auditEventId: "90000000-0000-4000-8000-000000000014",
      },
    );
    await execution.markInProgress(
      identifiers.transportTaskId,
      assigned.version,
      "integration-test",
      {
        outboxEventId: "90000000-0000-4000-8000-000000000015",
        auditEventId: "90000000-0000-4000-8000-000000000016",
      },
    );

    const recovery = new FaultRecoveryService(
      new PgFaultRecoveryRepository(pool),
      equipment,
      new ManualClock(20_000),
      idFactory(),
    );
    const alarm = await recovery.injectFault({
      taskId: identifiers.transportTaskId,
      faultCode: "DRIVE_BLOCKED",
      severity: "critical",
      message: "Travel path is blocked.",
      actorId: "integration-operator",
      confirmationReason: "Integration fault-recovery drill.",
    });
    expect(alarm).toMatchObject({
      taskId: identifiers.transportTaskId,
      equipmentId: "AMR-01",
      status: "active",
      previousTaskStatus: "in_progress",
    });

    await recovery.acknowledge({
      alarmId: alarm.alarmId,
      actorId: "integration-operator",
    });
    const released = await recovery.recover({
      alarmId: alarm.alarmId,
      strategy: "release",
      resolution: "Vehicle isolated; task returned for reassignment.",
      actorId: "integration-supervisor",
      confirmationReason: "Release approved after vehicle isolation.",
    });
    expect(released).toMatchObject({
      status: "queued",
      equipmentId: null,
      blockingAlarmId: null,
    });

    const state = await pool.query<{
      task_status: string;
      equipment_id: string | null;
      blocking_alarm_id: string | null;
      alarm_status: string;
      acknowledged_by: string;
      cleared_by: string;
      resolution: string;
      recovery_events: string;
      recovery_audits: string;
      fault_confirmation: string;
      recovery_confirmation: string;
    }>(
      `SELECT task.status AS task_status, task.equipment_id, task.blocking_alarm_id,
        alarm.status AS alarm_status, alarm.acknowledged_by, alarm.cleared_by,
        alarm.resolution,
        (SELECT count(*) FROM outbox_events WHERE event_type IN
          ('TransportTaskBlockedByFault', 'AlarmAcknowledged', 'TransportTaskReleasedForReassignment')) AS recovery_events,
        (SELECT count(*) FROM audit_events WHERE action IN
          ('transport_task.block_for_fault', 'alarm.acknowledge', 'transport_task.recover_release')) AS recovery_audits,
        (SELECT details ->> 'confirmationReason' FROM audit_events
          WHERE action = 'transport_task.block_for_fault') AS fault_confirmation,
        (SELECT details ->> 'confirmationReason' FROM audit_events
          WHERE action = 'transport_task.recover_release') AS recovery_confirmation
       FROM transport_tasks task
       JOIN alarms alarm ON alarm.transport_task_id = task.id
       WHERE task.id = $1`,
      [identifiers.transportTaskId],
    );
    expect(state.rows[0]).toEqual({
      task_status: "queued",
      equipment_id: null,
      blocking_alarm_id: null,
      alarm_status: "cleared",
      acknowledged_by: "integration-operator",
      cleared_by: "integration-supervisor",
      resolution: "Vehicle isolated; task returned for reassignment.",
      recovery_events: "3",
      recovery_audits: "3",
      fault_confirmation: "Integration fault-recovery drill.",
      recovery_confirmation: "Release approved after vehicle isolation.",
    });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "idle",
      taskId: null,
    });
  });
});
