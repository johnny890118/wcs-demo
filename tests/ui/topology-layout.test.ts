import { describe, expect, it } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { isOperationsDetails } from "../../src/application/operations/operations-details";
import {
  buildTopologyLayout,
  insetEdgeSegment,
  topologyCanvas,
} from "../../src/ui/warehouse/topology-layout";

type Topology = NonNullable<OperationsDetails["topology"]>;

const configuredTopology: Topology = {
  topologyId: "TOPOLOGY-01",
  revision: 1,
  nodes: [
    {
      nodeId: "B",
      kind: "storage",
      capabilities: [],
      position: { coordinateSystem: "warehouse-mm", x: 100, y: 50 },
    },
    {
      nodeId: "A",
      kind: "transfer",
      capabilities: [],
      position: { coordinateSystem: "warehouse-mm", x: 0, y: 0 },
    },
  ],
  edges: [
    {
      edgeId: "A-B",
      fromNodeId: "A",
      toNodeId: "B",
      status: "available",
      requiredCapabilities: [],
      resourceIds: [],
    },
  ],
};

describe("topology presentation layout", () => {
  it("normalizes configured coordinates without changing node identity", () => {
    const layout = buildTopologyLayout(configuredTopology);

    expect(layout.mode).toBe("configured");
    expect(layout.coordinateSystem).toBe("warehouse-mm");
    expect(layout.nodes.map((item) => item.node.nodeId)).toEqual(["A", "B"]);
    expect(layout.nodes[0]).toMatchObject({ x: 84, y: 456 });
    expect(layout.nodes[1]).toMatchObject({ x: 876, y: 84 });
  });

  it("uses a deterministic schematic when coordinates are incomplete", () => {
    const topology: Topology = {
      ...configuredTopology,
      nodes: configuredTopology.nodes.map((node, index) =>
        index === 0 ? { ...node, position: undefined } : node,
      ),
    };

    const first = buildTopologyLayout(topology);
    const second = buildTopologyLayout(topology);

    expect(first.mode).toBe("schematic");
    expect(first.coordinateSystem).toBeNull();
    expect(first).toEqual(second);
    first.nodes.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(topologyCanvas.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(topologyCanvas.height);
    });
  });

  it("rejects non-finite projection coordinates at the browser boundary", () => {
    const payload: OperationsDetails = {
      tasks: [],
      equipment: [],
      inventory: [],
      alarms: [],
      locations: [],
      topology: configuredTopology,
      generatedAt: "2026-09-19T00:00:00.000Z",
    };

    expect(isOperationsDetails(payload)).toBe(true);
    expect(
      isOperationsDetails({
        ...payload,
        topology: {
          ...configuredTopology,
          nodes: [
            {
              ...configuredTopology.nodes[0],
              position: {
                coordinateSystem: "warehouse-mm",
                x: Number.POSITIVE_INFINITY,
                y: 0,
              },
            },
          ],
        },
      }),
    ).toBe(false);
    expect(
      isOperationsDetails({
        ...payload,
        topology: {
          ...configuredTopology,
          nodes: [{ ...configuredTopology.nodes[0], position: null }],
        },
      }),
    ).toBe(false);
  });

  it("ends directed edges outside node centers so arrowheads remain visible", () => {
    expect(insetEdgeSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)).toEqual({
      x1: 20,
      y1: 0,
      x2: 80,
      y2: 0,
    });
  });
});
