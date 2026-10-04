import { createServer } from "node:http";

const port = Number(process.env.MOCK_WCS_PORT ?? "3101");
const token = process.env.API_SERVICE_TOKEN;
if (!token) throw new Error("API_SERVICE_TOKEN is required for the E2E mock.");

const generatedAt = "2026-09-18T08:00:00.000Z";
const expectedWarehouseId = "10000000-0000-4000-8000-000000000001";
const secondWarehouseId = "20000000-0000-4000-8000-000000000010";
const expectedWarehouseScopes = [expectedWarehouseId, secondWarehouseId];
const expectedPrincipal = "legacy-demo-admin";
const humanSession = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: "2099-01-01T00:00:00.000Z",
};

function humanAccess(currentWarehouseId = expectedWarehouseId) {
  const fullPermissions = [
    "operations.view",
    "audit.view",
    "inbound.create",
    "outbound.create",
    "transport.execute",
    "alarm.acknowledge",
    "alarm.recover",
  ];
  const readPermissions = ["operations.view", "audit.view"];
  return {
    principal: {
      kind: "human",
      subject: expectedPrincipal,
      displayName: "e2e-operator",
      identityProvider: "demo-credentials",
      permissions:
        currentWarehouseId === secondWarehouseId
          ? readPermissions
          : fullPermissions,
      warehouseScopes: [
        {
          warehouseId: expectedWarehouseId,
          code: "DEMO",
          name: "Deterministic Demo Warehouse",
          permissions: fullPermissions,
        },
        {
          warehouseId: secondWarehouseId,
          code: "SECOND",
          name: "Second Demo Warehouse",
          permissions: readPermissions,
        },
      ],
    },
    currentWarehouseId,
  };
}

function hasOperationalContext(request, permission) {
  const permissions = String(request.headers["x-swp-user-permissions"] ?? "")
    .split(",")
    .map((value) => value.trim());
  return (
    request.headers["x-swp-principal"] === expectedPrincipal &&
    permissions.includes(permission) &&
    expectedWarehouseScopes.includes(request.headers["x-swp-warehouse"]) &&
    request.headers["x-swp-warehouse-scopes"] ===
      expectedWarehouseScopes.join(",")
  );
}

