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
