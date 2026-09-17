import { createServer } from "node:http";

const port = Number(process.env.MOCK_WCS_PORT ?? "3101");
const token = process.env.API_SERVICE_TOKEN;
if (!token) throw new Error("API_SERVICE_TOKEN is required for the E2E mock.");

const generatedAt = "2026-09-18T08:00:00.000Z";
const summary = {
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
const details = {
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
  topology: {
    topologyId: "warehouse-alpha",
    revision: 3,
    nodes: [
      {
        nodeId: "receiving-01",
        kind: "receiving",
        capabilities: ["transfer"],
      },
      {
        nodeId: "storage-01",
        kind: "storage",
        capabilities: ["store"],
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

const server = createServer((request, response) => {
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
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
