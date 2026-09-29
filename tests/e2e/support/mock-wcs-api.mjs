import { createServer } from "node:http";

const port = Number(process.env.MOCK_WCS_PORT ?? "3101");
const token = process.env.API_SERVICE_TOKEN;
if (!token) throw new Error("API_SERVICE_TOKEN is required for the E2E mock.");

const generatedAt = "2026-09-18T08:00:00.000Z";
const expectedWarehouseId = "10000000-0000-4000-8000-000000000001";
const expectedPrincipal = "legacy-demo-admin";

function hasOperationalContext(request, permission) {
  const permissions = String(request.headers["x-swp-user-permissions"] ?? "")
    .split(",")
    .map((value) => value.trim());
  return (
    request.headers["x-swp-principal"] === expectedPrincipal &&
    permissions.includes(permission) &&
    request.headers["x-swp-warehouse"] === expectedWarehouseId &&
    request.headers["x-swp-warehouse-scopes"] === expectedWarehouseId
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
    request.method === "GET" &&
    (request.url === "/api/v1/operations/summary" ||
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
  if (request.url === "/api/v1/operations/summary") {
    response.end(JSON.stringify(summary));
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