function requireOperationalContext(request, response, permission) {
  if (hasOperationalContext(request, permission)) return true;
  response.statusCode = 403;
  response.end(JSON.stringify({ error: "invalid operational context" }));
  return false;
}
const baseSummary = {
  counts: {
    activeTasks: 1,
    storedInventory: 1,
    openReceipts: 0,
    configuredEquipment: 1,
  },
  topology: { topologyId: "warehouse-alpha", revision: 3 },
  recentTasks: [
    {
      taskId: "task-e2e-001",
      status: "assigned",
      sourceLocationId: "receiving-01",
      destinationLocationId: "storage-01",
      equipmentId: "agv-e2e-01",
      updatedAt: generatedAt,
    },
  ],
  generatedAt,
};
const baseDetails = {
  locations: [
    {
      locationId: "20000000-0000-4000-8000-000000000001",
      code: "RECEIVING-01",
      kind: "receiving",
      status: "available",
      capabilities: ["load.pickup"],
      activeNodeId: "receiving-01",
    },
    {
      locationId: "20000000-0000-4000-8000-000000000002",
      code: "STORAGE-01",
      kind: "storage",
      status: "available",
      capabilities: ["load.dropoff", "inventory.store"],
      activeNodeId: "storage-01",
    },
    {
      locationId: "20000000-0000-4000-8000-000000000003",
      code: "SHIPPING-01",
      kind: "shipping",
      status: "available",
      capabilities: ["load.dropoff", "outbound.stage"],
      activeNodeId: "shipping-01",
    },
  ],
  tasks: [
    {
      taskId: "task-e2e-001",
      status: "assigned",
      source: "RECEIVING-01",
      destination: "STORAGE-01",
      equipmentId: "agv-e2e-01",
      updatedAt: generatedAt,
    },
  ],
  equipment: [
    {
      equipmentId: "agv-e2e-01",
      adapterKey: "deterministic-simulator",
      capabilities: [
        "transport.move",
        "load.pickup",
        "load.dropoff",
        "navigation.graph",
      ],
      active: true,
      telemetry: {
        status: "idle",
        taskId: null,
        loadId: null,
        faultCode: null,
        topologyId: "warehouse-alpha",
        topologyRevision: 3,
        nodeId: "receiving-01",
        connectionStatus: "connected",
        quality: "good",
        freshness: "current",
        ageMs: 0,
        sequence: 1,
        observedAt: generatedAt,
        receivedAt: generatedAt,
        source: "e2e-simulator",
      },
    },
  ],
  inventory: [
    {
      inventoryUnitId: "inventory-e2e-001",
      sku: "SKU-E2E",
      quantity: 4,
      location: "STORAGE-01",
      status: "available",
      updatedAt: generatedAt,
    },
  ],
  alarms: [],
  topology: {
    topologyId: "warehouse-alpha",
    revision: 3,
    nodes: [
      {
        nodeId: "receiving-01",
        kind: "receiving",
        capabilities: ["transfer"],
        position: { coordinateSystem: "e2e", x: 0, y: 0 },
      },
      {
        nodeId: "storage-01",
        kind: "storage",
        capabilities: ["store"],
        position: { coordinateSystem: "e2e", x: 10, y: 0 },
      },
      {
        nodeId: "shipping-01",
        kind: "shipping",
        capabilities: ["outbound.stage"],
        position: { coordinateSystem: "e2e", x: 20, y: 0 },
      },
    ],
    edges: [
      {
        edgeId: "edge-e2e-001",
        fromNodeId: "receiving-01",
        toNodeId: "storage-01",
        status: "available",
        requiredCapabilities: ["transport.load"],
        resourceIds: [],
      },
      {
        edgeId: "edge-e2e-002",
        fromNodeId: "storage-01",
        toNodeId: "shipping-01",
        status: "available",
        requiredCapabilities: ["transport.load"],
        resourceIds: [],
      },
    ],
  },
  generatedAt,
};
const auditEvents = [
  {
    eventId: "70000000-0000-4000-8000-000000000097",
    correlationId: "request:e2e-receipt-001",
    occurredAt: "2026-09-18T07:58:00.000Z",
    actor: { type: "user", id: "e2e-operator" },
    action: "inbound_receipt.create",
    knownAction: true,
    resource: {
      type: "InboundReceipt",
      id: "30000000-0000-4000-8000-000000000099",
    },
    knownResource: true,
    evidence: {
      transportTaskId: "50000000-0000-4000-8000-000000000099",
    },
  },
  {
    eventId: "70000000-0000-4000-8000-000000000099",
    correlationId: "request:e2e-workflow-001",
    occurredAt: generatedAt,
    actor: { type: "user", id: "e2e-operator" },
    action: "transport_task.complete",
    knownAction: true,
    knownResource: true,
    resource: {
      type: "TransportTask",
      id: "50000000-0000-4000-8000-000000000099",
    },
    evidence: {
      equipmentId: "agv-e2e-01",
      receiptId: "30000000-0000-4000-8000-000000000099",
    },
  },
  {
    eventId: "70000000-0000-4000-8000-000000000096",
    correlationId: "request:e2e-order-001",
    occurredAt: "2026-09-18T07:57:00.000Z",
    actor: { type: "user", id: "e2e-operator" },
    action: "outbound_order.allocate",
    knownAction: true,
    resource: {
      type: "OutboundOrder",
      id: "a0000000-0000-4000-8000-000000000099",
    },
    knownResource: true,
    evidence: {
      transportTaskIds: ["c0000000-0000-4000-8000-000000000099"],
    },
  },
  {
    eventId: "70000000-0000-4000-8000-000000000095",
    correlationId: "request:e2e-alarm-001",
    occurredAt: "2026-09-18T07:56:00.000Z",
    actor: { type: "user", id: "e2e-operator" },
    action: "alarm.acknowledge",
    knownAction: true,
    resource: {
      type: "Alarm",
      id: "80000000-0000-4000-8000-000000000098",
    },
    knownResource: true,
    evidence: {
      taskId: "50000000-0000-4000-8000-000000000098",
      equipmentId: "agv-e2e-01",
    },
  },
  {
    eventId: "70000000-0000-4000-8000-000000000098",
    correlationId: "request:e2e-unknown-001",
    occurredAt: "2026-09-18T07:00:00.000Z",
    actor: { type: "system", id: "future-worker" },
    action: "future_action.not_yet_known",
    knownAction: false,
    knownResource: true,
    resource: {
      type: "TransportTask",
      id: "50000000-0000-4000-8000-000000000098",
    },
    evidence: {},
  },
];

let summary = structuredClone(baseSummary);
let details = structuredClone(baseDetails);
function fixtureTaskId(task) {
  return /^[0-9a-f-]{36}$/i.test(task.taskId)
    ? task.taskId
    : `50000000-0000-4000-8000-${String(
        details.tasks.indexOf(task) + 1,
      ).padStart(12, "0")}`;
}
function fixtureQueue() {
  return details.tasks.map((task) => ({
    taskId: fixtureTaskId(task),
    status: task.status,
    source: task.source,
    destination: task.destination,
    equipmentId: task.equipmentId,
    flow: task.taskId.includes("outbound") ? "outbound" : "inbound",
    externalReference: "ASN-E2E-001",
    sku: "SKU-E2E",
    quantity: 12,
    createdAt: generatedAt,
    updatedAt: task.updatedAt,
  }));
}

function reset() {
  summary = structuredClone(baseSummary);
  details = structuredClone(baseDetails);
}

