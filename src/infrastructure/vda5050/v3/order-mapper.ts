import type { RoutePlan } from "../../../domain/topology/route-planner";
import type { WarehouseTopology } from "../../../domain/topology/warehouse-topology";
import {
  vda5050Version,
  type Vda5050Edge,
  type Vda5050Node,
  type Vda5050Order,
} from "./messages";

export type Vda5050OrderIdentity = Readonly<{
  headerId: number;
  timestamp: string;
  manufacturer: string;
  serialNumber: string;
  orderId: string;
  orderUpdateId: number;
}>;

export function mapRoutePlanToVda5050Order(
  topology: WarehouseTopology,
  plan: RoutePlan,
  identity: Vda5050OrderIdentity,
): Vda5050Order {
  validateIdentity(identity);
  if (
    plan.topologyId !== topology.topologyId ||
    plan.topologyRevision !== topology.revision
  ) {
    throw new Error("Route plan does not match the supplied topology version.");
  }
  if (plan.nodeIds.length !== plan.edgeIds.length + 1) {
    throw new Error("Route plan must alternate nodes and edges.");
  }

  const nodesById = new Map(topology.nodes.map((node) => [node.nodeId, node]));
  const edgesById = new Map(topology.edges.map((edge) => [edge.edgeId, edge]));
  const nodes: Vda5050Node[] = plan.nodeIds.map((nodeId, index) => {
    const node = nodesById.get(nodeId);
    if (!node) throw new Error(`Route references unknown node ${nodeId}.`);
    return {
      nodeId,
      sequenceId: index * 2,
      released: true,
      actions: [],
      ...(node.position
        ? {
            nodePosition: {
              x: node.position.x,
              y: node.position.y,
              mapId: node.position.coordinateSystem,
            },
          }
        : {}),
    };
  });
  const edges: Vda5050Edge[] = plan.edgeIds.map((edgeId, index) => {
    const edge = edgesById.get(edgeId);
    const from = plan.nodeIds[index];
    const to = plan.nodeIds[index + 1];
    if (!edge || edge.fromNodeId !== from || edge.toNodeId !== to) {
      throw new Error(
        `Route edge ${edgeId} does not connect its adjacent nodes.`,
      );
    }
    return {
      edgeId,
      sequenceId: index * 2 + 1,
      released: true,
      actions: [],
    };
  });

  return { ...identity, version: vda5050Version, nodes, edges };
}

function validateIdentity(identity: Vda5050OrderIdentity): void {
  for (const [name, value] of [
    ["manufacturer", identity.manufacturer],
    ["serialNumber", identity.serialNumber],
    ["orderId", identity.orderId],
  ] as const) {
    if (value.trim().length === 0)
      throw new Error(`${name} must not be empty.`);
  }
  if (!Number.isSafeInteger(identity.headerId) || identity.headerId < 0) {
    throw new Error("headerId must be a non-negative integer.");
  }
  if (
    !Number.isSafeInteger(identity.orderUpdateId) ||
    identity.orderUpdateId < 0
  ) {
    throw new Error("orderUpdateId must be a non-negative integer.");
  }
  if (!Number.isFinite(Date.parse(identity.timestamp))) {
    throw new Error("timestamp must be an ISO 8601 date-time.");
  }
}
