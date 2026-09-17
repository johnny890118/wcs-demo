import { describe, expect, it } from "vitest";
import { planRoute } from "../../src/domain/topology/route-planner";
import {
  validateTopology,
  type WarehouseTopology,
} from "../../src/domain/topology/warehouse-topology";

function topology(
  overrides: Partial<WarehouseTopology> = {},
): WarehouseTopology {
  return {
    topologyId: "TOPOLOGY-01",
    warehouseId: "WAREHOUSE-01",
    revision: 1,
    status: "active",
    nodes: [
      { nodeId: "A", kind: "transfer", capabilities: [] },
      { nodeId: "B", kind: "junction", capabilities: [] },
      { nodeId: "C", kind: "storage", capabilities: [] },
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
      {
        edgeId: "B-C",
        fromNodeId: "B",
        toNodeId: "C",
        cost: 1,
        status: "available",
        requiredCapabilities: [],
        resourceIds: [],
      },
      {
        edgeId: "A-C",
        fromNodeId: "A",
        toNodeId: "C",
        cost: 5,
        status: "available",
        requiredCapabilities: ["access.restricted"],
        resourceIds: ["LIFT-01"],
      },
    ],
    ...overrides,
  };
}

function request(
  overrides: Partial<Parameters<typeof planRoute>[1]> = {},
): Parameters<typeof planRoute>[1] {
  return {
    fromNodeId: "A",
    toNodeId: "C",
    equipmentCapabilities: new Set<string>(),
    runtime: {
      blockedEdgeIds: new Set<string>(),
      unavailableResourceIds: new Set<string>(),
    },
    ...overrides,
  };
}

describe("warehouse topology route planner", () => {
  it("treats every edge as directed", () => {
    expect(planRoute(topology(), request()).found).toBe(true);
    expect(
      planRoute(topology(), request({ fromNodeId: "C", toNodeId: "A" })),
    ).toMatchObject({ found: false, code: "NO_ROUTE" });
  });

  it("reroutes around a runtime closure", () => {
    const result = planRoute(
      topology({
        edges: [
          ...topology().edges,
          {
            edgeId: "A-D",
            fromNodeId: "A",
            toNodeId: "D",
            cost: 2,
            status: "available",
            requiredCapabilities: [],
            resourceIds: [],
          },
          {
            edgeId: "D-C",
            fromNodeId: "D",
            toNodeId: "C",
            cost: 2,
            status: "available",
            requiredCapabilities: [],
            resourceIds: [],
          },
        ],
        nodes: [
          ...topology().nodes,
          { nodeId: "D", kind: "junction", capabilities: [] },
        ],
      }),
      request({
        runtime: {
          blockedEdgeIds: new Set(["B-C"]),
          unavailableResourceIds: new Set<string>(),
        },
      }),
    );

    expect(result).toMatchObject({
      found: true,
      plan: { edgeIds: ["A-D", "D-C"], totalCost: 4 },
    });
  });

  it("filters routes by equipment capability and resource availability", () => {
    const capable = request({
      equipmentCapabilities: new Set(["access.restricted"]),
    });
    expect(planRoute(topology(), capable)).toMatchObject({
      found: true,
      plan: { edgeIds: ["A-B", "B-C"], totalCost: 2 },
    });

    const onlyRestrictedPath = topology({
      edges: [topology().edges[2]!],
    });
    expect(planRoute(onlyRestrictedPath, request())).toMatchObject({
      found: false,
      code: "NO_ROUTE",
    });
    expect(
      planRoute(
        onlyRestrictedPath,
        request({
          equipmentCapabilities: new Set(["access.restricted"]),
          runtime: {
            blockedEdgeIds: new Set<string>(),
            unavailableResourceIds: new Set(["LIFT-01"]),
          },
        }),
      ),
    ).toMatchObject({ found: false, code: "NO_ROUTE" });
  });

  it("does not use presentation coordinates or geometry as routing truth", () => {
    const visualized = topology({
      nodes: topology().nodes.map((node, index) => ({
        ...node,
        position: {
          coordinateSystem: "demo-svg",
          x: index === 1 ? 99_999 : -index,
          y: index * 42,
        },
      })),
      edges: topology().edges.map((edge) => ({
        ...edge,
        geometry: { path: "M 999 999 L 0 0" },
      })),
    });

    expect(planRoute(visualized, request())).toEqual(
      planRoute(topology(), request()),
    );
  });

  it("rejects invalid references, duplicates, empty graphs, and invalid positions", () => {
    const issues = validateTopology(
      topology({
        nodes: [
          {
            nodeId: "A",
            kind: "transfer",
            capabilities: ["load.pickup", "load.pickup"],
            position: { coordinateSystem: "", x: Number.NaN, y: 0 },
          },
          { nodeId: "A", kind: "duplicate", capabilities: [] },
        ],
        edges: [
          {
            edgeId: "A-X",
            fromNodeId: "A",
            toNodeId: "X",
            cost: 0,
            status: "available",
            requiredCapabilities: [],
            resourceIds: [],
          },
        ],
      }),
    );

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "DUPLICATE_NODE",
        "DUPLICATE_CAPABILITY",
        "INVALID_POSITION",
        "MISSING_NODE",
        "INVALID_COST",
      ]),
    );
    expect(
      validateTopology(topology({ nodes: [], edges: [] })).map(
        (issue) => issue.code,
      ),
    ).toContain("EMPTY_TOPOLOGY");
  });
});
