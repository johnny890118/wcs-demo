import type {
  EquipmentState,
  EquipmentStatus,
} from "../../domain/equipment/equipment-state-machine";

export type EquipmentObservationWrite = Readonly<{
  equipmentId: string;
  topologyId: string | null;
  topologyRevision: number | null;
  nodeId: string | null;
  status: EquipmentStatus;
  taskId: string | null;
  loadId: string | null;
  faultCode: string | null;
  connectionStatus: "connected" | "disconnected";
  quality: "good" | "uncertain" | "bad" | "unknown";
  sequence: number;
  observedAt: Date;
  source: string;
}>;

export interface EquipmentObservationSink {
  publish(
    observation: EquipmentObservationWrite,
  ): Promise<"applied" | "ignored">;
}

export type EquipmentObservationContext = Readonly<{
  topologyId: string | null;
  topologyRevision: number | null;
  source: string;
}>;

export function observationFromState(
  state: EquipmentState,
  context: EquipmentObservationContext,
  sequence: number,
  observedAt: Date,
  connectionStatus: EquipmentObservationWrite["connectionStatus"] = "connected",
  quality: EquipmentObservationWrite["quality"] = state.status === "unknown"
    ? "unknown"
    : "good",
): EquipmentObservationWrite {
  if (
    state.nodeId !== null &&
    (context.topologyId === null || context.topologyRevision === null)
  ) {
    throw new Error(
      "A node observation requires a complete topology identity.",
    );
  }
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new Error(
      "Observation sequence must be a non-negative safe integer.",
    );
  }
  if (Number.isNaN(observedAt.getTime())) {
    throw new Error("Observation timestamp must be valid.");
  }
  return {
    equipmentId: state.equipmentId,
    topologyId: state.nodeId === null ? null : context.topologyId,
    topologyRevision: state.nodeId === null ? null : context.topologyRevision,
    nodeId: state.nodeId,
    status: state.status,
    taskId: state.taskId,
    loadId: state.loadId,
    faultCode: state.faultCode,
    connectionStatus,
    quality,
    sequence,
    observedAt,
    source: context.source,
  };
}
