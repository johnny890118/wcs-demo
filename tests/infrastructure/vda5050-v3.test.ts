import { describe, expect, it, vi } from "vitest";
import { EquipmentLinkSupervisor } from "../../src/application/equipment/equipment-link-supervisor";
import type { RoutePlan } from "../../src/domain/topology/route-planner";
import type { WarehouseTopology } from "../../src/domain/topology/warehouse-topology";
import { createEquipmentState } from "../../src/domain/equipment/equipment-state-machine";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import {
  vda5050Topic,
  type Vda5050Connection,
} from "../../src/infrastructure/vda5050/v3/messages";
import { mapRoutePlanToVda5050Order } from "../../src/infrastructure/vda5050/v3/order-mapper";
import {
  Vda5050ConnectionConsumer,
  Vda5050OrderPublisher,
} from "../../src/infrastructure/vda5050/v3/protocol-boundary";

const topology: WarehouseTopology = {
  topologyId: "TOPOLOGY-01",
  warehouseId: "WAREHOUSE-01",
  revision: 7,
  status: "active",
  nodes: [
    {
      nodeId: "RECEIVING-01",
      kind: "receiving",
      capabilities: [],
      position: { coordinateSystem: "WAREHOUSE-MAP", x: 1, y: 2 },
    },
    { nodeId: "STORAGE-01", kind: "storage", capabilities: [] },
  ],
  edges: [
    {
      edgeId: "RECEIVING-TO-STORAGE",
      fromNodeId: "RECEIVING-01",
      toNodeId: "STORAGE-01",
      cost: 1,
      status: "available",
      requiredCapabilities: [],
      resourceIds: [],
    },
  ],
};
const plan: RoutePlan = {
  topologyId: "TOPOLOGY-01",
  topologyRevision: 7,
  nodeIds: ["RECEIVING-01", "STORAGE-01"],
  edgeIds: ["RECEIVING-TO-STORAGE"],
  totalCost: 1,
};
const identity = {
  headerId: 42,
  timestamp: "2026-09-19T00:00:00.000Z",
  manufacturer: "Example-Robotics",
  serialNumber: "AMR-01",
  orderId: "TASK-01",
  orderUpdateId: 0,
};

describe("VDA 5050 v3 reference boundary", () => {
  it("maps a validated core route into alternating released nodes and edges", () => {
    expect(mapRoutePlanToVda5050Order(topology, plan, identity)).toEqual({
      ...identity,
      version: "3.0.0",
      nodes: [
        {
          nodeId: "RECEIVING-01",
          sequenceId: 0,
          released: true,
          actions: [],
          nodePosition: { x: 1, y: 2, mapId: "WAREHOUSE-MAP" },
        },
        { nodeId: "STORAGE-01", sequenceId: 2, released: true, actions: [] },
      ],
      edges: [
        {
          edgeId: "RECEIVING-TO-STORAGE",
          sequenceId: 1,
          released: true,
          actions: [],
        },
      ],
    });
  });

  it("publishes the order to the v3 device topic without making it domain truth", async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    await new Vda5050OrderPublisher({ publish }).publish(
      topology,
      plan,
      identity,
    );
    expect(publish).toHaveBeenCalledWith(
      "vda5050/v3/Example-Robotics/AMR-01/order",
      expect.objectContaining({ orderId: "TASK-01", version: "3.0.0" }),
      { qos: 0, retain: false },
    );
  });

  it("rejects topology drift and unsafe topic segments", () => {
    expect(() =>
      mapRoutePlanToVda5050Order(
        topology,
        { ...plan, topologyRevision: 8 },
        identity,
      ),
    ).toThrow(/topology version/);
    expect(() => vda5050Topic("vendor/escape", "AMR-01", "order")).toThrow(
      /unsafe/,
    );
  });

  it("maps retained connection events into fail-closed link state", () => {
    const supervisor = new EquipmentLinkSupervisor(new ManualClock(), 30_000);
    const consumer = new Vda5050ConnectionConsumer(supervisor, [
      {
        equipmentId: "AMR-01",
        manufacturer: "Example-Robotics",
        serialNumber: "AMR-01",
      },
    ]);
    const connection = (
      headerId: number,
      connectionState: Vda5050Connection["connectionState"],
    ): Vda5050Connection => ({
      headerId,
      timestamp: "2026-09-19T00:00:00.000Z",
      version: "3.0.0",
      manufacturer: "Example-Robotics",
      serialNumber: "AMR-01",
      connectionState,
    });

    consumer.consume("AMR-01", connection(1, "ONLINE"));
    supervisor.observe(createEquipmentState("AMR-01", "idle"));
    expect(supervisor.assess("AMR-01").status).toBe("current");
    consumer.consume("AMR-01", connection(2, "CONNECTION_BROKEN"));
    expect(supervisor.assess("AMR-01")).toEqual({
      status: "disconnected",
      lastObservedAt: 0,
    });
    expect(() => consumer.consume("AMR-01", connection(2, "ONLINE"))).toThrow(
      /monotonically/,
    );
  });
});
