import type { EquipmentStatus } from "../../domain/equipment/equipment-state-machine";
import type { SimulatorRegistration } from "./simulator-equipment-adapter";

export type PersistedSimulatorObservation = Readonly<{
  status: EquipmentStatus | null;
  taskId: string | null;
  loadId: string | null;
  topologyId: string | null;
  topologyRevision: number | null;
  nodeId: string | null;
  connectionStatus: "connected" | "disconnected" | null;
  quality: "good" | "uncertain" | "bad" | "unknown" | null;
}>;

export function restoreSimulatorRegistration(
  observation: PersistedSimulatorObservation,
  activeTopology: Readonly<{ id: string; revision: number }> | null,
): Exclude<SimulatorRegistration, string> {
  const topologyMatches =
    observation.nodeId !== null &&
    activeTopology !== null &&
    observation.topologyId === activeTopology.id &&
    observation.topologyRevision === activeTopology.revision;
  const restorableStatus =
    observation.status === "idle" || observation.status === "offline"
      ? observation.status
      : null;
  const canRestoreCertainStatus =
    observation.connectionStatus === "connected" &&
    observation.quality === "good" &&
    restorableStatus !== null &&
    (restorableStatus === "offline" || topologyMatches);

  return {
    status: canRestoreCertainStatus ? restorableStatus : "unknown",
    nodeId: topologyMatches ? observation.nodeId : null,
    taskId: canRestoreCertainStatus ? null : observation.taskId,
    loadId: canRestoreCertainStatus ? null : observation.loadId,
    version: 0,
  };
}
