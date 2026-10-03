import type { OperationsDetails } from "./operations-details";

export const activeTaskStatuses = [
  "queued",
  "assigned",
  "in_progress",
  "blocked",
  "unknown",
] as const;

export type OperationsHome = Readonly<{
  attention: readonly Readonly<{
    kind: "alarm" | "task" | "equipment";
    severity: "critical" | "warning";
    reference: string;
    reason:
      | "active_alarm"
      | "acknowledged_alarm"
      | "blocked_task"
      | "unknown_task"
      | "inactive_equipment"
      | "missing_telemetry"
      | "disconnected_equipment"
      | "stale_telemetry"
      | "uncertain_telemetry"
      | "faulted_equipment"
      | "unknown_equipment"
      | "offline_equipment";
    taskId: string | null;
    equipmentId: string | null;
  }>[];
  work: readonly Readonly<{
    taskId: string;
    status: (typeof activeTaskStatuses)[number];
    source: string;
    destination: string;
    equipmentId: string | null;
    needsAttention: boolean;
    nextStep: "await_assignment" | "monitor" | "review_exception";
    updatedAt: string;
  }>[];
  inventory: Readonly<{
    visibleUnits: number;
    visibleQuantity: number;
    occupiedLocations: number;
  }>;
  generatedAt: string;
  coverage: Readonly<{
    tasksMayBeLimited: boolean;
    alarmsMayBeLimited: boolean;
    equipmentMayBeLimited: boolean;
    inventoryMayBeLimited: boolean;
  }>;
}>;

const isActiveTaskStatus = (
  status: string,
): status is (typeof activeTaskStatuses)[number] =>
  activeTaskStatuses.includes(status as (typeof activeTaskStatuses)[number]);

export function projectOperationsHome(
  details: OperationsDetails,
): OperationsHome {
  const attention: OperationsHome["attention"][number][] = [];
  const scopedTaskIds = new Set(details.tasks.map((task) => task.taskId));

  for (const alarm of details.alarms) {
    if (alarm.status === "active" || alarm.status === "acknowledged") {
      attention.push({
        kind: "alarm",
        severity: alarm.severity === "critical" ? "critical" : "warning",
        reference: alarm.code,
        reason:
          alarm.status === "active" ? "active_alarm" : "acknowledged_alarm",
        taskId: alarm.taskId,
        equipmentId: alarm.equipmentId,
      });
    }
  }

  for (const task of details.tasks) {
    if (task.status === "blocked" || task.status === "unknown") {
      attention.push({
        kind: "task",
        severity: task.status === "unknown" ? "critical" : "warning",
        reference: `${task.source} → ${task.destination}`,
        reason: task.status === "unknown" ? "unknown_task" : "blocked_task",
        taskId: task.taskId,
        equipmentId: task.equipmentId,
      });
    }
  }

  for (const equipment of details.equipment) {
    let reason: OperationsHome["attention"][number]["reason"] | null = null;
    let severity: "critical" | "warning" = "warning";
    if (!equipment.active) reason = "inactive_equipment";
    else if (!equipment.telemetry) {
      reason = "missing_telemetry";
      severity = "critical";
    } else if (equipment.telemetry.connectionStatus === "disconnected") {
      reason = "disconnected_equipment";
      severity = "critical";
    } else if (equipment.telemetry.freshness === "stale") {
      reason = "stale_telemetry";
      severity = "critical";
    } else if (equipment.telemetry.quality !== "good") {
      reason = "uncertain_telemetry";
    } else if (equipment.telemetry.status === "faulted") {
      reason = "faulted_equipment";
      severity = "critical";
    } else if (equipment.telemetry.status === "unknown") {
      reason = "unknown_equipment";
      severity = "critical";
    } else if (equipment.telemetry.status === "offline") {
      reason = "offline_equipment";
    }
    if (reason) {
      attention.push({
        kind: "equipment",
        severity,
        reference: equipment.equipmentId,
        reason,
        taskId:
          equipment.telemetry?.taskId &&
          scopedTaskIds.has(equipment.telemetry.taskId)
            ? equipment.telemetry.taskId
            : null,
        equipmentId: equipment.equipmentId,
      });
    }
  }

  const work = details.tasks
    .filter(({ status }) => isActiveTaskStatus(status))
    .map((task) => ({
      taskId: task.taskId,
      status: task.status as (typeof activeTaskStatuses)[number],
      source: task.source,
      destination: task.destination,
      equipmentId: task.equipmentId,
      needsAttention: task.status === "blocked" || task.status === "unknown",
      nextStep:
        task.status === "blocked" || task.status === "unknown"
          ? ("review_exception" as const)
          : task.status === "queued"
            ? ("await_assignment" as const)
            : ("monitor" as const),
      updatedAt: task.updatedAt,
    }));

  return {
    attention: attention.sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1,
    ),
    work,
    inventory: {
      visibleUnits: details.inventory.length,
      visibleQuantity: details.inventory.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      occupiedLocations: new Set(details.inventory.map((item) => item.location))
        .size,
    },
    generatedAt: details.generatedAt,
    coverage: {
      tasksMayBeLimited: details.tasks.length >= 100,
      alarmsMayBeLimited: details.alarms.length >= 100,
      equipmentMayBeLimited: details.equipment.length >= 100,
      inventoryMayBeLimited: details.inventory.length >= 100,
    },
  };
}

