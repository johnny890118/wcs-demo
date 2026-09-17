export type TopologyNode = Readonly<{
  nodeId: string;
  kind: string;
  capabilities: readonly string[];
  position?: Readonly<{
    coordinateSystem: string;
    x: number;
    y: number;
    z?: number;
  }>;
  attributes?: Readonly<Record<string, unknown>>;
}>;

export type TopologyEdge = Readonly<{
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  cost: number;
  status: "available" | "blocked";
  requiredCapabilities: readonly string[];
  resourceIds: readonly string[];
  geometry?: Readonly<Record<string, unknown>>;
  attributes?: Readonly<Record<string, unknown>>;
}>;

export type WarehouseTopology = Readonly<{
  topologyId: string;
  warehouseId: string;
  revision: number;
  status: "draft" | "active" | "retired";
  nodes: readonly TopologyNode[];
  edges: readonly TopologyEdge[];
}>;

export type TopologyValidationIssue = Readonly<{
  code:
    | "EMPTY_VALUE"
    | "DUPLICATE_NODE"
    | "DUPLICATE_EDGE"
    | "MISSING_NODE"
    | "INVALID_COST"
    | "SELF_EDGE"
    | "INVALID_REVISION"
    | "EMPTY_TOPOLOGY"
    | "INVALID_POSITION"
    | "DUPLICATE_CAPABILITY";
  path: string;
  message: string;
}>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function validateCapabilities(
  capabilities: readonly string[],
  path: string,
): TopologyValidationIssue[] {
  const issues: TopologyValidationIssue[] = [];
  const seen = new Set<string>();
  capabilities.forEach((capability, index) => {
    if (isBlank(capability)) {
      issues.push({
        code: "EMPTY_VALUE",
        path: `${path}[${index}]`,
        message: "Capability identifiers must not be empty.",
      });
    } else if (seen.has(capability)) {
      issues.push({
        code: "DUPLICATE_CAPABILITY",
        path: `${path}[${index}]`,
        message: `Capability ${capability} is duplicated.`,
      });
    }
    seen.add(capability);
  });
  return issues;
}

export function validateTopology(
  topology: WarehouseTopology,
): readonly TopologyValidationIssue[] {
  const issues: TopologyValidationIssue[] = [];
  if (isBlank(topology.topologyId)) {
    issues.push({
      code: "EMPTY_VALUE",
      path: "topologyId",
      message: "topologyId must not be empty.",
    });
  }
  if (isBlank(topology.warehouseId)) {
    issues.push({
      code: "EMPTY_VALUE",
      path: "warehouseId",
      message: "warehouseId must not be empty.",
    });
  }
  if (!Number.isSafeInteger(topology.revision) || topology.revision < 1) {
    issues.push({
      code: "INVALID_REVISION",
      path: "revision",
      message: "Topology revision must be a positive integer.",
    });
  }
  if (topology.nodes.length === 0) {
    issues.push({
      code: "EMPTY_TOPOLOGY",
      path: "nodes",
      message: "A topology must contain at least one node.",
    });
  }

  const nodeIds = new Set<string>();
  topology.nodes.forEach((node, index) => {
    if (isBlank(node.nodeId) || isBlank(node.kind)) {
      issues.push({
        code: "EMPTY_VALUE",
        path: `nodes[${index}]`,
        message: "Node identifiers and kinds must not be empty.",
      });
    }
    if (nodeIds.has(node.nodeId)) {
      issues.push({
        code: "DUPLICATE_NODE",
        path: `nodes[${index}].nodeId`,
        message: `Node ${node.nodeId} is duplicated.`,
      });
    }
    nodeIds.add(node.nodeId);
    if (
      node.position &&
      (isBlank(node.position.coordinateSystem) ||
        !Number.isFinite(node.position.x) ||
        !Number.isFinite(node.position.y) ||
        (node.position.z !== undefined && !Number.isFinite(node.position.z)))
    ) {
      issues.push({
        code: "INVALID_POSITION",
        path: `nodes[${index}].position`,
        message:
          "Node positions require a coordinate system and finite coordinates.",
      });
    }
    issues.push(
      ...validateCapabilities(
        node.capabilities,
        `nodes[${index}].capabilities`,
      ),
    );
  });

  const edgeIds = new Set<string>();
  topology.edges.forEach((edge, index) => {
    if (isBlank(edge.edgeId)) {
      issues.push({
        code: "EMPTY_VALUE",
        path: `edges[${index}].edgeId`,
        message: "Edge identifiers must not be empty.",
      });
    }
    if (edgeIds.has(edge.edgeId)) {
      issues.push({
        code: "DUPLICATE_EDGE",
        path: `edges[${index}].edgeId`,
        message: `Edge ${edge.edgeId} is duplicated.`,
      });
    }
    edgeIds.add(edge.edgeId);
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      issues.push({
        code: "MISSING_NODE",
        path: `edges[${index}]`,
        message: `Edge ${edge.edgeId} references an unknown node.`,
      });
    }
    if (edge.fromNodeId === edge.toNodeId) {
      issues.push({
        code: "SELF_EDGE",
        path: `edges[${index}]`,
        message: `Edge ${edge.edgeId} must connect different nodes.`,
      });
    }
    if (!Number.isFinite(edge.cost) || edge.cost <= 0) {
      issues.push({
        code: "INVALID_COST",
        path: `edges[${index}].cost`,
        message: `Edge ${edge.edgeId} cost must be greater than zero.`,
      });
    }
    issues.push(
      ...validateCapabilities(
        edge.requiredCapabilities,
        `edges[${index}].requiredCapabilities`,
      ),
    );
  });

  return issues;
}
