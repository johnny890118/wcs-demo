import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgInboundExecutionRepository } from "../../apps/api/src/execution/pg-inbound-execution.repository";
import { AuditProjectionService } from "../../apps/api/src/audit/audit-projection.service";
import { AccessContextService } from "../../apps/api/src/access-context/access-context.service";
import { HumanAccessAssignmentService } from "../../apps/api/src/access-context/human-access-assignment.service";
import { HumanLoginProtectionService } from "../../apps/api/src/access-context/human-login-protection.service";
import { requestContext } from "../../apps/api/src/logging/request-context";
import { PgFaultRecoveryRepository } from "../../apps/api/src/execution/pg-fault-recovery.repository";
import { PgOutboundExecutionRepository } from "../../apps/api/src/execution/pg-outbound-execution.repository";
import { PgEquipmentObservationSink } from "../../apps/api/src/execution/pg-equipment-observation.sink";
import { IdempotencyConflictError } from "../../apps/api/src/inbound/inbound.errors";
import { PgInboundRepository } from "../../apps/api/src/inbound/pg-inbound.repository";
import { PgOutboxRepository } from "../../apps/api/src/outbox/pg-outbox.repository";
import { OperationsSummaryService } from "../../apps/api/src/operations/operations-summary.service";
import { TaskProjectionService } from "../../apps/api/src/operations/task-projection.service";
import { InventoryProjectionService } from "../../apps/api/src/operations/inventory-projection.service";
import { LoadProjectionService } from "../../apps/api/src/operations/load-projection.service";
import { LocationProjectionService } from "../../apps/api/src/operations/location-projection.service";
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
  actorType: "anonymous_demo",
  warehouseId: "10000000-0000-4000-8000-000000000001",
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
  actorType: "user",
  warehouseId: "10000000-0000-4000-8000-000000000001",
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