export function isOperationsHome(value: unknown): value is OperationsHome {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  const inventory = data.inventory as Record<string, unknown> | undefined;
  const coverage = data.coverage as Record<string, unknown> | undefined;
  return (
    Array.isArray(data.attention) &&
    data.attention.every((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        return false;
      const row = item as Record<string, unknown>;
      return (
        ["alarm", "task", "equipment"].includes(row.kind as string) &&
        ["critical", "warning"].includes(row.severity as string) &&
        typeof row.reference === "string" &&
        [
          "active_alarm",
          "acknowledged_alarm",
          "blocked_task",
          "unknown_task",
          "inactive_equipment",
          "missing_telemetry",
          "disconnected_equipment",
          "stale_telemetry",
          "uncertain_telemetry",
          "faulted_equipment",
          "unknown_equipment",
          "offline_equipment",
        ].includes(row.reason as string) &&
        (row.taskId === null || typeof row.taskId === "string") &&
        (row.equipmentId === null || typeof row.equipmentId === "string")
      );
    }) &&
    Array.isArray(data.work) &&
    data.work.every((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        return false;
      const row = item as Record<string, unknown>;
      return (
        typeof row.taskId === "string" &&
        activeTaskStatuses.includes(
          row.status as (typeof activeTaskStatuses)[number],
        ) &&
        typeof row.source === "string" &&
        typeof row.destination === "string" &&
        (row.equipmentId === null || typeof row.equipmentId === "string") &&
        typeof row.needsAttention === "boolean" &&
        ["await_assignment", "monitor", "review_exception"].includes(
          row.nextStep as string,
        ) &&
        typeof row.updatedAt === "string" &&
        !Number.isNaN(Date.parse(row.updatedAt))
      );
    }) &&
    !!inventory &&
    !Array.isArray(inventory) &&
    [
      inventory.visibleUnits,
      inventory.visibleQuantity,
      inventory.occupiedLocations,
    ].every(
      (count) =>
        typeof count === "number" && Number.isSafeInteger(count) && count >= 0,
    ) &&
    !!coverage &&
    !Array.isArray(coverage) &&
    [
      "tasksMayBeLimited",
      "alarmsMayBeLimited",
      "equipmentMayBeLimited",
      "inventoryMayBeLimited",
    ].every((key) => typeof coverage[key] === "boolean") &&
    typeof data.generatedAt === "string" &&
    !Number.isNaN(Date.parse(data.generatedAt))
  );
}
