export const equipmentStatuses = [
  "offline",
  "idle",
  "assigned",
  "moving_to_pickup",
  "loading",
  "moving_to_destination",
  "unloading",
  "faulted",
  "unknown",
] as const;

// This lifecycle models the first mobile load-transport profile. Other equipment
// participates through capability descriptors and may use a different profile.

export type EquipmentStatus = (typeof equipmentStatuses)[number];

type ActiveStatus = Exclude<EquipmentStatus, "offline" | "faulted" | "unknown">;

export type EquipmentState = Readonly<{
  equipmentId: string;
  status: EquipmentStatus;
  taskId: string | null;
  loadId: string | null;
  faultCode: string | null;
  interruptedStatus: ActiveStatus | null;
  version: number;
}>;

export type EquipmentCommand =
  | { type: "bring_online" }
  | { type: "assign_task"; taskId: string }
  | { type: "start_pickup" }
  | { type: "arrive_at_pickup" }
  | { type: "complete_loading"; loadId: string }
  | { type: "arrive_at_destination" }
  | { type: "complete_unloading" }
  | { type: "inject_fault"; faultCode: string }
  | { type: "recover"; strategy: "resume" | "release" }
  | { type: "mark_offline" }
  | { type: "mark_unknown" };

export type TransitionResult =
  | { accepted: true; state: EquipmentState }
  | {
      accepted: false;
      code: "INVALID_TRANSITION" | "INVALID_COMMAND";
      message: string;
      state: EquipmentState;
    };

export function createEquipmentState(
  equipmentId: string,
  initialStatus: "offline" | "idle" = "offline",
): EquipmentState {
  if (equipmentId.trim().length === 0) {
    throw new Error("equipmentId must not be empty");
  }

  return {
    equipmentId,
    status: initialStatus,
    taskId: null,
    loadId: null,
    faultCode: null,
    interruptedStatus: null,
    version: 0,
  };
}

function accept(
  state: EquipmentState,
  changes: Partial<EquipmentState>,
): TransitionResult {
  return {
    accepted: true,
    state: { ...state, ...changes, version: state.version + 1 },
  };
}

function reject(
  state: EquipmentState,
  command: EquipmentCommand,
  detail?: string,
): TransitionResult {
  return {
    accepted: false,
    code: "INVALID_TRANSITION",
    message:
      detail ??
      `Cannot apply ${command.type} while equipment is ${state.status}.`,
    state,
  };
}

export function transitionEquipment(
  state: EquipmentState,
  command: EquipmentCommand,
): TransitionResult {
  if (command.type === "mark_unknown") {
    return accept(state, {
      status: "unknown",
      faultCode: null,
      interruptedStatus: null,
    });
  }

  if (command.type === "mark_offline") {
    if (state.status !== "idle" && state.status !== "offline") {
      return reject(
        state,
        command,
        "Active or uncertain equipment cannot be marked offline without reconciliation.",
      );
    }

    return state.status === "offline"
      ? { accepted: true, state }
      : accept(state, { status: "offline" });
  }

  if (command.type === "bring_online") {
    if (state.status !== "offline") return reject(state, command);
    return accept(state, { status: "idle" });
  }

  if (command.type === "inject_fault") {
    if (
      state.status === "offline" ||
      state.status === "faulted" ||
      state.status === "unknown"
    ) {
      return reject(state, command);
    }
    if (command.faultCode.trim().length === 0) {
      return {
        accepted: false,
        code: "INVALID_COMMAND",
        message: "faultCode must not be empty.",
        state,
      };
    }

    return accept(state, {
      status: "faulted",
      faultCode: command.faultCode,
      interruptedStatus: state.status,
    });
  }

  if (command.type === "recover") {
    if (state.status !== "faulted" || state.interruptedStatus === null) {
      return reject(state, command);
    }

    if (command.strategy === "release") {
      return accept(state, {
        status: "idle",
        taskId: null,
        loadId: null,
        faultCode: null,
        interruptedStatus: null,
      });
    }

    return accept(state, {
      status: state.interruptedStatus,
      faultCode: null,
      interruptedStatus: null,
    });
  }

  switch (state.status) {
    case "idle":
      if (command.type !== "assign_task") return reject(state, command);
      if (command.taskId.trim().length === 0) {
        return {
          accepted: false,
          code: "INVALID_COMMAND",
          message: "taskId must not be empty.",
          state,
        };
      }
      return accept(state, { status: "assigned", taskId: command.taskId });

    case "assigned":
      return command.type === "start_pickup"
        ? accept(state, { status: "moving_to_pickup" })
        : reject(state, command);

    case "moving_to_pickup":
      return command.type === "arrive_at_pickup"
        ? accept(state, { status: "loading" })
        : reject(state, command);

    case "loading":
      if (command.type !== "complete_loading") return reject(state, command);
      if (command.loadId.trim().length === 0) {
        return {
          accepted: false,
          code: "INVALID_COMMAND",
          message: "loadId must not be empty.",
          state,
        };
      }
      return accept(state, {
        status: "moving_to_destination",
        loadId: command.loadId,
      });

    case "moving_to_destination":
      return command.type === "arrive_at_destination"
        ? accept(state, { status: "unloading" })
        : reject(state, command);

    case "unloading":
      return command.type === "complete_unloading"
        ? accept(state, {
            status: "idle",
            taskId: null,
            loadId: null,
          })
        : reject(state, command);

    case "offline":
    case "faulted":
    case "unknown":
      return reject(state, command);
  }
}
