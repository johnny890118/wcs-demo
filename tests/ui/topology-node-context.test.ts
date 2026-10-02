import { describe, expect, it } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { topologyNodeContext } from "../../src/ui/warehouse/topology-node-context";

const details: OperationsDetails = {
  generatedAt: "2026-10-03T00:00:00Z",
  topology: {
    topologyId: "topology",
    revision: 2,
    nodes: [{ nodeId: "node", kind: "storage", capabilities: [] }],
    edges: [],
  },
  locations: [
    {
      locationId: "bound",
      code: "READABLE",
      kind: "storage",
      status: "available",
      capabilities: [],
      activeNodeId: "node",
    },
    {
      locationId: "unbound",
      code: "node",
      kind: "storage",
      status: "available",
      capabilities: [],
      activeNodeId: null,
    },
  ],
  tasks: [
    {
      taskId: "active",
      status: "unknown",
      source: "READABLE",
      destination: "other",
      equipmentId: null,
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      taskId: "matching-label",
      status: "assigned",
      source: "node",
      destination: "other",
      equipmentId: null,
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      taskId: "terminal",
      status: "completed",
      source: "READABLE",
      destination: "other",
      equipmentId: null,
      updatedAt: "2026-10-03T00:00:00Z",
    },
  ],
  inventory: [
    {
      inventoryUnitId: "one",
      sku: "one",
      quantity: 12,
      location: "READABLE",
      status: "available",
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      inventoryUnitId: "two",
      sku: "two",
      quantity: 99,
      location: "READABLE",
      status: "quarantined",
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      inventoryUnitId: "shipped",
      sku: "one",
      quantity: 10,
      location: "READABLE",
      status: "shipped",
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      inventoryUnitId: "matching-label",
      sku: "one",
      quantity: 3,
      location: "node",
      status: "available",
      updatedAt: "2026-10-03T00:00:00Z",
    },
  ],
  equipment: [],
  alarms: [],
};
describe("topology display evidence", () => {
  it("uses only explicit active bindings and counts non-shipped records, never mixed SKU quantity", () => {
    const context = topologyNodeContext(details, "node");
    expect(context.locations.map((item) => item.code)).toEqual(["READABLE"]);
    expect(context.tasks.map((item) => item.taskId)).toEqual(["active"]);
    expect(context.stockRecords).toBe(2);
  });
  it("does not correlate an absent topology or node", () => {
    expect(topologyNodeContext({ ...details, topology: null }, "node")).toEqual(
      { locations: [], tasks: [], stockRecords: 0 },
    );
    expect(topologyNodeContext(details, "READABLE").stockRecords).toBe(0);
  });
});