function refreshSummary() {
  summary.counts.activeTasks = details.tasks.filter((task) =>
    ["assigned", "in_progress", "blocked", "unknown"].includes(task.status),
  ).length;
  summary.counts.storedInventory = details.inventory.filter(
    (item) => item.status === "available" || item.status === "stored",
  ).length;
  summary.recentTasks = details.tasks.slice(0, 5).map((task) => ({
    taskId: task.taskId,
    status: task.status,
    sourceLocationId: task.source.toLowerCase(),
    destinationLocationId: task.destination.toLowerCase(),
    equipmentId: task.equipmentId,
    updatedAt: task.updatedAt,
  }));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body.length > 0 ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function scenario(name) {
  reset();
  if (name === "baseline") return true;
  if (name === "inbound-completed") {
    details.tasks = [
      {
        taskId: "task-inbound-completed",
        status: "completed",
        source: "RECEIVING-01",
        destination: "STORAGE-01",
        equipmentId: "agv-e2e-01",
        updatedAt: generatedAt,
      },
    ];
    details.inventory = [
      {
        inventoryUnitId: "inventory-inbound-completed",
        sku: "SKU-INBOUND-E2E",
        quantity: 24,
        location: "STORAGE-01",
        status: "available",
        updatedAt: generatedAt,
      },
    ];
  } else if (name === "outbound-completed") {
    details.tasks = [
      {
        taskId: "task-outbound-completed",
        status: "completed",
        source: "STORAGE-01",
        destination: "SHIPPING-01",
        equipmentId: "agv-e2e-01",
        updatedAt: generatedAt,
      },
    ];
    details.inventory = [
      {
        inventoryUnitId: "inventory-outbound-remaining",
        sku: "SKU-OUTBOUND-E2E",
        quantity: 14,
        location: "STORAGE-01",
        status: "available",
        updatedAt: generatedAt,
      },
    ];
  } else if (name === "faulted") {
    details.equipment[0].telemetry.status = "faulted";
    details.tasks = [
      {
        taskId: "50000000-0000-4000-8000-000000000098",
        status: "blocked",
        source: "RECEIVING-01",
        destination: "STORAGE-01",
        equipmentId: "agv-e2e-01",
        updatedAt: generatedAt,
      },
    ];
    details.alarms = [
      {
        alarmId: "80000000-0000-4000-8000-000000000098",
        taskId: "50000000-0000-4000-8000-000000000098",
        equipmentId: "agv-e2e-01",
        code: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
        status: "active",
        raisedAt: generatedAt,
        acknowledgedAt: null,
        clearedAt: null,
        resolution: null,
      },
    ];
  } else {
    return false;
  }
  refreshSummary();
  return true;
}

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/health") {
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (request.headers.authorization !== `Bearer ${token}`) {
    response.statusCode = 401;
    response.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  if (
    request.method === "POST" &&
    request.url === "/api/v1/access-context/human/login-attempts/evaluate"
  ) {
    const body = await readBody(request);
    if (
      body.identityProvider !== "demo-credentials" ||
      !/^[0-9a-f]{64}$/.test(body.identifierFingerprint) ||
      typeof body.accepted !== "boolean"
    ) {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "INVALID_LOGIN_ATTEMPT" }));
      return;
    }
    response.statusCode = 201;
    response.end(
      JSON.stringify({
        allowed: body.accepted,
        retryAfterSeconds: null,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url === "/api/v1/access-context/human/sessions"
  ) {
    const body = await readBody(request);
    if (
      body.identityProvider !== "demo-credentials" ||
      body.subject !== expectedPrincipal
    ) {
      response.statusCode = 401;
      response.end(JSON.stringify({ code: "ACCESS_SESSION_UNAVAILABLE" }));
      return;
    }
    response.statusCode = 201;
    response.end(
      JSON.stringify({
        access: humanAccess(),
        session: humanSession,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      `/api/v1/access-context/human/sessions/${humanSession.sessionId}/validate`
  ) {
    const body = await readBody(request);
    if (
      body.identityProvider !== "demo-credentials" ||
      body.subject !== expectedPrincipal ||
      !expectedWarehouseScopes.includes(body.currentWarehouseId)
    ) {
      response.statusCode = 401;
      response.end(JSON.stringify({ code: "ACCESS_SESSION_UNAVAILABLE" }));
      return;
    }
    response.statusCode = 201;
    response.end(
      JSON.stringify({
        access: humanAccess(body.currentWarehouseId),
        session: humanSession,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      `/api/v1/access-context/human/sessions/${humanSession.sessionId}/revoke`
  ) {
    response.statusCode = 201;
    response.end(JSON.stringify({ revoked: true }));
    return;
  }
  if (
    request.method === "GET" &&
    (request.url === "/api/v1/operations/summary" ||
      request.url?.startsWith("/api/v1/operations/tasks") ||
      request.url?.startsWith("/api/v1/operations/work/") ||
      request.url?.startsWith("/api/v1/operations/context/") ||
      request.url?.startsWith("/api/v1/operations/inventory") ||
      request.url?.startsWith("/api/v1/operations/loads") ||
      request.url?.startsWith("/api/v1/operations/locations") ||
      request.url === "/api/v1/operations/home" ||
      request.url === "/api/v1/operations/overview" ||
      request.url?.startsWith("/api/v1/operations/live-view") ||
      request.url === "/api/v1/operations/details" ||
      request.url?.startsWith("/api/v1/audit-events")) &&
    !requireOperationalContext(
      request,
      response,
      request.url.startsWith("/api/v1/audit-events")
        ? "audit.view"
        : "operations.view",
    )
  ) {
    return;
  }
  if (
    request.method === "POST" &&
    request.url === "/api/v1/access-context/warehouse"
  ) {
    if (!requireOperationalContext(request, response, "operations.view"))
      return;
    const body = await readBody(request);
    if (
      !expectedWarehouseScopes.includes(body.targetWarehouseId) ||
      body.targetWarehouseId === request.headers["x-swp-warehouse"]
    ) {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "INVALID_WAREHOUSE_CONTEXT" }));
      return;
    }
    response.statusCode = 201;
    response.end(
      JSON.stringify({ currentWarehouseId: body.targetWarehouseId }),
    );
    return;
  }
  if (request.url === "/api/v1/operations/summary") {
    response.end(JSON.stringify(summary));
    return;
  }
  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/context/")
  ) {
    const url = new URL(request.url, "http://fixture");
    const taskId = url.pathname.split("/")[5];
    const surface = url.pathname.split("/")[6];
    const task = fixtureQueue().find((item) => item.taskId === taskId);
    const alarm = details.alarms.find((item) => item.taskId === taskId) ?? null;
    const requestedAlarm = url.searchParams.get("alarmId");
    if (
      !task ||
      request.headers["x-swp-warehouse"] === secondWarehouseId ||
      ![
        "load",
        "inventory",
        "source",
        "destination",
        "live",
        "exception",
        "history",
      ].includes(surface) ||
      (requestedAlarm !== null && requestedAlarm !== alarm?.alarmId)
    ) {
      response.statusCode = 404;
      response.end(JSON.stringify({ code: "CONTEXT_NOT_FOUND" }));
      return;
    }
    const location = (id, code) => ({
      locationId: id,
      code,
      kind: code.includes("RECEIVING") ? "receiving" : "storage",
      status: "available",
      capabilities: [],
      recordedLoads: 1,
      stockRecords: 1,
      binding: null,
    });
    const exactLive =
      surface === "live"
        ? await fetch(`http://127.0.0.1:${port}/api/v1/operations/live-view`, {
            headers: request.headers,
          }).then((result) => result.json())
        : null;
    response.end(
      JSON.stringify({
        detail: {
          task,
          originResource: {
            type: "InboundReceipt",
            id: "30000000-0000-4000-8000-000000000001",
          },
          load: {
            externalId: "PALLET-E2E-001",
            status: "stored",
            location: "STORAGE-01",
          },
          route: null,
          alarm:
            alarm && alarm.status !== "cleared"
              ? {
                  alarmId: alarm.alarmId,
                  code: alarm.code,
                  message: alarm.message,
                  status: alarm.status,
                  severity: alarm.severity,
                }
              : null,
          generatedAt,
        },
        load: {
          loadId: "40000000-0000-4000-8000-000000000001",
          externalId: "PALLET-E2E-001",
          sku: "SKU-E2E",
          receivedQuantity: 12,
          status: "stored",
          location: "STORAGE-01",
          receiptId: "30000000-0000-4000-8000-000000000001",
          receiptReference: "ASN-E2E-001",
          inventory: {
            quantity: 12,
            status: "available",
            location: "STORAGE-01",
          },
          updatedAt: generatedAt,
        },
        inventory: {
          inventoryUnitId: "81000000-0000-4000-8000-000000000001",
          sku: "SKU-E2E",
          quantity: 12,
          reservedQuantity: 0,
          unreservedQuantity: 12,
          status: "available",
          location: "STORAGE-01",
          locationStatus: "available",
          loadExternalId: "PALLET-E2E-001",
          loadLocation: "STORAGE-01",
          receiptId: "30000000-0000-4000-8000-000000000001",
          receiptReference: "ASN-E2E-001",
          updatedAt: generatedAt,
        },
        source: location("20000000-0000-4000-8000-000000000001", task.source),
        destination: location(
          "20000000-0000-4000-8000-000000000002",
          task.destination,
        ),
        alarm,
        live: exactLive,
        generatedAt,
      }),
    );
    return;
  }
  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/work/")
  ) {
    const url = new URL(request.url, "http://127.0.0.1");
    const [, , , , , flow, workId] = url.pathname.split("/");
    const tasks = fixtureQueue().filter((task) => task.flow === flow);
    if (
      request.headers["x-swp-warehouse"] === secondWarehouseId ||
      workId !== "30000000-0000-4000-8000-000000000001" ||
      !["inbound", "outbound"].includes(flow)
    ) {
      response.statusCode = 404;
      response.end(JSON.stringify({ code: "WORK_NOT_FOUND" }));
      return;
    }
    const counts = Object.fromEntries(
      [
        "queued",
        "assigned",
        "in_progress",
        "blocked",
        "unknown",
        "completed",
        "cancelled",
      ].map((status) => [
        status,
        tasks.filter((task) => task.status === status).length,
      ]),
    );
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("cursor") ?? 0);
    response.end(
      JSON.stringify({
        work: {
          workId,
          flow,
          externalReference: "ASN-E2E-001",
          status: flow === "inbound" ? "requested" : "allocated",
          contents: [{ sku: "SKU-E2E", quantity: 12 }],
          contentsMayBeLimited: false,
          destination: flow === "outbound" ? "SHIPPING-01" : null,
          createdAt: generatedAt,
          updatedAt: generatedAt,
        },
        execution: {
          referencedTaskCount: tasks.length,
          qualifiedTaskCount: tasks.length,
          counts,
          page: {
            tasks: tasks.slice(offset, offset + limit),
            nextCursor:
              tasks.length > offset + limit ? String(offset + limit) : null,
            generatedAt,
          },
        },
      }),
    );
    return;
  }
  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/tasks")
  ) {
    const url = new URL(request.url, "http://127.0.0.1");
    const queue =
      request.headers["x-swp-warehouse"] === secondWarehouseId
        ? []
        : fixtureQueue();
    const taskId = url.pathname.split("/")[5];
    if (taskId) {
      const task = queue.find((t) => t.taskId === taskId);
      if (!task) {
        response.statusCode = 404;
        response.end(JSON.stringify({ code: "TASK_NOT_FOUND" }));
        return;
      }
      const alarm = details.alarms.find(
        (a) =>
          a.taskId ===
            details.tasks.find((t) => fixtureTaskId(t) === taskId)?.taskId &&
          a.status !== "cleared",
      );
      response.end(
        JSON.stringify({
          task,
          originResource: {
            type: task.flow === "inbound" ? "InboundReceipt" : "OutboundOrder",
            id: "30000000-0000-4000-8000-000000000001",
          },
          load: {
            externalId: "PALLET-E2E-001",
            status: "received",
            location: task.source,
          },
          route: {
            topologyId: "90000000-0000-4000-8000-000000000001",
            revision: 3,
            edges: ["RECEIVING-TO-STORAGE"],
          },
          alarm: alarm
            ? {
                alarmId: alarm.alarmId,
                code: alarm.code,
                message: alarm.message,
                status: alarm.status,
                severity: alarm.severity,
              }
            : null,
          generatedAt,
        }),
      );
      return;
    }
    const active = url.searchParams.get("view") !== "all";
    const filtered = queue.filter(
      (t) => !active || !["completed", "cancelled"].includes(t.status),
    );
    const offset = Number(url.searchParams.get("cursor") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    response.end(
      JSON.stringify({
        tasks: filtered.slice(offset, offset + limit),
        nextCursor:
          filtered.length > offset + limit ? String(offset + limit) : null,
        generatedAt,
      }),
    );
    return;
  }
  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/inventory")
  ) {
    const query = new URL(request.url, "http://fixture").searchParams;
    const item = {
      inventoryUnitId: "81000000-0000-4000-8000-000000000001",
      sku: "SKU-STOCK-001",
      quantity: 24,
      reservedQuantity: 10,
      unreservedQuantity: 14,
      status: "available",
      location: "STORAGE-01",
      locationStatus: "available",
      loadExternalId: "PALLET-STOCK-001",
      loadLocation: "STORAGE-01",
      receiptId: "30000000-0000-4000-8000-000000000001",
      receiptReference: "ASN-STOCK-001",
      updatedAt: generatedAt,
    };
    const search = (query.get("search") ?? "").toLowerCase();
    const shippedItem = {
      ...item,
      inventoryUnitId: "81000000-0000-4000-8000-000000000002",
      sku: "SKU-SHIPPED-001",
      quantity: 0,
      reservedQuantity: 0,
      unreservedQuantity: 0,
      status: "shipped",
    };
    const items =
      request.headers["x-swp-warehouse"] === secondWarehouseId
        ? []
        : [item, shippedItem]
            .filter(
              (row) =>
                (!query.get("locationId") ||
                  query.get("locationId") ===
                    "20000000-0000-4000-8000-000000000001") &&
                (!query.get("loadId") ||
                  query.get("loadId") ===
                    (row === shippedItem
                      ? "41000000-0000-4000-8000-000000000002"
                      : "41000000-0000-4000-8000-000000000003")),
            )
            .filter((row) =>
              [row.sku, row.location, row.loadExternalId].some((value) =>
                value.toLowerCase().includes(search),
              ),
            );
    response.end(JSON.stringify({ items, nextCursor: null, generatedAt }));
    return;
  }

  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/loads")
  ) {
    const query = new URL(request.url, "http://fixture").searchParams;
    const search = (query.get("search") ?? "").toLowerCase();
    const load = {
      loadId: "41000000-0000-4000-8000-000000000001",
      externalId: "PALLET-RECEIVED-001",
      sku: "SKU-LOAD",
      receivedQuantity: 24,
      status: "received",
      location: "RECEIVING-01",
      receiptId: "30000000-0000-4000-8000-000000000001",
      receiptReference: "ASN-LOAD",
      inventory: null,
      updatedAt: generatedAt,
    };
    const history = {
      ...load,
      loadId: "41000000-0000-4000-8000-000000000002",
      externalId: "PALLET-SHIPPED-001",
      status: "stored",
      location: "STORAGE-01",
      inventory: { quantity: 0, status: "shipped", location: "STORAGE-01" },
    };
    const items =
      request.headers["x-swp-warehouse"] === secondWarehouseId
        ? []
        : [load, history]
            .filter(
              (item) =>
                (!query.get("id") || query.get("id") === item.loadId) &&
                (!query.get("locationId") ||
                  query.get("locationId") ===
                    (item === history
                      ? "20000000-0000-4000-8000-000000000001"
                      : "20000000-0000-4000-8000-000000000003")),
            )
            .filter((item) =>
              [item.externalId, item.sku, item.location].some((value) =>
                value.toLowerCase().includes(search),
              ),
            );
    response.end(JSON.stringify({ items, nextCursor: null, generatedAt }));
    return;
  }

  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/operations/locations")
  ) {
    const query = new URL(request.url, "http://fixture").searchParams;
    const search = (query.get("search") ?? "").toLowerCase();
    const location = {
      locationId: "20000000-0000-4000-8000-000000000001",
      code: "STORAGE-01",
      kind: "storage",
      status: "blocked",
      capabilities: ["store"],
      recordedLoads: 2,
      stockRecords: 1,
      binding: {
        topologyId: "90000000-0000-4000-8000-000000000001",
        revision: 3,
        nodeId: "routing-storage-node",
      },
    };
    const unbound = {
      ...location,
      locationId: "20000000-0000-4000-8000-000000000002",
      code: "UNBOUND-01",
      status: "disabled",
      recordedLoads: 0,
      stockRecords: 0,
      binding: null,
    };
    const items =
      request.headers["x-swp-warehouse"] === secondWarehouseId
        ? []
        : [location, unbound]
            .filter(
              (item) => !query.get("id") || query.get("id") === item.locationId,
            )
            .filter((item) =>
              [item.code, item.kind].some((value) =>
                value.toLowerCase().includes(search),
              ),
            );
    const nextCursor =
      !search && items.length > 0 && !query.has("cursor")
        ? "location-next"
        : null;
    response.end(JSON.stringify({ items, nextCursor, generatedAt }));
    return;
  }

  // Deliberately bounded browser fixture; real qualification is tested against
  // projectOperationsLiveView and PostgreSQL, not inferred from this mock.
  if (request.url?.startsWith("/api/v1/operations/live-view")) {
    const scoped = request.headers["x-swp-warehouse"] !== secondWarehouseId;
    const work = scoped
      ? details.tasks
          .filter((task) =>
            [
              "queued",
              "assigned",
              "in_progress",
              "blocked",
              "unknown",
            ].includes(task.status),
          )
          .map((task) => ({ ...task, taskId: fixtureTaskId(task) }))
      : [];
    const equipment = scoped
      ? details.equipment.map((item) => {
          const telemetry = item.telemetry;
          const current =
            telemetry &&
            telemetry.topologyId === details.topology?.topologyId &&
            telemetry.topologyRevision === details.topology?.revision &&
            telemetry.nodeId;
          const receivedAt = telemetry?.receivedAt;
          return {
            equipmentId: item.equipmentId,
            active: item.active,
            capabilities: item.capabilities,
            status: telemetry?.status ?? null,
            observation: telemetry
              ? {
                  connectionStatus: telemetry.connectionStatus,
                  quality: telemetry.quality,
                  freshness: telemetry.freshness,
                  ageMs: telemetry.ageMs,
                  observedAt: telemetry.observedAt,
                  receivedAt,
                }
              : null,
            position: {
              state: current ? "current" : "unknown",
              reason: current ? "observed" : "missing_telemetry",
              nodeId: current ? telemetry.nodeId : null,
              reference: current
                ? {
                    kind: "topology_node",
                    topologyId: details.topology.topologyId,
                    topologyRevision: details.topology.revision,
                    nodeId: telemetry.nodeId,
                  }
                : null,
              locations: current
                ? details.locations
                    .filter(
                      (location) => location.activeNodeId === telemetry.nodeId,
                    )
                    .map((location) => location.code)
                : [],
              validUntil: current
                ? new Date(Date.parse(receivedAt) + 30_000).toISOString()
                : null,
            },
            observedTaskId: null,
            observedTaskContext: telemetry?.taskId ? "unresolved" : "none",
            assignedTaskIds: work
              .filter((task) => task.equipmentId === item.equipmentId)
              .map((task) => task.taskId),
          };
        })
      : [];
    response.end(
      JSON.stringify({
        equipment,
        work,
        alarms: [],
        spatialContext: {
          contractVersion: 1,
          positionRepresentation: "versioned_topology_node",
          physicalLayout: "unrecorded",
          coordinateSystems: [
            ...new Set(
              scoped
                ? details.topology?.nodes.flatMap((node) =>
                    node.position ? [node.position.coordinateSystem] : [],
                  ) ?? []
                : [],
            ),
          ]
            .sort()
            .map((identifier) => ({
              identifier,
              interpretation: "configured_topology_diagram",
              unit: null,
              floorId: null,
              coordinateFrameId: null,
              calibration: "unrecorded",
            })),
        },
        locations: scoped ? details.locations : [],
        topology: scoped ? details.topology : null,
        generatedAt,
        coverage: {
          workMayBeLimited: false,
          equipmentMayBeLimited: false,
          locationsMayBeLimited: false,
          alarmsMayBeLimited: false,
        },
      }),
    );
    return;
  }
  if (
    request.url === "/api/v1/operations/home" ||
    request.url === "/api/v1/operations/overview"
  ) {
    const home = {
      attention: [
        ...details.equipment
          .filter((equipment) => equipment.telemetry?.status === "faulted")
          .map((equipment) => ({
            kind: "equipment",
            severity: "critical",
            reference: equipment.equipmentId,
            reason: "faulted_equipment",
            taskId: null,
            equipmentId: equipment.equipmentId,
          })),
        ...details.tasks
          .filter((task) => ["unknown", "blocked"].includes(task.status))
          .map((task) => ({
            kind: "task",
            severity: task.status === "unknown" ? "critical" : "warning",
            reference: `${task.source} → ${task.destination}`,
            reason: `${task.status}_task`,
            taskId: task.taskId,
            equipmentId: task.equipmentId,
          })),
      ],
      work: details.tasks
        .filter((task) =>
          ["queued", "assigned", "in_progress", "blocked", "unknown"].includes(
            task.status,
          ),
        )
        .map((task) => ({
          ...task,
          taskId: fixtureTaskId(task),
          needsAttention: ["blocked", "unknown"].includes(task.status),
          nextStep: ["blocked", "unknown"].includes(task.status)
            ? "review_exception"
            : task.status === "queued"
              ? "await_assignment"
              : "monitor",
        })),
      inventory: {
        visibleUnits: details.inventory.length,
        visibleQuantity: details.inventory.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
        occupiedLocations: new Set(
          details.inventory.map((item) => item.location),
        ).size,
      },
      coverage: {
        tasksMayBeLimited: false,
        alarmsMayBeLimited: false,
        equipmentMayBeLimited: false,
        inventoryMayBeLimited: false,
      },
      generatedAt,
    };
    response.end(
      JSON.stringify(
        request.url === "/api/v1/operations/overview"
          ? { home, summary }
          : home,
      ),
    );
    return;
  }
  if (request.url === "/api/v1/operations/details") {
    response.end(JSON.stringify(details));
    return;
  }
  if (
    request.method === "GET" &&
    request.url?.startsWith("/api/v1/audit-events")
  ) {
    const url = new URL(request.url, "http://127.0.0.1");
    const correlationId = url.searchParams.get("correlationId");
    const resourceId = url.searchParams.get("resourceId");
    const events = auditEvents.filter(
      (event) =>
        (!correlationId || event.correlationId === correlationId) &&
        (!resourceId || event.resource.id === resourceId),
    );
    response.end(JSON.stringify({ events, nextCursor: null }));
    return;
  }
  if (request.method === "POST" && request.url === "/api/v1/inbound-receipts") {
    if (!requireOperationalContext(request, response, "inbound.create")) return;
    const body = await readBody(request);
    details.tasks = [
      {
        taskId: "50000000-0000-4000-8000-000000000099",
        status: "queued",
        source: "RECEIVING-01",
        destination: "STORAGE-01",
        equipmentId: null,
        updatedAt: generatedAt,
      },
      ...details.tasks,
    ];
    refreshSummary();
    response.statusCode = 201;
    response.end(
      JSON.stringify({
        receiptId: "30000000-0000-4000-8000-000000000099",
        loadId: "40000000-0000-4000-8000-000000000099",
        transportTaskId: "50000000-0000-4000-8000-000000000099",
        status: "requested",
        duplicate: false,
        echoedSku: body.load?.sku,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      "/api/v1/transport-tasks/50000000-0000-4000-8000-000000000099/execute"
  ) {
    if (!requireOperationalContext(request, response, "transport.execute"))
      return;
    const body = await readBody(request);
    if (body.confirmedAction !== "execute_inbound_task") {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "INVALID_CONFIRMATION" }));
      return;
    }
    details.tasks[0] = {
      ...details.tasks[0],
      status: "completed",
      equipmentId: body.equipmentId,
    };
    details.inventory.push({
      inventoryUnitId: "inventory-inbound-ui",
      sku: "SKU-UI-E2E",
      quantity: 6,
      location: "STORAGE-01",
      status: "available",
      updatedAt: generatedAt,
    });
    details.equipment[0].telemetry = {
      ...details.equipment[0].telemetry,
      nodeId: "storage-01",
      sequence: details.equipment[0].telemetry.sequence + 6,
    };
    refreshSummary();
    response.end(
      JSON.stringify({
        taskId: "50000000-0000-4000-8000-000000000099",
        equipmentId: body.equipmentId,
        status: "completed",
        completedAt: 6000,
      }),
    );
    return;
  }
  if (request.method === "POST" && request.url === "/api/v1/outbound-orders") {
    if (!requireOperationalContext(request, response, "outbound.create"))
      return;
    const body = await readBody(request);
    if (body.sku !== "SKU-E2E" || body.quantity !== 2) {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "INVALID_OUTBOUND" }));
      return;
    }
    details.tasks = [
      {
        taskId: "c0000000-0000-4000-8000-000000000099",
        status: "queued",
        source: "STORAGE-01",
        destination: "SHIPPING-01",
        equipmentId: null,
        updatedAt: generatedAt,
      },
      ...details.tasks,
    ];
    refreshSummary();
    response.statusCode = 201;
    response.end(
      JSON.stringify({
        outboundOrderId: "a0000000-0000-4000-8000-000000000099",
        allocationIds: ["b0000000-0000-4000-8000-000000000099"],
        transportTaskIds: ["c0000000-0000-4000-8000-000000000099"],
        status: "allocated",
        duplicate: false,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      "/api/v1/outbound-transport-tasks/c0000000-0000-4000-8000-000000000099/execute"
  ) {
    if (!requireOperationalContext(request, response, "transport.execute"))
      return;
    const body = await readBody(request);
    if (body.confirmedAction !== "execute_outbound_task") {
      response.statusCode = 400;
      response.end(JSON.stringify({ code: "INVALID_CONFIRMATION" }));
      return;
    }
    details.tasks[0] = {
      ...details.tasks[0],
      status: "completed",
      equipmentId: body.equipmentId,
    };
    const inventory = details.inventory.find((item) => item.sku === "SKU-E2E");
    if (inventory) inventory.quantity -= 2;
    details.equipment[0].telemetry = {
      ...details.equipment[0].telemetry,
      nodeId: "shipping-01",
      sequence: details.equipment[0].telemetry.sequence + 6,
    };
    refreshSummary();
    response.end(
      JSON.stringify({
        taskId: "c0000000-0000-4000-8000-000000000099",
        equipmentId: body.equipmentId,
        status: "completed",
        completedAt: 7000,
      }),
    );
    return;
  }
  if (
    request.method === "POST" &&
    request.url?.startsWith("/test/scenarios/")
  ) {
    const name = request.url.slice("/test/scenarios/".length);
    if (!scenario(name)) {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "scenario_not_found" }));
      return;
    }
    response.end(JSON.stringify({ scenario: name, status: "ready" }));
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      "/api/v1/alarms/80000000-0000-4000-8000-000000000098/acknowledge"
  ) {
    if (!requireOperationalContext(request, response, "alarm.acknowledge"))
      return;
    const body = await readBody(request);
    const alarm = details.alarms[0];
    if (
      !alarm ||
      alarm.status !== "active" ||
      body.confirmedAction !== "acknowledge_alarm" ||
      typeof body.confirmationReason !== "string"
    ) {
      response.statusCode = 409;
      response.end(JSON.stringify({ error: "invalid_alarm_state" }));
      return;
    }
    alarm.status = "acknowledged";
    alarm.acknowledgedAt = "2026-09-18T08:01:00.000Z";
    response.end(JSON.stringify(alarm));
    return;
  }
  if (
    request.method === "POST" &&
    request.url ===
      "/api/v1/alarms/80000000-0000-4000-8000-000000000098/recover"
  ) {
    if (!requireOperationalContext(request, response, "alarm.recover")) return;
    const body = await readBody(request);
    const alarm = details.alarms[0];
    const task = details.tasks[0];
    if (
      !alarm ||
      !task ||
      alarm.status !== "acknowledged" ||
      body.strategy !== "release" ||
      body.confirmedAction !== "release_task" ||
      typeof body.confirmationReason !== "string" ||
      body.confirmationReason.trim().length === 0 ||
      typeof body.resolution !== "string" ||
      body.resolution.trim().length === 0
    ) {
      response.statusCode = 409;
      response.end(JSON.stringify({ error: "invalid_recovery" }));
      return;
    }
    alarm.status = "cleared";
    alarm.clearedAt = "2026-09-18T08:02:00.000Z";
    alarm.resolution = body.resolution;
    task.status = "queued";
    task.equipmentId = null;
    refreshSummary();
    response.end(
      JSON.stringify({
        taskId: task.taskId,
        equipmentId: null,
        status: "queued",
        blockingAlarmId: null,
        version: 4,
      }),
    );
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
