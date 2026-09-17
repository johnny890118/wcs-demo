import {
  validateTopology,
  type TopologyEdge,
  type WarehouseTopology,
} from "./warehouse-topology";

export type RouteRuntimeState = Readonly<{
  blockedEdgeIds: ReadonlySet<string>;
  unavailableResourceIds: ReadonlySet<string>;
}>;

export type RouteRequest = Readonly<{
  fromNodeId: string;
  toNodeId: string;
  equipmentCapabilities: ReadonlySet<string>;
  runtime: RouteRuntimeState;
}>;

export type RouteConstraintEvaluator = (
  edge: TopologyEdge,
  request: RouteRequest,
) => boolean;

export type RoutePlan = Readonly<{
  topologyId: string;
  topologyRevision: number;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  totalCost: number;
}>;

export type RoutePlanningResult =
  | { found: true; plan: RoutePlan }
  | {
      found: false;
      code: "INVALID_TOPOLOGY" | "UNKNOWN_ENDPOINT" | "NO_ROUTE";
      message: string;
    };

function edgeIsAvailable(edge: TopologyEdge, request: RouteRequest): boolean {
  return (
    edge.status === "available" &&
    !request.runtime.blockedEdgeIds.has(edge.edgeId) &&
    edge.requiredCapabilities.every((capability) =>
      request.equipmentCapabilities.has(capability),
    ) &&
    edge.resourceIds.every(
      (resourceId) => !request.runtime.unavailableResourceIds.has(resourceId),
    )
  );
}

export function planRoute(
  topology: WarehouseTopology,
  request: RouteRequest,
  additionalEvaluators: readonly RouteConstraintEvaluator[] = [],
): RoutePlanningResult {
  const issues = validateTopology(topology);
  if (issues.length > 0) {
    return {
      found: false,
      code: "INVALID_TOPOLOGY",
      message: issues[0]?.message ?? "Topology is invalid.",
    };
  }

  const nodeIds = new Set(topology.nodes.map((node) => node.nodeId));
  if (!nodeIds.has(request.fromNodeId) || !nodeIds.has(request.toNodeId)) {
    return {
      found: false,
      code: "UNKNOWN_ENDPOINT",
      message: "Route endpoints must exist in the selected topology version.",
    };
  }
  if (request.fromNodeId === request.toNodeId) {
    return {
      found: true,
      plan: {
        topologyId: topology.topologyId,
        topologyRevision: topology.revision,
        nodeIds: [request.fromNodeId],
        edgeIds: [],
        totalCost: 0,
      },
    };
  }

  const outgoing = new Map<string, TopologyEdge[]>();
  for (const edge of topology.edges) {
    if (
      !edgeIsAvailable(edge, request) ||
      additionalEvaluators.some((evaluate) => !evaluate(edge, request))
    ) {
      continue;
    }
    const list = outgoing.get(edge.fromNodeId) ?? [];
    list.push(edge);
    list.sort((left, right) => left.edgeId.localeCompare(right.edgeId));
    outgoing.set(edge.fromNodeId, list);
  }

  const distance = new Map<string, number>([[request.fromNodeId, 0]]);
  const previous = new Map<string, TopologyEdge>();
  const unvisited = new Set(nodeIds);

  while (unvisited.size > 0) {
    const current = [...unvisited]
      .filter((nodeId) => distance.has(nodeId))
      .sort(
        (left, right) =>
          (distance.get(left) ?? Infinity) -
            (distance.get(right) ?? Infinity) || left.localeCompare(right),
      )[0];
    if (!current) break;
    if (current === request.toNodeId) break;
    unvisited.delete(current);

    for (const edge of outgoing.get(current) ?? []) {
      if (!unvisited.has(edge.toNodeId)) continue;
      const candidate = (distance.get(current) ?? Infinity) + edge.cost;
      const known = distance.get(edge.toNodeId) ?? Infinity;
      if (
        candidate < known ||
        (candidate === known &&
          edge.edgeId < (previous.get(edge.toNodeId)?.edgeId ?? "\uffff"))
      ) {
        distance.set(edge.toNodeId, candidate);
        previous.set(edge.toNodeId, edge);
      }
    }
  }

  if (!previous.has(request.toNodeId)) {
    return {
      found: false,
      code: "NO_ROUTE",
      message: "No route satisfies current topology and runtime constraints.",
    };
  }

  const edges: TopologyEdge[] = [];
  let cursor = request.toNodeId;
  while (cursor !== request.fromNodeId) {
    const edge = previous.get(cursor);
    if (!edge) {
      return {
        found: false,
        code: "NO_ROUTE",
        message: "Route reconstruction failed.",
      };
    }
    edges.unshift(edge);
    cursor = edge.fromNodeId;
  }

  return {
    found: true,
    plan: {
      topologyId: topology.topologyId,
      topologyRevision: topology.revision,
      nodeIds: [request.fromNodeId, ...edges.map((edge) => edge.toNodeId)],
      edgeIds: edges.map((edge) => edge.edgeId),
      totalCost: distance.get(request.toNodeId) ?? 0,
    },
  };
}