const warehouseId = "10000000-0000-4000-8000-000000000001";
const otherWarehouseId = "10000000-0000-4000-8000-000000000099";

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
      `TRUNCATE authentication_security_events, human_login_throttles,
        human_access_sessions, route_plan_edges, route_plans, audit_events, outbox_events, alarms,
        inventory_allocations, transport_tasks, outbound_orders, inventory_units,
        loads, inbound_receipts`,
    );
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("denies direct platform table access to granted non-owner roles", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const tables = await client.query<{ table_name: string }>(
        `SELECT class.relname AS table_name
         FROM pg_class class
         JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
         WHERE namespace.nspname = 'public'
           AND class.relkind = 'r'
           AND class.relrowsecurity = false
         ORDER BY class.relname`,
      );
      expect(tables.rows).toEqual([]);

      await client.query("CREATE ROLE swp_data_api_probe NOLOGIN");
      await client.query("GRANT USAGE ON SCHEMA public TO swp_data_api_probe");
      await client.query(
        "GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO swp_data_api_probe",
      );
      await client.query("SET LOCAL ROLE swp_data_api_probe");
      await expect(
        client.query<{ count: string }>("SELECT count(*) FROM warehouses"),
      ).resolves.toMatchObject({ rows: [{ count: "0" }] });
      await expect(
        client.query(
          `INSERT INTO warehouses (id, code, name)
           VALUES ('10000000-0000-4000-8000-000000000098', 'PROBE', 'Probe')`,
        ),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });

  it("backfills stable correlation when upgrading an existing audit table", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE SCHEMA audit_migration_upgrade");
      await client.query("SET LOCAL search_path TO audit_migration_upgrade");
      await client.query(`CREATE TABLE audit_events (
        id uuid PRIMARY KEY,
        occurred_at timestamptz NOT NULL DEFAULT now()
      )`);
      await client.query("INSERT INTO audit_events (id) VALUES ($1), ($2)", [
        "71000000-0000-4000-8000-000000000001",
        "71000000-0000-4000-8000-000000000002",
      ]);
      const migration = await readFile(
        resolve("apps/api/migrations/0009_audit_correlation.sql"),
        "utf8",
      );
      await client.query(migration);
      const upgraded = await client.query<{
        id: string;
        correlation_id: string;
      }>("SELECT id, correlation_id FROM audit_events ORDER BY id");
      expect(upgraded.rows).toEqual([
        {
          id: "71000000-0000-4000-8000-000000000001",
          correlation_id: "legacy:71000000-0000-4000-8000-000000000001",
        },
        {
          id: "71000000-0000-4000-8000-000000000002",
          correlation_id: "legacy:71000000-0000-4000-8000-000000000002",
        },
      ]);
      await expect(
        client.query(
          "INSERT INTO audit_events (id, correlation_id) VALUES ($1, NULL)",
          ["71000000-0000-4000-8000-000000000003"],
        ),
      ).rejects.toMatchObject({ code: "23502" });
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
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
    await expect(
      pool.query<{ actor_type: string }>(
        "SELECT actor_type FROM audit_events WHERE id = $1",
        [identifiers.auditEventId],
      ),
    ).resolves.toMatchObject({ rows: [{ actor_type: "anonymous_demo" }] });

    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const executor = new DeterministicInboundExecutor(
      new PgInboundExecutionRepository(pool),
      equipment,
      new ManualClock(1_000),
      idFactory(),
    );
    await requestContext.run(
      { requestId: "request:integration-execute-001" },
      () =>
        executor.execute({
          taskId: identifiers.transportTaskId,
          equipmentId: "AMR-01",
          actorId: command.actorId,
          actorType: "user",
          warehouseId,
          confirmationReason: "Verified integration inbound execution.",
        }),
    );

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

    const audit = new AuditProjectionService(pool);
    const firstAuditPage = await audit.list(warehouseId, {
      resourceType: "TransportTask",
      resourceId: identifiers.transportTaskId,
      limit: 2,
    });
    expect(firstAuditPage.events).toHaveLength(2);
    expect(firstAuditPage.nextCursor).not.toBeNull();
    expect(firstAuditPage.events[0]).toMatchObject({
      actor: { type: "user", id: command.actorId },
      action: "transport_task.complete",
      knownAction: true,
      resource: { type: "TransportTask", id: identifiers.transportTaskId },
      evidence: {
        receiptId: identifiers.receiptId,
        loadId: identifiers.loadId,
      },
    });
    expect(firstAuditPage.events[0].correlationId).toBe(
      "request:integration-execute-001",
    );
    expect(
      firstAuditPage.events.every(
        (event) => event.correlationId === "request:integration-execute-001",
      ),
    ).toBe(true);
    expect(JSON.stringify(firstAuditPage)).not.toContain(
      "Verified integration inbound execution.",
    );
    const secondAuditPage = await audit.list(warehouseId, {
      resourceType: "TransportTask",
      resourceId: identifiers.transportTaskId,
      cursor: firstAuditPage.nextCursor!,
      limit: 2,
    });
    expect(secondAuditPage.events).toHaveLength(1);
    expect(secondAuditPage.events[0]?.correlationId).toBe(
      "request:integration-execute-001",
    );
    expect(secondAuditPage.nextCursor).toBeNull();
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

  it("keeps command idempotency, task lookup, equipment, and audit evidence warehouse-scoped", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await pool.query(
      `INSERT INTO warehouses (id, code, name)
       VALUES ($1, 'OTHER', 'Other Warehouse')
       ON CONFLICT (id) DO NOTHING`,
      [otherWarehouseId],
    );
    await pool.query(
      `INSERT INTO locations (id, warehouse_id, code, kind, capabilities)
       VALUES
         ('20000000-0000-4000-8000-000000000091', $1, 'OTHER-RECEIVING', 'receiving', ARRAY['load.pickup']),
         ('20000000-0000-4000-8000-000000000092', $1, 'OTHER-STORAGE', 'storage', ARRAY['load.dropoff', 'inventory.store'])
       ON CONFLICT (id) DO NOTHING`,
      [otherWarehouseId],
    );

    const repository = new PgInboundRepository(pool);
    await repository.create(command, identifiers, requestHash(command));
    const otherCommand: CreateInboundReceipt = {
      ...command,
      warehouseId: otherWarehouseId,
      externalReference: "ASN-OTHER-0001",
      load: { ...command.load, externalId: "PALLET-OTHER-0001" },
      sourceLocationId: "20000000-0000-4000-8000-000000000091",
      destinationLocationId: "20000000-0000-4000-8000-000000000092",
    };
    const otherIdentifiers: InboundIdentifiers = {
      receiptId: "30000000-0000-4000-8000-000000000091",
      loadId: "40000000-0000-4000-8000-000000000091",
      transportTaskId: "50000000-0000-4000-8000-000000000091",
      outboxEventId: "60000000-0000-4000-8000-000000000091",
      auditEventId: "70000000-0000-4000-8000-000000000091",
    };

    await expect(
      repository.create(
        otherCommand,
        otherIdentifiers,
        requestHash(otherCommand),
      ),
    ).resolves.toMatchObject({
      receiptId: otherIdentifiers.receiptId,
      duplicate: false,
    });

    const execution = new PgInboundExecutionRepository(pool);
    await expect(
      execution.getTask(identifiers.transportTaskId, otherWarehouseId),
    ).resolves.toBeNull();
    await expect(
      execution.isEquipmentAvailableInWarehouse("AMR-01", otherWarehouseId),
    ).resolves.toBe(false);

    const audit = new AuditProjectionService(pool);
    const primaryAudit = await audit.list(warehouseId, { limit: 20 });
    const otherAudit = await audit.list(otherWarehouseId, { limit: 20 });
    expect(primaryAudit.events.map((event) => event.resource.id)).toEqual([
      identifiers.receiptId,
    ]);
    expect(otherAudit.events.map((event) => event.resource.id)).toEqual([
      otherIdentifiers.receiptId,
    ]);
  });

  it("atomically persists warehouse-local evidence for a context transition", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await pool.query(
      `INSERT INTO warehouses (id, code, name)
       VALUES ($1, 'OTHER', 'Other Warehouse')
       ON CONFLICT (id) DO NOTHING`,
      [otherWarehouseId],
    );
    const service = new AccessContextService(pool);
    await expect(
      requestContext.run({ requestId: "request:warehouse-context-001" }, () =>
        service.changeWarehouse(
          {
            principalKind: "human",
            principal: "integration-operator",
            permissions: ["operations.view"],
            warehouseScopes: [warehouseId, otherWarehouseId],
            currentWarehouseId: warehouseId,
          },
          otherWarehouseId,
        ),
      ),
    ).resolves.toEqual({ currentWarehouseId: otherWarehouseId });

    const persisted = await pool.query<{
      warehouse_id: string;
      actor_type: string;
      actor_id: string;
      action: string;
      aggregate_id: string;
      details: Record<string, unknown>;
      correlation_id: string;
    }>(
      `SELECT warehouse_id, actor_type, actor_id, action, aggregate_id, details,
        correlation_id
       FROM audit_events
       ORDER BY action`,
    );
    expect(persisted.rows).toEqual([
      {
        warehouse_id: otherWarehouseId,
        actor_type: "user",
        actor_id: "integration-operator",
        action: "access_context.warehouse_entered",
        aggregate_id: otherWarehouseId,
        details: {},
        correlation_id: "request:warehouse-context-001",
      },
      {
        warehouse_id: warehouseId,
        actor_type: "user",
        actor_id: "integration-operator",
        action: "access_context.warehouse_left",
        aggregate_id: warehouseId,
        details: {},
        correlation_id: "request:warehouse-context-001",
      },
    ]);

    const audit = new AuditProjectionService(pool);
    await expect(audit.list(warehouseId, { limit: 10 })).resolves.toMatchObject(
      {
        events: [
          {
            action: "access_context.warehouse_left",
            knownAction: true,
            knownResource: true,
            evidence: {},
          },
        ],
      },
    );
    await expect(
      audit.list(otherWarehouseId, { limit: 10 }),
    ).resolves.toMatchObject({
      events: [
        {
          action: "access_context.warehouse_entered",
          knownAction: true,
          knownResource: true,
          evidence: {},
        },
      ],
    });
  });

  it("issues, validates, and revokes a persisted human session with evidence", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const service = new HumanAccessAssignmentService(pool);

    await expect(
      requestContext.run({ requestId: "request:login-integration-001" }, () =>
        service.issue("demo-credentials", "legacy-demo-admin"),
      ),
    ).resolves.toMatchObject({
      access: {
        principal: {
          kind: "human",
          subject: "legacy-demo-admin",
          identityProvider: "demo-credentials",
          permissions: expect.arrayContaining([
            "operations.view",
            "audit.view",
            "inbound.create",
          ]),
          warehouseScopes: [
            expect.objectContaining({
              warehouseId,
              code: "DEMO",
              permissions: expect.arrayContaining(["operations.view"]),
            }),
          ],
        },
        currentWarehouseId: warehouseId,
      },
      session: {
        sessionId: expect.any(String),
        expiresAt: expect.any(String),
      },
    });

    const evidence = await pool.query(
      `SELECT warehouse_id, actor_type, actor_id, action, aggregate_type,
        aggregate_id,
        details, correlation_id
       FROM audit_events
       WHERE action = 'access.login_succeeded'`,
    );
    expect(evidence.rows).toEqual([
      {
        warehouse_id: warehouseId,
        actor_type: "user",
        actor_id: "legacy-demo-admin",
        action: "access.login_succeeded",
        aggregate_type: "Session",
        aggregate_id: expect.any(String),
        details: {},
        correlation_id: "request:login-integration-001",
      },
    ]);

    const active = await pool.query<{
      id: string;
      current_warehouse_id: string;
    }>(
      `SELECT id, current_warehouse_id
       FROM human_access_sessions
       WHERE revoked_at IS NULL`,
    );
    const issuedSessionId = active.rows[0].id;
    await expect(
      service.validate(
        issuedSessionId,
        "demo-credentials",
        "legacy-demo-admin",
        warehouseId,
      ),
    ).resolves.toMatchObject({ access: { currentWarehouseId: warehouseId } });
    await expect(
      service.revoke(issuedSessionId, "administrative", "integration-admin"),
    ).resolves.toEqual({ revoked: true });
    await expect(
      service.validate(
        issuedSessionId,
        "demo-credentials",
        "legacy-demo-admin",
        warehouseId,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it.each(["principal", "assignment"])(
    "fails persisted validation after %s access is withdrawn",
    async (kind) => {
      if (!pool) throw new Error("Integration pool was not configured.");
      const service = new HumanAccessAssignmentService(pool);
      const issued = await service.issue(
        "demo-credentials",
        "legacy-demo-admin",
      );
      const table =
        kind === "principal"
          ? "access_principals"
          : "warehouse_access_assignments";
      const status = kind === "principal" ? "disabled" : "revoked";
      const predicate =
        kind === "principal"
          ? "subject = 'legacy-demo-admin'"
          : `warehouse_id = '${warehouseId}'`;
      try {
        await pool.query(`UPDATE ${table} SET status = $1 WHERE ${predicate}`, [
          status,
        ]);
        await expect(
          service.validate(
            issued.session.sessionId,
            "demo-credentials",
            "legacy-demo-admin",
            warehouseId,
          ),
        ).rejects.toMatchObject({ status: 401 });
      } finally {
        await pool.query(
          `UPDATE ${table} SET status = 'active' WHERE ${predicate}`,
        );
      }
    },
  );

  it("refreshes persisted permissions without extending session expiry", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const service = new HumanAccessAssignmentService(pool);
    const issued = await service.issue("demo-credentials", "legacy-demo-admin");
    const original = await pool.query<{ permissions: string[] }>(
      "SELECT permissions FROM warehouse_access_assignments WHERE warehouse_id = $1",
      [warehouseId],
    );
    try {
      await pool.query(
        "UPDATE warehouse_access_assignments SET permissions = ARRAY['operations.view']::text[] WHERE warehouse_id = $1",
        [warehouseId],
      );
      const validated = await service.validate(
        issued.session.sessionId,
        "demo-credentials",
        "legacy-demo-admin",
        warehouseId,
      );
      expect(validated.access.principal.permissions).toEqual([
        "operations.view",
      ]);
      expect(validated.session.expiresAt).toBe(issued.session.expiresAt);
    } finally {
      await pool.query(
        "UPDATE warehouse_access_assignments SET permissions = $2::text[] WHERE warehouse_id = $1",
        [warehouseId, original.rows[0].permissions],
      );
    }
  });

  it("rejects an expired persisted human session", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    const service = new HumanAccessAssignmentService(pool);
    const issued = await service.issue("demo-credentials", "legacy-demo-admin");
    await pool.query(
      "UPDATE human_access_sessions SET issued_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE id = $1",
      [issued.session.sessionId],
    );
    await expect(
      service.validate(
        issued.session.sessionId,
        "demo-credentials",
        "legacy-demo-admin",
        warehouseId,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("persists shared failed-login evidence and throttle state", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    process.env.HUMAN_LOGIN_FAILURE_LIMIT = "3";
    process.env.HUMAN_LOGIN_THROTTLE_SECONDS = "120";
    const service = new HumanLoginProtectionService(pool);
    const fingerprint = "b".repeat(64);

    try {
      await expect(
        requestContext.run({ requestId: "request:failed-login-001" }, () =>
          service.evaluate("demo-credentials", fingerprint, false),
        ),
      ).resolves.toEqual({ allowed: false, retryAfterSeconds: null });
      await service.evaluate("demo-credentials", fingerprint, false);
      await expect(
        service.evaluate("demo-credentials", fingerprint, false),
      ).resolves.toEqual({ allowed: false, retryAfterSeconds: 120 });
      await expect(
        service.evaluate("demo-credentials", fingerprint, true),
      ).resolves.toMatchObject({ allowed: false });

      const state = await pool.query(
        `SELECT failure_count, blocked_until IS NOT NULL AS blocked
         FROM human_login_throttles
         WHERE identity_provider = 'demo-credentials'
           AND identifier_fingerprint = $1`,
        [fingerprint],
      );
      const evidence = await pool.query(
        `SELECT outcome, count(*)::integer AS count
         FROM authentication_security_events
         GROUP BY outcome
         ORDER BY outcome`,
      );
      const correlated = await pool.query(
        `SELECT correlation_id
         FROM authentication_security_events
         WHERE correlation_id = 'request:failed-login-001'`,
      );
      expect(state.rows).toEqual([{ failure_count: 3, blocked: true }]);
      expect(evidence.rows).toEqual([
        { outcome: "failed", count: 3 },
        { outcome: "throttled", count: 1 },
      ]);
      expect(correlated.rows).toEqual([
        { correlation_id: "request:failed-login-001" },
      ]);
    } finally {
      delete process.env.HUMAN_LOGIN_FAILURE_LIMIT;
      delete process.env.HUMAN_LOGIN_THROTTLE_SECONDS;
    }
  });

  it("returns data-backed operations projections without inferring missing state", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await pool.query(
      `INSERT INTO warehouses (id, code, name)
       VALUES ('10000000-0000-4000-8000-000000000099', 'OTHER', 'Other Warehouse')
       ON CONFLICT (id) DO NOTHING`,
    );
    await pool.query(
      `INSERT INTO equipment_descriptors
        (equipment_id, warehouse_id, adapter_key, capabilities,
         supported_commands, constraints)
       VALUES (
         'OTHER-AMR',
         '10000000-0000-4000-8000-000000000099',
         'test.other',
         ARRAY['transport.move'],
         ARRAY['assign_task'],
         '{}'::jsonb
       )
       ON CONFLICT (equipment_id) DO NOTHING`,
    );
    const summary = await new OperationsSummaryService(pool).getSummary(
      warehouseId,
    );

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

    const details = await new OperationsSummaryService(pool).getDetails(
      warehouseId,
    );
    const liveView = await new OperationsSummaryService(pool).getLiveView(
      warehouseId,
    );
    expect(liveView.equipment.map((item) => item.equipmentId)).not.toContain(
      "OTHER-AMR",
    );
    expect(liveView.equipment[0].position).toMatchObject({
      state: "current",
      locations: ["RECEIVING-01"],
      reason: "observed",
    });
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
    expect(details.equipment.map((item) => item.equipmentId)).not.toContain(
      "OTHER-AMR",
    );
    const home = await new OperationsSummaryService(pool).getHome(warehouseId);
    const overview = await new OperationsSummaryService(pool).getOverview(
      warehouseId,
    );
    expect(overview.home?.work).toEqual(home.work);
    expect(overview.home?.attention).toEqual(home.attention);
    expect(overview.summary).not.toBeNull();
    expect(
      (await new OperationsSummaryService(pool).getOverview(otherWarehouseId))
        .home?.work,
    ).toEqual([]);
    expect(home.work).toEqual([]);
    expect(home.attention).toEqual([]);
    expect(home.inventory.visibleUnits).toBe(0);
    expect(home.coverage.tasksMayBeLimited).toBe(false);
    expect(details.equipment[0]?.telemetry?.ageMs).toBeGreaterThanOrEqual(0);
    expect(
      Number.isNaN(
        Date.parse(details.equipment[0]?.telemetry?.observedAt ?? ""),
      ),
    ).toBe(false);
  });

  it("scopes summary and alarm endpoints plus stock receipt/load lineage", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    await pool.query(
      "INSERT INTO warehouses (id,code,name) VALUES ($1,'OTHER','Other Warehouse') ON CONFLICT DO NOTHING",
      [otherWarehouseId],
    );
    const foreignLocation = "21000000-0000-4000-8000-000000000099";
    await pool.query(
      "INSERT INTO locations (id,warehouse_id,code,kind,capabilities) VALUES ($1,$2,'FOREIGN','storage',ARRAY['inventory.store']) ON CONFLICT DO NOTHING",
      [foreignLocation, otherWarehouseId],
    );
    await pool.query(
      "UPDATE transport_tasks SET status='blocked' WHERE id=$1",
      [identifiers.transportTaskId],
    );
    await pool.query(
      "INSERT INTO inventory_units (id,load_id,sku,quantity,location_id,status) VALUES ('81000000-0000-4000-8000-000000000001',$1,'SCOPED-STOCK',24,$2,'available')",
      [identifiers.loadId, command.destinationLocationId],
    );
    await pool.query(
      "INSERT INTO alarms (id,transport_task_id,equipment_id,source_id,code,severity,message,status,previous_task_status,raised_at) VALUES ('82000000-0000-4000-8000-000000000001',$1,'AMR-01','test','FAULT','critical','Scope evidence','active','assigned',now())",
      [identifiers.transportTaskId],
    );
    const service = new OperationsSummaryService(pool);
    expect((await service.getSummary(warehouseId)).counts).toMatchObject({
      activeTasks: 1,
      storedInventory: 1,
      openReceipts: 1,
    });
    expect((await service.getDetails(warehouseId)).alarms).toHaveLength(1);
    await pool.query(
      "UPDATE transport_tasks SET destination_location_id=$1 WHERE id=$2",
      [foreignLocation, identifiers.transportTaskId],
    );
    expect((await service.getSummary(warehouseId)).recentTasks).toEqual([]);
    expect((await service.getSummary(warehouseId)).counts.activeTasks).toBe(0);
    expect((await service.getDetails(warehouseId)).alarms).toEqual([]);
    expect((await service.getSummary(otherWarehouseId)).recentTasks).toEqual(
      [],
    );
    expect((await service.getDetails(otherWarehouseId)).alarms).toEqual([]);
    expect(
      (await service.getHome(warehouseId)).attention.some(
        (item) => item.kind === "alarm",
      ),
    ).toBe(false);
    await pool.query(
      "UPDATE inbound_receipts SET warehouse_id=$1 WHERE id=$2",
      [otherWarehouseId, identifiers.receiptId],
    );
    expect((await service.getSummary(warehouseId)).counts).toMatchObject({
      storedInventory: 0,
      openReceipts: 0,
    });
    expect((await service.getDetails(warehouseId)).inventory).toEqual([]);
    await pool.query(
      "UPDATE inbound_receipts SET warehouse_id=$1 WHERE id=$2",
      [warehouseId, identifiers.receiptId],
    );
    await pool.query("UPDATE loads SET current_location_id=$1 WHERE id=$2", [
      foreignLocation,
      identifiers.loadId,
    ]);
    expect((await service.getSummary(warehouseId)).counts.storedInventory).toBe(
      0,
    );
    expect((await service.getDetails(warehouseId)).inventory).toEqual([]);
  });

  it("keeps older unresolved alarm evidence ahead of recent cleared history", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    const openId = "82000000-0000-4000-8000-000000000001";
    await pool.query(
      "INSERT INTO alarms (id,transport_task_id,equipment_id,source_id,code,severity,message,status,previous_task_status,raised_at) VALUES ($1,$2,'AMR-01','test','OLD-OPEN','critical','Unresolved evidence','active','assigned','2020-01-01')",
      [openId, identifiers.transportTaskId],
    );
    await pool.query(
      `INSERT INTO alarms (id,transport_task_id,equipment_id,source_id,code,severity,message,status,previous_task_status,raised_at,acknowledged_at,acknowledged_by,cleared_at,cleared_by,resolution)
      SELECT ('83000000-0000-4000-8000-'||lpad(sequence::text,12,'0'))::uuid,$1,'AMR-01','test','CLEARED','info','Historical evidence','cleared','assigned',now(),now(),'test',now(),'test','Resolved' FROM generate_series(1,101) AS sequence`,
      [identifiers.transportTaskId],
    );
    const service = new OperationsSummaryService(pool);
    const details = await service.getDetails(warehouseId);
    expect(details.alarms).toHaveLength(100);
    expect(details.alarms[0]).toMatchObject({
      alarmId: openId,
      status: "active",
    });
    await pool.query(
      "UPDATE alarms SET status='acknowledged', acknowledged_at=now(), acknowledged_by='test' WHERE id=$1",
      [openId],
    );
    expect((await service.getDetails(warehouseId)).alarms[0]).toMatchObject({
      alarmId: openId,
      status: "acknowledged",
    });
    expect(
      (await service.getHome(warehouseId)).attention.some(
        (item) => item.kind === "alarm" && item.reason === "acknowledged_alarm",
      ),
    ).toBe(true);
  });

  it("keeps older unknown work visible ahead of recent completed history", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    await pool.query(
      "UPDATE transport_tasks SET status = 'unknown', updated_at = '2020-01-01' WHERE id = $1",
      [identifiers.transportTaskId],
    );
    await pool.query(
      `INSERT INTO transport_tasks
      (id, receipt_id, load_id, source_location_id, destination_location_id, status)
      SELECT ('51000000-0000-4000-8000-' || lpad(sequence::text, 12, '0'))::uuid,
        receipt_id, load_id, source_location_id, destination_location_id, 'completed'
      FROM transport_tasks CROSS JOIN generate_series(1, 101) AS sequence
      WHERE id = $1`,
      [identifiers.transportTaskId],
    );
    const service = new OperationsSummaryService(pool);
    expect((await service.getDetails(warehouseId)).tasks).toHaveLength(100);
    const home = await service.getHome(warehouseId);
    expect(home.work).toHaveLength(1);
    expect(home.work[0]).toMatchObject({
      taskId: identifiers.transportTaskId,
      status: "unknown",
      source: "RECEIVING-01",
      destination: "STORAGE-A-01",
    });
    expect(home.attention.some((item) => item.reason === "unknown_task")).toBe(
      true,
    );
    expect((await service.getHome(otherWarehouseId)).work).toEqual([]);
    expect(
      (await service.getLiveView(warehouseId)).work.map((task) => task.taskId),
    ).toEqual([identifiers.transportTaskId]);
    expect((await service.getLiveView(otherWarehouseId)).work).toEqual([]);
  });

  it("pages task work with exact timestamp ties and scopes detail, load and cursor", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    await pool.query(
      `UPDATE transport_tasks SET created_at = '2026-10-03T00:00:00.000001Z', status = 'unknown' WHERE id = $1`,
      [identifiers.transportTaskId],
    );
    await pool.query(
      `INSERT INTO transport_tasks (id,receipt_id,load_id,source_location_id,destination_location_id,status,created_at)
      SELECT ('51000000-0000-4000-8000-' || lpad(sequence::text,12,'0'))::uuid,
        receipt_id,load_id,source_location_id,destination_location_id,
        CASE WHEN sequence = 1 THEN 'completed' ELSE 'queued' END,'2026-10-03T00:00:00.000001Z'
      FROM transport_tasks CROSS JOIN generate_series(1,2) sequence WHERE id = $1`,
      [identifiers.transportTaskId],
    );
    const service = new TaskProjectionService(pool);
    const first = await service.getQueue(warehouseId, {
      view: "all",
      limit: 1,
    });
    const second = await service.getQueue(warehouseId, {
      view: "all",
      limit: 1,
      cursor: first.nextCursor!,
    });
    const third = await service.getQueue(warehouseId, {
      view: "all",
      limit: 1,
      cursor: second.nextCursor!,
    });
    expect(
      new Set(
        [...first.tasks, ...second.tasks, ...third.tasks].map((t) => t.taskId),
      ).size,
    ).toBe(3);
    expect(third.nextCursor).toBeNull();
    expect(first.tasks[0]?.createdAt).toBe("2026-10-03T00:00:00.000001Z");
    expect((await service.getQueue(warehouseId)).tasks).toHaveLength(2);
    await expect(
      service.getQueue(otherWarehouseId, {
        view: "all",
        cursor: first.nextCursor!,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.getQueue(warehouseId, {
        view: "active",
        cursor: first.nextCursor!,
      }),
    ).rejects.toMatchObject({ status: 400 });
    const detail = await service.getDetail(
      warehouseId,
      identifiers.transportTaskId,
    );
    expect(detail.task).toMatchObject({
      status: "unknown",
      source: "RECEIVING-01",
      destination: "STORAGE-A-01",
      sku: command.load.sku,
      quantity: 24,
    });
    expect(detail.load).toMatchObject({
      externalId: command.load.externalId,
      location: "RECEIVING-01",
    });
    expect(detail.originResource).toEqual({
      type: "InboundReceipt",
      id: identifiers.receiptId,
    });
    expect(detail.route).toBeNull();
    await expect(
      service.getDetail(otherWarehouseId, identifiers.transportTaskId),
    ).rejects.toMatchObject({ status: 404 });
    await pool.query(
      "UPDATE transport_tasks SET equipment_id = 'OTHER-AMR' WHERE id = $1",
      [identifiers.transportTaskId],
    );
    await expect(
      service.getDetail(warehouseId, identifiers.transportTaskId),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("projects scoped stock and reservation balances without treating received load quantity as current stock", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    await pool.query(
      "UPDATE loads SET current_location_id = $1, status = 'stored' WHERE id = $2",
      [command.destinationLocationId, identifiers.loadId],
    );
    await pool.query(
      "INSERT INTO inventory_units (id, load_id, sku, quantity, location_id, status) VALUES ($1,$2,$3,24,$4,'available')",
      [
        "81000000-0000-4000-8000-000000000001",
        identifiers.loadId,
        command.load.sku,
        command.destinationLocationId,
      ],
    );
    await new PgOutboundRepository(pool).create(
      outboundCommand,
      outboundIdentifiers,
      requestHash(outboundCommand),
    );
    const service = new InventoryProjectionService(pool);
    const projected = await service.list(warehouseId, {
      search: "integration",
    });
    expect(projected.items).toHaveLength(1);
    expect(projected.items[0]).toMatchObject({
      quantity: 24,
      reservedQuantity: 10,
      unreservedQuantity: 14,
      loadExternalId: command.load.externalId,
      receiptId: identifiers.receiptId,
    });
    expect((await service.list(otherWarehouseId)).items).toEqual([]);
    expect((await service.list(warehouseId, { search: "%" })).items).toEqual(
      [],
    );
    await pool.query(
      "UPDATE inventory_units SET quantity = 20, status = 'quarantined'",
    );
    expect((await service.list(warehouseId)).items[0]).toMatchObject({
      quantity: 20,
      reservedQuantity: 10,
      unreservedQuantity: 0,
    });
    await pool.query(
      "INSERT INTO loads (id, external_id, receipt_id, sku, quantity, status, current_location_id) SELECT '41000000-0000-4000-8000-000000000002', 'SECOND-PALLET', receipt_id, sku, 5, status, current_location_id FROM loads WHERE id = $1",
      [identifiers.loadId],
    );
    await pool.query(
      "INSERT INTO inventory_units (id, load_id, sku, quantity, location_id, status) SELECT '81000000-0000-4000-8000-000000000002', id, sku, 5, current_location_id, 'available' FROM loads WHERE id = '41000000-0000-4000-8000-000000000002'",
    );
    const first = await service.list(warehouseId, { limit: 1 });
    expect(first.nextCursor).toBeTruthy();
    const second = await service.list(warehouseId, {
      limit: 1,
      cursor: first.nextCursor,
    });
    expect(second.items[0].inventoryUnitId).not.toBe(
      first.items[0].inventoryUnitId,
    );
    expect(second.nextCursor).toBeNull();
    await pool.query(
      "UPDATE inventory_units SET status = 'shipped' WHERE id = $1",
      [second.items[0].inventoryUnitId],
    );
    expect(
      (await service.list(warehouseId)).items.find(
        (item) => item.inventoryUnitId === second.items[0].inventoryUnitId,
      ),
    ).toMatchObject({ status: "shipped", quantity: 0, unreservedQuantity: 0 });
    await expect(
      service.list(otherWarehouseId, { cursor: first.nextCursor }),
    ).rejects.toMatchObject({ status: 400 });
    await pool.query(
      "INSERT INTO warehouses (id, code, name) VALUES ($1, 'FOREIGN-INVENTORY', 'Foreign') ON CONFLICT DO NOTHING",
      [otherWarehouseId],
    );
    await pool.query(
      "INSERT INTO locations (id, warehouse_id, code, kind, capabilities) VALUES ('21000000-0000-4000-8000-000000000099',$1,'FOREIGN','storage',ARRAY['inventory.store']) ON CONFLICT DO NOTHING",
      [otherWarehouseId],
    );
    await pool.query(
      "UPDATE loads SET current_location_id = '21000000-0000-4000-8000-000000000099' WHERE id = $1",
      [identifiers.loadId],
    );
    expect(
      (await service.list(warehouseId)).items.map(
        (item) => item.inventoryUnitId,
      ),
    ).toEqual([second.items[0].inventoryUnitId]);
  });

  it("projects load origins and distinguishes unrecorded, partial and shipped inventory", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    const service = new LoadProjectionService(pool);
    expect((await service.list(warehouseId)).items[0]).toMatchObject({
      receivedQuantity: 24,
      inventory: null,
      receiptReference: command.externalReference,
    });
    await pool.query(
      "INSERT INTO inventory_units (id,load_id,sku,quantity,location_id,status) VALUES ('81000000-0000-4000-8000-000000000001',$1,$2,14,$3,'available')",
      [identifiers.loadId, command.load.sku, command.sourceLocationId],
    );
    expect(
      (await service.list(warehouseId, { search: "integration" })).items[0],
    ).toMatchObject({
      receivedQuantity: 24,
      inventory: { quantity: 14, status: "available" },
    });
    expect((await service.list(otherWarehouseId)).items).toEqual([]);
    expect((await service.list(warehouseId, { search: "%" })).items).toEqual(
      [],
    );
    await pool.query("UPDATE inventory_units SET status = 'shipped'");
    expect((await service.list(warehouseId)).items[0]).toMatchObject({
      receivedQuantity: 24,
      inventory: { quantity: 0, status: "shipped" },
    });
    await pool.query(
      "INSERT INTO loads (id,external_id,receipt_id,sku,quantity,status,current_location_id) SELECT '41000000-0000-4000-8000-000000000002','SECOND-LOAD',receipt_id,sku,5,status,current_location_id FROM loads WHERE id = $1",
      [identifiers.loadId],
    );
    const first = await service.list(warehouseId, { limit: 1 });
    const second = await service.list(warehouseId, {
      limit: 1,
      cursor: first.nextCursor,
    });
    expect(first.items[0].loadId).not.toBe(second.items[0].loadId);
    expect(second.nextCursor).toBeNull();
    await expect(
      service.list(otherWarehouseId, { cursor: first.nextCursor }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.list(warehouseId, { search: "other", cursor: first.nextCursor }),
    ).rejects.toMatchObject({ status: 400 });
    await pool.query(
      "UPDATE inbound_receipts SET warehouse_id = $1 WHERE id = $2",
      [otherWarehouseId, identifiers.receiptId],
    );
    expect((await service.list(warehouseId)).items).toEqual([]);
    expect(
      (await new InventoryProjectionService(pool).list(warehouseId)).items,
    ).toEqual([]);
  });

  it("projects scoped location records without asserting physical occupancy", async () => {
    if (!pool) throw new Error("Integration pool was not configured.");
    await new PgInboundRepository(pool).create(
      command,
      identifiers,
      requestHash(command),
    );
    const service = new LocationProjectionService(pool);
    const first = await service.list(warehouseId, { limit: 1 });
    expect(first.items[0]).toMatchObject({
      locationId: command.sourceLocationId,
      recordedLoads: 1,
      stockRecords: 0,
    });
    expect(first.items[0].binding).not.toBeNull();
    const binding = await pool.query(
      "SELECT binding.node_id, topology.id, topology.revision FROM location_topology_bindings binding JOIN warehouse_topologies topology ON topology.id=binding.topology_id AND topology.status='active' WHERE binding.location_id=$1",
      [command.sourceLocationId],
    );
    expect(first.items[0].binding).toEqual({
      topologyId: binding.rows[0].id,
      revision: binding.rows[0].revision,
      nodeId: binding.rows[0].node_id,
    });
    const next = await service.list(warehouseId, {
      limit: 1,
      cursor: first.nextCursor,
    });
    expect(next.items[0].locationId).not.toBe(first.items[0].locationId);
    await expect(
      service.list(otherWarehouseId, { cursor: first.nextCursor }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.list(warehouseId, { search: "other", cursor: first.nextCursor }),
    ).rejects.toMatchObject({ status: 400 });
    expect((await service.list(warehouseId, { search: "%" })).items).toEqual(
      [],
    );
    await pool.query(
      "INSERT INTO inventory_units (id,load_id,sku,quantity,location_id,status) VALUES ('81000000-0000-4000-8000-000000000001',$1,$2,14,$3,'available')",
      [identifiers.loadId, command.load.sku, command.sourceLocationId],
    );
    expect((await service.list(warehouseId)).items[0].stockRecords).toBe(1);
    await pool.query("UPDATE inventory_units SET status='shipped'");
    expect((await service.list(warehouseId)).items[0]).toMatchObject({
      recordedLoads: 1,
      stockRecords: 0,
    });
    await pool.query(
      "UPDATE inbound_receipts SET warehouse_id=$1 WHERE id=$2",
      [otherWarehouseId, identifiers.receiptId],
    );
    expect((await service.list(warehouseId)).items[0]).toMatchObject({
      recordedLoads: 0,
      stockRecords: 0,
    });
    expect(
      (await service.list(otherWarehouseId)).items.every(
        (item) => item.locationId !== command.sourceLocationId,
      ),
    ).toBe(true);
  });

  it.each(["unbound", "retired"])(
    "does not infer a location binding from matching labels when %s",
    async (state) => {
      if (!pool) throw new Error("Integration pool was not configured.");
      const saved = await pool.query<{
        warehouse_id: string;
        topology_id: string;
        topology_revision: number;
        node_id: string;
      }>(
        "SELECT binding.warehouse_id, binding.topology_id, binding.topology_revision, binding.node_id FROM location_topology_bindings binding JOIN warehouse_topologies topology ON topology.id=binding.topology_id AND topology.revision=binding.topology_revision AND topology.status='active' WHERE binding.location_id=$1",
        [command.sourceLocationId],
      );
      const binding = saved.rows[0];
      expect(binding).toBeDefined();
      const service = new LocationProjectionService(pool);
      const initial = (await service.list(warehouseId)).items.find(
        (item) => item.locationId === command.sourceLocationId,
      )!;
      expect(initial.code).toBe(binding.node_id);
      expect(initial.binding?.nodeId).toBe(binding.node_id);
      try {
        if (state === "unbound")
          await pool.query(
            "DELETE FROM location_topology_bindings WHERE location_id=$1 AND topology_id=$2 AND topology_revision=$3",
            [
              command.sourceLocationId,
              binding.topology_id,
              binding.topology_revision,
            ],
          );
        else
          await pool.query(
            "UPDATE warehouse_topologies SET status='retired' WHERE id=$1 AND revision=$2",
            [binding.topology_id, binding.topology_revision],
          );
        const item = (await service.list(warehouseId)).items.find(
          (entry) => entry.locationId === command.sourceLocationId,
        )!;
        expect(item.code).toBe(binding.node_id);
        expect(item.binding).toBeNull();
        const details = await new OperationsSummaryService(pool).getDetails(
          warehouseId,
        );
        expect(
          details.locations.find(
            (entry) => entry.locationId === command.sourceLocationId,
          )?.activeNodeId,
        ).toBeNull();
      } finally {
        await pool.query(
          "UPDATE warehouse_topologies SET status='active' WHERE id=$1 AND revision=$2",
          [binding.topology_id, binding.topology_revision],
        );
        await pool.query(
          "INSERT INTO location_topology_bindings (location_id,warehouse_id,topology_id,topology_revision,node_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (location_id,topology_id,topology_revision) DO NOTHING",
          [
            command.sourceLocationId,
            binding.warehouse_id,
            binding.topology_id,
            binding.topology_revision,
            binding.node_id,
          ],
        );
      }
    },
  );

  it.each(["warehouse", "node"])(
    "rejects a persisted binding to a foreign %s reference",
    async (reference) => {
      if (!pool) throw new Error("Integration pool was not configured.");
      const query =
        reference === "warehouse"
          ? "UPDATE location_topology_bindings SET warehouse_id=$2 WHERE location_id=$1"
          : "UPDATE location_topology_bindings SET node_id=$2 WHERE location_id=$1";
      const invalid =
        reference === "warehouse" ? otherWarehouseId : command.sourceLocationId;
      await expect(
        pool.query(query, [command.sourceLocationId, invalid]),
      ).rejects.toMatchObject({ code: "23503" });
      const item = (
        await new LocationProjectionService(pool).list(warehouseId)
      ).items.find((entry) => entry.locationId === command.sourceLocationId);
      expect(item).toBeDefined();
      expect(item?.binding).not.toBeNull();
    },
  );

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
    const stale = await new OperationsSummaryService(pool).getDetails(
      warehouseId,
    );
    expect(stale.equipment[0]?.telemetry).toMatchObject({
      freshness: "stale",
      connectionStatus: "connected",
      sequence: 10,
    });
    expect(
      (await new OperationsSummaryService(pool).getLiveView(warehouseId))
        .equipment[0].position,
    ).toMatchObject({
      state: "last_known",
      reason: "stale",
      locations: ["STORAGE-A-01"],
    });

    await expect(
      sink.publish({
        ...observation,
        sequence: 11,
        observedAt: new Date(),
      }),
    ).resolves.toBe("applied");
    const refreshed = await new OperationsSummaryService(pool).getDetails(
      warehouseId,
    );
    expect(refreshed.equipment[0]?.telemetry).toMatchObject({
      freshness: "current",
      sequence: 11,
    });
    expect(
      (await new OperationsSummaryService(pool).getLiveView(warehouseId))
        .equipment[0].position.state,
    ).toBe("current");
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
      actorType: "user",
      warehouseId,
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
    const outboundDetail = await new TaskProjectionService(pool).getDetail(
      warehouseId,
      allocated.transportTaskIds[0]!,
    );
    expect(outboundDetail.task).toMatchObject({
      flow: "outbound",
      quantity: 10,
      sku: outboundCommand.sku,
      externalReference: outboundCommand.externalReference,
    });
    expect(outboundDetail.originResource).toEqual({
      type: "OutboundOrder",
      id: outboundIdentifiers.outboundOrderId,
    });
    expect(outboundDetail.load.externalId).toBe(command.load.externalId);

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
        warehouseId,
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
      actorType: "user",
      warehouseId,
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
      warehouseId,
      "AMR-01",
      0,
      "integration-test",
      {
        outboxEventId: "90000000-0000-4000-8000-000000000013",
        auditEventId: "90000000-0000-4000-8000-000000000014",
        actorType: "user",
      },
    );
    await execution.markInProgress(
      identifiers.transportTaskId,
      warehouseId,
      assigned.version,
      "integration-test",
      {
        outboxEventId: "90000000-0000-4000-8000-000000000015",
        auditEventId: "90000000-0000-4000-8000-000000000016",
        actorType: "user",
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
      actorId: "integration-simulator-service",
      actorType: "service",
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
      actorType: "user",
      warehouseId,
      confirmationReason: "Alarm evidence reviewed during integration drill.",
    });
    const released = await recovery.recover({
      alarmId: alarm.alarmId,
      strategy: "release",
      resolution: "Vehicle isolated; task returned for reassignment.",
      actorId: "integration-supervisor",
      actorType: "user",
      warehouseId,
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
      acknowledgement_confirmation: string;
      recovery_confirmation: string;
      fault_actor_type: string;
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
          WHERE action = 'alarm.acknowledge') AS acknowledgement_confirmation,
        (SELECT details ->> 'confirmationReason' FROM audit_events
          WHERE action = 'transport_task.recover_release') AS recovery_confirmation
        ,(SELECT actor_type FROM audit_events
          WHERE action = 'transport_task.block_for_fault') AS fault_actor_type
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
      acknowledgement_confirmation:
        "Alarm evidence reviewed during integration drill.",
      recovery_confirmation: "Release approved after vehicle isolation.",
      fault_actor_type: "service",
    });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "idle",
      taskId: null,
    });
  });
});
