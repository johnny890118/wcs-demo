export type OperationsDetails = Readonly<{
  tasks: readonly Readonly<{
    taskId: string;
    status: string;
    source: string;
    destination: string;
    equipmentId: string | null;
    updatedAt: string;
  }>[];
  equipment: readonly Readonly<{
    equipmentId: string;
    adapterKey: string;
    capabilities: readonly string[];
    active: boolean;
  }>[];
  inventory: readonly Readonly<{
    inventoryUnitId: string;
    sku: string;
    quantity: number;
    location: string;
    status: string;
    updatedAt: string;
  }>[];
  alarms: readonly Readonly<{
    alarmId: string;
    taskId: string;
    equipmentId: string;
    code: string;
    severity: string;
    message: string;
    status: string;
    raisedAt: string;
    acknowledgedAt: string | null;
    clearedAt: string | null;
    resolution: string | null;
  }>[];
  topology: Readonly<{
    topologyId: string;
    revision: number;
    nodes: readonly Readonly<{
      nodeId: string;
      kind: string;
      capabilities: readonly string[];
    }>[];
    edges: readonly Readonly<{
      edgeId: string;
      fromNodeId: string;
      toNodeId: string;
      status: string;
      requiredCapabilities: readonly string[];
      resourceIds: readonly string[];
    }>[];
  }> | null;
  generatedAt: string;
}>;

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function isOperationsDetails(
  value: unknown,
): value is OperationsDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.equipment) ||
    !Array.isArray(data.inventory) ||
    !Array.isArray(data.alarms) ||
    typeof data.generatedAt !== "string" ||
    Number.isNaN(Date.parse(data.generatedAt))
  ) {
    return false;
  }

  const tasksAreValid = data.tasks.every((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const task = item as Record<string, unknown>;
    return (
      typeof task.taskId === "string" &&
      typeof task.status === "string" &&
      typeof task.source === "string" &&
      typeof task.destination === "string" &&
      (task.equipmentId === null || typeof task.equipmentId === "string") &&
      typeof task.updatedAt === "string" &&
      !Number.isNaN(Date.parse(task.updatedAt))
    );
  });
  const equipmentIsValid = data.equipment.every((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const equipment = item as Record<string, unknown>;
    return (
      typeof equipment.equipmentId === "string" &&
      typeof equipment.adapterKey === "string" &&
      isStringArray(equipment.capabilities) &&
      typeof equipment.active === "boolean"
    );
  });
  const inventoryIsValid = data.inventory.every((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const inventory = item as Record<string, unknown>;
    return (
      typeof inventory.inventoryUnitId === "string" &&
      typeof inventory.sku === "string" &&
      typeof inventory.quantity === "number" &&
      Number.isSafeInteger(inventory.quantity) &&
      inventory.quantity > 0 &&
      typeof inventory.location === "string" &&
      typeof inventory.status === "string" &&
      typeof inventory.updatedAt === "string" &&
      !Number.isNaN(Date.parse(inventory.updatedAt))
    );
  });
  const alarmsAreValid = data.alarms.every((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const alarm = item as Record<string, unknown>;
    return (
      typeof alarm.alarmId === "string" &&
      typeof alarm.taskId === "string" &&
      typeof alarm.equipmentId === "string" &&
      typeof alarm.code === "string" &&
      typeof alarm.severity === "string" &&
      typeof alarm.message === "string" &&
      typeof alarm.status === "string" &&
      typeof alarm.raisedAt === "string" &&
      !Number.isNaN(Date.parse(alarm.raisedAt)) &&
      (alarm.acknowledgedAt === null ||
        (typeof alarm.acknowledgedAt === "string" &&
          !Number.isNaN(Date.parse(alarm.acknowledgedAt)))) &&
      (alarm.clearedAt === null ||
        (typeof alarm.clearedAt === "string" &&
          !Number.isNaN(Date.parse(alarm.clearedAt)))) &&
      (alarm.resolution === null || typeof alarm.resolution === "string")
    );
  });

  const topology = data.topology as Record<string, unknown> | null;
  const topologyIsValid =
    topology === null ||
    (typeof topology === "object" &&
      !Array.isArray(topology) &&
      typeof topology.topologyId === "string" &&
      typeof topology.revision === "number" &&
      Number.isSafeInteger(topology.revision) &&
      topology.revision > 0 &&
      Array.isArray(topology.nodes) &&
      topology.nodes.every((item: unknown) => {
        if (!item || typeof item !== "object" || Array.isArray(item))
          return false;
        const node = item as Record<string, unknown>;
        return (
          typeof node.nodeId === "string" &&
          typeof node.kind === "string" &&
          isStringArray(node.capabilities)
        );
      }) &&
      Array.isArray(topology.edges) &&
      topology.edges.every((item: unknown) => {
        if (!item || typeof item !== "object" || Array.isArray(item))
          return false;
        const edge = item as Record<string, unknown>;
        return (
          typeof edge.edgeId === "string" &&
          typeof edge.fromNodeId === "string" &&
          typeof edge.toNodeId === "string" &&
          typeof edge.status === "string" &&
          isStringArray(edge.requiredCapabilities) &&
          isStringArray(edge.resourceIds)
        );
      }));

  return (
    tasksAreValid &&
    equipmentIsValid &&
    inventoryIsValid &&
    alarmsAreValid &&
    topologyIsValid
  );
}
