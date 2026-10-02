import { equipmentStatuses } from "../../domain/equipment/equipment-state-machine";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "./operations-details";

export const positionReasons = [
  "observed",
  "missing_telemetry",
  "topology_mismatch",
  "node_unknown",
  "inactive_equipment",
  "disconnected",
  "stale",
  "uncertain",
] as const;
export type LiveEquipment = Readonly<{
  equipmentId: string;
  active: boolean;
  capabilities: readonly string[];
  status: string | null;
  observation: Readonly<
    Pick<
      NonNullable<OperationsDetails["equipment"][number]["telemetry"]>,
      | "connectionStatus"
      | "quality"
      | "freshness"
      | "ageMs"
      | "observedAt"
      | "receivedAt"
    >
  > | null;
  position: Readonly<{
    state: "current" | "last_known" | "unknown";
    reason: (typeof positionReasons)[number];
    nodeId: string | null;
    locations: readonly string[];
  }>;
  observedTaskId: string | null;
  observedTaskContext: "none" | "resolved" | "unresolved";
  assignedTaskIds: readonly string[];
}>;
export type OperationsLiveView = Readonly<{
  equipment: readonly LiveEquipment[];
  work: OperationsDetails["tasks"];
  alarms: readonly Readonly<
    Pick<
      OperationsDetails["alarms"][number],
      "alarmId" | "taskId" | "code" | "severity" | "status"
    > & { equipmentId: string | null }
  >[];
  locations: OperationsDetails["locations"];
  topology: OperationsDetails["topology"];
  generatedAt: string;
  coverage: Readonly<{
    workMayBeLimited: boolean;
    equipmentMayBeLimited: boolean;
    locationsMayBeLimited: boolean;
    alarmsMayBeLimited: boolean;
  }>;
}>;

