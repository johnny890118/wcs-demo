import type { OperationsDetails } from "../../application/operations/operations-details";

type Topology = NonNullable<OperationsDetails["topology"]>;
type TopologyNode = Topology["nodes"][number];

export const topologyCanvas = Object.freeze({ width: 960, height: 540 });

export type TopologyLayout = Readonly<{
  mode: "configured" | "schematic";
  coordinateSystem: string | null;
  nodes: readonly Readonly<{
    node: TopologyNode;
    x: number;
    y: number;
  }>[];
}>;

export type CanvasPoint = Readonly<{ x: number; y: number }>;

const padding = 84;

function scale(
  value: number,
  minimum: number,
  maximum: number,
  start: number,
  end: number,
): number {
  if (minimum === maximum) return (start + end) / 2;
  return start + ((value - minimum) / (maximum - minimum)) * (end - start);
}

export function insetEdgeSegment(
  from: CanvasPoint,
  to: CanvasPoint,
  inset = 36,
): Readonly<{ x1: number; y1: number; x2: number; y2: number }> {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= inset * 2 || distance === 0) {
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  }
  const unitX = deltaX / distance;
  const unitY = deltaY / distance;
  return {
    x1: from.x + unitX * inset,
    y1: from.y + unitY * inset,
    x2: to.x - unitX * inset,
    y2: to.y - unitY * inset,
  };
}

export function buildTopologyLayout(topology: Topology): TopologyLayout {
  const nodes = [...topology.nodes].sort((left, right) =>
    left.nodeId.localeCompare(right.nodeId),
  );
  const positioned = nodes.every((node) => node.position !== undefined);
  const coordinateSystems = new Set(
    nodes.flatMap((node) =>
      node.position ? [node.position.coordinateSystem] : [],
    ),
  );

  if (positioned && coordinateSystems.size === 1) {
    const xValues = nodes.map((node) => node.position!.x);
    const yValues = nodes.map((node) => node.position!.y);
    const minimumX = Math.min(...xValues);
    const maximumX = Math.max(...xValues);
    const minimumY = Math.min(...yValues);
    const maximumY = Math.max(...yValues);

    return {
      mode: "configured",
      coordinateSystem: [...coordinateSystems][0] ?? null,
      nodes: nodes.map((node) => ({
        node,
        x: scale(
          node.position!.x,
          minimumX,
          maximumX,
          padding,
          topologyCanvas.width - padding,
        ),
        y: scale(
          node.position!.y,
          minimumY,
          maximumY,
          topologyCanvas.height - padding,
          padding,
        ),
      })),
    };
  }

  const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length * (16 / 9))));
  const rows = Math.max(1, Math.ceil(nodes.length / columns));

  return {
    mode: "schematic",
    coordinateSystem: null,
    nodes: nodes.map((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        node,
        x: scale(
          column,
          0,
          Math.max(columns - 1, 0),
          padding,
          topologyCanvas.width - padding,
        ),
        y: scale(
          row,
          0,
          Math.max(rows - 1, 0),
          padding,
          topologyCanvas.height - padding,
        ),
      };
    }),
  };
}
