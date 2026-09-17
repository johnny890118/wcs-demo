import { describe, expect, it } from "vitest";
import {
  TopologyActivationError,
  TopologyActivationService,
  type TopologyActivationRepository,
} from "../../src/application/topology/topology-activation";
import type { WarehouseTopology } from "../../src/domain/topology/warehouse-topology";

class MemoryTopologyRepository implements TopologyActivationRepository {
  activationCount = 0;

  constructor(public topology: WarehouseTopology | null) {}

  async get(): Promise<WarehouseTopology | null> {
    return this.topology;
  }

  async activate(): Promise<WarehouseTopology> {
    this.activationCount += 1;
    if (!this.topology) throw new Error("missing");
    this.topology = { ...this.topology, status: "active" };
    return this.topology;
  }
}

function draft(): WarehouseTopology {
  return {
    topologyId: "TOPOLOGY-01",
    warehouseId: "WAREHOUSE-01",
    revision: 2,
    status: "draft",
    nodes: [
      { nodeId: "A", kind: "transfer", capabilities: [] },
      { nodeId: "B", kind: "storage", capabilities: [] },
    ],
    edges: [
      {
        edgeId: "A-B",
        fromNodeId: "A",
        toNodeId: "B",
        cost: 1,
        status: "available",
        requiredCapabilities: [],
        resourceIds: [],
      },
    ],
  };
}

describe("topology activation", () => {
  it("activates a valid draft through the persistence boundary", async () => {
    const repository = new MemoryTopologyRepository(draft());
    const result = await new TopologyActivationService(repository).activate(
      "TOPOLOGY-01",
      2,
    );

    expect(result.status).toBe("active");
    expect(repository.activationCount).toBe(1);
  });

  it("does not persist an invalid draft", async () => {
    const repository = new MemoryTopologyRepository({
      ...draft(),
      edges: [{ ...draft().edges[0]!, toNodeId: "MISSING" }],
    });

    await expect(
      new TopologyActivationService(repository).activate("TOPOLOGY-01", 2),
    ).rejects.toBeInstanceOf(TopologyActivationError);
    expect(repository.activationCount).toBe(0);
  });

  it("rejects non-draft and missing topology versions", async () => {
    const active = new MemoryTopologyRepository({
      ...draft(),
      status: "active",
    });
    await expect(
      new TopologyActivationService(active).activate("TOPOLOGY-01", 2),
    ).rejects.toThrow("Only a draft");

    await expect(
      new TopologyActivationService(
        new MemoryTopologyRepository(null),
      ).activate("TOPOLOGY-01", 2),
    ).rejects.toThrow("was not found");
  });
});
