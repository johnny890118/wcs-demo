import { equipmentStatuses } from "../../domain/equipment/equipment-state-machine";

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
    telemetry: Readonly<{
      status: string;
      taskId: string | null;
      loadId: string | null;
      faultCode: string | null;
      topologyId: string | null;
      topologyRevision: number | null;
      nodeId: string | null;
      connectionStatus: "connected" | "disconnected";
      quality: "good" | "uncertain" | "bad" | "unknown";
      freshness: "current" | "stale";
      ageMs: number;
      sequence: number;
      observedAt: string;
      receivedAt: string;
      source: string;
    }> | null;
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
      position?: Readonly<{
        coordinateSystem: string;
        x: number;
        y: number;
        z?: number;
      }>;
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
    const telemetry = equipment.telemetry as Record<string, unknown> | null;
    const telemetryIsValid =
      telemetry === null ||
      (typeof telemetry === "object" &&
        !Array.isArray(telemetry) &&
        equipmentStatuses.includes(
          telemetry.status as (typeof equipmentStatuses)[number],
        ) &&
        (telemetry.taskId === null || typeof telemetry.taskId === "string") &&
        (telemetry.loadId === null || typeof telemetry.loadId === "string") &&
        (telemetry.faultCode === null ||
          typeof telemetry.faultCode === "string") &&
        (telemetry.topologyId === null ||
          typeof telemetry.topologyId === "string") &&
        (telemetry.topologyRevision === null ||
          (typeof telemetry.topologyRevision === "number" &&
            Number.isSafeInteger(telemetry.topologyRevision) &&
            telemetry.topologyRevision > 0)) &&
        (telemetry.nodeId === null || typeof telemetry.nodeId === "string") &&
        ["connected", "disconnected"].includes(
          telemetry.connectionStatus as string,
        ) &&
        ["good", "uncertain", "bad", "unknown"].includes(
          telemetry.quality as string,
        ) &&
        ["current", "stale"].includes(telemetry.freshness as string) &&
        typeof telemetry.ageMs === "number" &&
        Number.isSafeInteger(telemetry.ageMs) &&
        telemetry.ageMs >= 0 &&
        typeof telemetry.sequence === "number" &&
        Number.isSafeInteger(telemetry.sequence) &&
        telemetry.sequence >= 0 &&
        typeof telemetry.observedAt === "string" &&
        !Number.isNaN(Date.parse(telemetry.observedAt)) &&
        typeof telemetry.receivedAt === "string" &&
        !Number.isNaN(Date.parse(telemetry.receivedAt)) &&
        typeof telemetry.source === "string" &&
        telemetry.source.trim().length > 0 &&
        ((telemetry.topologyId === null &&
          telemetry.topologyRevision === null) ||
          (typeof telemetry.topologyId === "string" &&
            typeof telemetry.topologyRevision === "number")) &&
        (telemetry.nodeId === null ||
          (telemetry.topologyId !== null &&
            telemetry.topologyRevision !== null)));
    return (
      typeof equipment.equipmentId === "string" &&
      typeof equipment.adapterKey === "string" &&
      isStringArray(equipment.capabilities) &&
      typeof equipment.active === "boolean" &&
      telemetryIsValid
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
        const position = node.position as Record<string, unknown> | undefined;
        const positionIsValid =
          position === undefined ||
          (typeof position === "object" &&
            position !== null &&
            !Array.isArray(position) &&
            typeof position.coordinateSystem === "string" &&
            position.coordinateSystem.trim().length > 0 &&
            typeof position.x === "number" &&
            Number.isFinite(position.x) &&
            typeof position.y === "number" &&
            Number.isFinite(position.y) &&
            (position.z === undefined ||
              (typeof position.z === "number" && Number.isFinite(position.z))));
        return (
          typeof node.nodeId === "string" &&
          typeof node.kind === "string" &&
          isStringArray(node.capabilities) &&
          positionIsValid
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