/** Read evidence, never a command precondition or physical floorplan. */
export function projectOperationsLiveView(
  details: OperationsDetails,
): OperationsLiveView {
  const equipmentIds = new Set(
    details.equipment.map((item) => item.equipmentId),
  );
  const work = details.tasks
    .filter((task) =>
      ["queued", "assigned", "in_progress", "blocked", "unknown"].includes(
        task.status,
      ),
    )
    .map((task) => ({
      ...task,
      equipmentId:
        task.equipmentId && equipmentIds.has(task.equipmentId)
          ? task.equipmentId
          : null,
    }));
  const workIds = new Set(work.map((task) => task.taskId));
  const topology = details.topology;
  const equipment = details.equipment.map((item) => {
    const telemetry = item.telemetry;
    const matches =
      !!telemetry &&
      !!topology &&
      telemetry.topologyId === topology.topologyId &&
      telemetry.topologyRevision === topology.revision;
    const hasNode =
      matches &&
      topology!.nodes.some((node) => node.nodeId === telemetry!.nodeId);
    const usableNode =
      hasNode &&
      telemetry!.quality !== "bad" &&
      telemetry!.quality !== "unknown";
    const reason: LiveEquipment["position"]["reason"] = !telemetry
      ? "missing_telemetry"
      : !matches
        ? "topology_mismatch"
        : !hasNode
          ? "node_unknown"
          : !item.active
            ? "inactive_equipment"
            : telemetry.connectionStatus !== "connected"
              ? "disconnected"
              : telemetry.freshness !== "current"
                ? "stale"
                : telemetry.quality !== "good"
                  ? "uncertain"
                  : "observed";
    const observedTaskId =
      telemetry?.taskId && workIds.has(telemetry.taskId)
        ? telemetry.taskId
        : null;
    return {
      equipmentId: item.equipmentId,
      active: item.active,
      capabilities: item.capabilities,
      status: telemetry?.status ?? null,
      observation: telemetry
        ? {
            connectionStatus: telemetry.connectionStatus,
            quality: telemetry.quality,
            freshness: telemetry.freshness,
            ageMs: telemetry.ageMs,
            observedAt: telemetry.observedAt,
            receivedAt: telemetry.receivedAt,
          }
        : null,
      position: {
        state: !usableNode
          ? ("unknown" as const)
          : reason === "observed"
            ? ("current" as const)
            : ("last_known" as const),
        reason,
        nodeId: usableNode ? telemetry!.nodeId : null,
        locations: usableNode
          ? details.locations
              .filter((location) => location.activeNodeId === telemetry!.nodeId)
              .map((location) => location.code)
          : [],
      },
      observedTaskId,
      observedTaskContext: !telemetry?.taskId
        ? ("none" as const)
        : observedTaskId
          ? ("resolved" as const)
          : ("unresolved" as const),
      assignedTaskIds: work
        .filter((task) => task.equipmentId === item.equipmentId)
        .map((task) => task.taskId),
    };
  });
  const alarms = details.alarms
    .filter(
      (alarm) =>
        ["active", "acknowledged"].includes(alarm.status) &&
        workIds.has(alarm.taskId),
    )
    .map((alarm) => ({
      alarmId: alarm.alarmId,
      taskId: alarm.taskId,
      equipmentId: equipmentIds.has(alarm.equipmentId)
        ? alarm.equipmentId
        : null,
      code: alarm.code,
      severity: alarm.severity,
      status: alarm.status,
    }));
  return {
    equipment,
    work,
    alarms,
    locations: details.locations,
    topology,
    generatedAt: details.generatedAt,
    coverage: {
      workMayBeLimited: details.tasks.length >= 100,
      equipmentMayBeLimited: details.equipment.length >= 100,
      locationsMayBeLimited: details.locations.length >= 500,
      alarmsMayBeLimited:
        details.alarms.length >= 100 ||
        alarms.length <
          details.alarms.filter((alarm) =>
            ["active", "acknowledged"].includes(alarm.status),
          ).length,
    },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
function timestamp(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
export function isOperationsLiveView(
  value: unknown,
): value is OperationsLiveView {
  if (
    !record(value) ||
    !Array.isArray(value.equipment) ||
    !Array.isArray(value.alarms) ||
    !record(value.coverage)
  )
    return false;
  if (
    !isOperationsDetails({
      tasks: value.work,
      equipment: [],
      inventory: [],
      alarms: [],
      locations: value.locations,
      topology: value.topology,
      generatedAt: value.generatedAt,
    })
  )
    return false;
  if (
    ![
      "workMayBeLimited",
      "equipmentMayBeLimited",
      "locationsMayBeLimited",
      "alarmsMayBeLimited",
    ].every(
      (key) =>
        typeof (value.coverage as Record<string, unknown>)[key] === "boolean",
    )
  )
    return false;
  const shapeValid =
    value.equipment.every((item) => {
      if (
        !record(item) ||
        !record(item.position) ||
        !strings(item.capabilities) ||
        !strings(item.assignedTaskIds) ||
        !strings(item.position.locations)
      )
        return false;
      const observation = item.observation;
      return (
        typeof item.equipmentId === "string" &&
        typeof item.active === "boolean" &&
        (item.status === null ||
          equipmentStatuses.includes(
            item.status as (typeof equipmentStatuses)[number],
          )) &&
        ["current", "last_known", "unknown"].includes(
          item.position.state as string,
        ) &&
        positionReasons.includes(
          item.position.reason as (typeof positionReasons)[number],
        ) &&
        (item.position.nodeId === null ||
          typeof item.position.nodeId === "string") &&
        ["none", "resolved", "unresolved"].includes(
          item.observedTaskContext as string,
        ) &&
        (item.observedTaskId === null ||
          typeof item.observedTaskId === "string") &&
        (observation === null ||
          (record(observation) &&
            ["connected", "disconnected"].includes(
              observation.connectionStatus as string,
            ) &&
            ["good", "uncertain", "bad", "unknown"].includes(
              observation.quality as string,
            ) &&
            ["current", "stale"].includes(observation.freshness as string) &&
            typeof observation.ageMs === "number" &&
            Number.isSafeInteger(observation.ageMs) &&
            observation.ageMs >= 0 &&
            timestamp(observation.observedAt) &&
            timestamp(observation.receivedAt)))
      );
    }) &&
    value.alarms.every(
      (item) =>
        record(item) &&
        ["alarmId", "taskId", "code", "severity"].every(
          (key) => typeof item[key] === "string",
        ) &&
        ["active", "acknowledged"].includes(item.status as string) &&
        (item.equipmentId === null || typeof item.equipmentId === "string"),
    );
  if (!shapeValid) return false;
  const view = value as unknown as OperationsLiveView;
  const workIds = new Set(view.work.map((task) => task.taskId));
  const equipmentIds = new Set(view.equipment.map((item) => item.equipmentId));
  if (
    !view.work.every(
      (task) =>
        ["queued", "assigned", "in_progress", "blocked", "unknown"].includes(
          task.status,
        ) &&
        (task.equipmentId === null || equipmentIds.has(task.equipmentId)),
    )
  )
    return false;
  return (
    view.equipment.every((item) => {
      const position = item.position;
      if (
        item.observedTaskContext === "resolved"
          ? !item.observedTaskId || !workIds.has(item.observedTaskId)
          : item.observedTaskId !== null
      )
        return false;
      if (
        !item.assignedTaskIds.every((id) =>
          view.work.some(
            (task) =>
              task.taskId === id && task.equipmentId === item.equipmentId,
          ),
        )
      )
        return false;
      if (position.state === "unknown")
        return (
          position.nodeId === null &&
          position.locations.length === 0 &&
          position.reason !== "observed"
        );
      if (
        !item.observation ||
        ["bad", "unknown"].includes(item.observation.quality) ||
        !view.topology?.nodes.some((node) => node.nodeId === position.nodeId)
      )
        return false;
      const expectedLocations = view.locations
        .filter((location) => location.activeNodeId === position.nodeId)
        .map((location) => location.code);
      if (
        JSON.stringify(position.locations) !== JSON.stringify(expectedLocations)
      )
        return false;
      if (position.state === "current")
        return (
          position.reason === "observed" &&
          item.active &&
          item.observation.connectionStatus === "connected" &&
          item.observation.freshness === "current" &&
          item.observation.quality === "good"
        );
      return position.reason !== "observed";
    }) &&
    view.alarms.every(
      (alarm) =>
        workIds.has(alarm.taskId) &&
        (alarm.equipmentId === null || equipmentIds.has(alarm.equipmentId)),
    )
  );
}
