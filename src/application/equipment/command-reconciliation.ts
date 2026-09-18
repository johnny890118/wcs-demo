import {
  transitionEquipment,
  type EquipmentCommand,
  type EquipmentState,
} from "../../domain/equipment/equipment-state-machine";

export type CommandReconciliation =
  | Readonly<{ status: "confirmed-applied"; state: EquipmentState }>
  | Readonly<{ status: "confirmed-not-applied"; state: EquipmentState }>
  | Readonly<{
      status: "unresolved";
      reason: "observation-unavailable" | "state-diverged";
      state: EquipmentState | null;
    }>;

export function reconcileEquipmentCommand(
  stateBeforeDispatch: EquipmentState,
  command: EquipmentCommand,
  observedState: EquipmentState | null,
): CommandReconciliation {
  if (!observedState) {
    return {
      status: "unresolved",
      reason: "observation-unavailable",
      state: null,
    };
  }
  if (observedState.equipmentId !== stateBeforeDispatch.equipmentId) {
    throw new Error("Observed state belongs to different equipment.");
  }
  const expected = transitionEquipment(stateBeforeDispatch, command);
  if (!expected.accepted) {
    throw new Error("Cannot reconcile a command invalid for the prior state.");
  }
  if (sameState(observedState, expected.state)) {
    return { status: "confirmed-applied", state: observedState };
  }
  if (sameState(observedState, stateBeforeDispatch)) {
    return { status: "confirmed-not-applied", state: observedState };
  }
  return {
    status: "unresolved",
    reason: "state-diverged",
    state: observedState,
  };
}

function sameState(left: EquipmentState, right: EquipmentState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
