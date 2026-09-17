export type OperationsSummary = Readonly<{
  counts: Readonly<{
    activeTasks: number;
    storedInventory: number;
    openReceipts: number;
    configuredEquipment: number;
  }>;
  topology: Readonly<{
    topologyId: string;
    revision: number;
  }> | null;
  recentTasks: readonly Readonly<{
    taskId: string;
    status: string;
    sourceLocationId: string;
    destinationLocationId: string;
    equipmentId: string | null;
    updatedAt: string;
  }>[];
  generatedAt: string;
}>;

export function isOperationsSummary(
  value: unknown,
): value is OperationsSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const counts = candidate.counts;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return false;
  }
  const countValues = counts as Record<string, unknown>;
  const topology = candidate.topology as Record<string, unknown> | null;
  const recentTasks = candidate.recentTasks;
  return (
    [
      countValues.activeTasks,
      countValues.storedInventory,
      countValues.openReceipts,
      countValues.configuredEquipment,
    ].every(
      (count) =>
        typeof count === "number" && Number.isSafeInteger(count) && count >= 0,
    ) &&
    (topology === null ||
      (typeof topology === "object" &&
        !Array.isArray(topology) &&
        typeof topology.topologyId === "string" &&
        typeof topology.revision === "number" &&
        Number.isSafeInteger(topology.revision) &&
        topology.revision > 0)) &&
    Array.isArray(recentTasks) &&
    recentTasks.every((task: unknown) => {
      if (!task || typeof task !== "object" || Array.isArray(task))
        return false;
      const row = task as Record<string, unknown>;
      return (
        typeof row.taskId === "string" &&
        typeof row.status === "string" &&
        typeof row.sourceLocationId === "string" &&
        typeof row.destinationLocationId === "string" &&
        (row.equipmentId === null || typeof row.equipmentId === "string") &&
        typeof row.updatedAt === "string" &&
        !Number.isNaN(Date.parse(row.updatedAt))
      );
    }) &&
    typeof candidate.generatedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.generatedAt))
  );
}
