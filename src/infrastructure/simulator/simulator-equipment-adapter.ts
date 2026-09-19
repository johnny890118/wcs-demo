import type {
  EquipmentCommandEnvelope,
  EquipmentCommandResult,
  EquipmentPort,
} from "../../application/equipment/equipment-port";
import {
  createEquipmentState,
  transitionEquipment,
  type EquipmentState,
} from "../../domain/equipment/equipment-state-machine";
import {
  validateEquipmentDescriptor,
  type EquipmentDescriptor,
} from "../../domain/equipment/equipment-descriptor";

type ProcessedCommand = Readonly<{
  fingerprint: string;
  result: EquipmentCommandResult;
}>;

export type SimulatorRegistration =
  | "offline"
  | "idle"
  | "unknown"
  | Readonly<{
      status: "offline" | "idle" | "unknown";
      nodeId: string | null;
      taskId: string | null;
      loadId: string | null;
      version: number;
    }>;

export class SimulatorEquipmentAdapter implements EquipmentPort {
  readonly #equipment = new Map<string, EquipmentState>();
  readonly #descriptors = new Map<string, EquipmentDescriptor>();
  readonly #processedCommands = new Map<string, ProcessedCommand>();

  register(
    descriptor: EquipmentDescriptor,
    initial: SimulatorRegistration = "offline",
  ): EquipmentState {
    const issues = validateEquipmentDescriptor(descriptor);
    if (issues.length > 0) {
      throw new Error(issues[0]?.message ?? "Equipment descriptor is invalid.");
    }
    const equipmentId = descriptor.equipmentId;
    if (this.#equipment.has(equipmentId)) {
      throw new Error(`Equipment ${equipmentId} is already registered.`);
    }

    const registration =
      typeof initial === "string"
        ? {
            status: initial,
            nodeId: null,
            taskId: null,
            loadId: null,
            version: 0,
          }
        : initial;
    const state = createEquipmentState(equipmentId, registration.status, {
      nodeId: registration.nodeId,
      taskId: registration.taskId,
      loadId: registration.loadId,
      version: registration.version,
    });
    this.#equipment.set(equipmentId, state);
    this.#descriptors.set(equipmentId, descriptor);
    return state;
  }

  async getDescriptor(
    equipmentId: string,
  ): Promise<EquipmentDescriptor | null> {
    return this.#descriptors.get(equipmentId) ?? null;
  }

  async getState(equipmentId: string): Promise<EquipmentState | null> {
    return this.#equipment.get(equipmentId) ?? null;
  }

  async dispatch(
    envelope: EquipmentCommandEnvelope,
  ): Promise<EquipmentCommandResult> {
    const fingerprint = JSON.stringify(envelope);
    const processed = this.#processedCommands.get(envelope.commandId);

    if (processed) {
      if (processed.fingerprint !== fingerprint) {
        throw new Error(
          `Command id ${envelope.commandId} was reused with different content.`,
        );
      }

      return { ...processed.result, duplicate: true };
    }

    const state = this.#equipment.get(envelope.equipmentId);
    if (!state) {
      throw new Error(`Equipment ${envelope.equipmentId} is not registered.`);
    }
    const descriptor = this.#descriptors.get(envelope.equipmentId);
    if (!descriptor?.supportedCommands.includes(envelope.command.type)) {
      throw new Error(
        `Equipment ${envelope.equipmentId} does not support command ${envelope.command.type}.`,
      );
    }

    const transition = transitionEquipment(state, envelope.command);
    if (transition.accepted) {
      this.#equipment.set(envelope.equipmentId, transition.state);
    }

    const result: EquipmentCommandResult = {
      commandId: envelope.commandId,
      duplicate: false,
      transition,
    };
    this.#processedCommands.set(envelope.commandId, { fingerprint, result });
    return result;
  }
}
