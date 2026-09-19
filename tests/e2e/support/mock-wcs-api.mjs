import { createServer } from "node:http";

const port = Number(process.env.MOCK_WCS_PORT ?? "3101");
const token = process.env.API_SERVICE_TOKEN;
if (!token) throw new Error("API_SERVICE_TOKEN is required for the E2E mock.");

const generatedAt = "2026-09-18T08:00:00.000Z";
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
      capabilities: ["transport.load"],
      active: true,
    },
  ],
  inventory: [
    {
      inventoryUnitId: "inventory-e2e-001",
      sku: "SKU-E2E",
      quantity: 4,
      location: "STORAGE-01",
      status: "stored",
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
    ],
  },
  generatedAt,
};

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
        taskId: "task-fault-e2e",
        status: "blocked",
        source: "RECEIVING-01",
        destination: "STORAGE-01",
        equipmentId: "agv-e2e-01",
        updatedAt: generatedAt,
      },
    ];
    details.alarms = [
      {
        alarmId: "alarm-fault-e2e",
        taskId: "task-fault-e2e",
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
  if (request.url === "/api/v1/operations/summary") {
    response.end(JSON.stringify(summary));
    return;
  }
  if (request.url === "/api/v1/operations/details") {
    response.end(JSON.stringify(details));
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
    request.url === "/api/v1/alarms/alarm-fault-e2e/acknowledge"
  ) {
    const alarm = details.alarms[0];
    if (!alarm || alarm.status !== "active") {
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
    request.url === "/api/v1/alarms/alarm-fault-e2e/recover"
  ) {
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
    response.end(JSON.stringify(task));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
