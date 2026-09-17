import type {
  EquipmentCommand,
  EquipmentState,
  TransitionResult,
} from "../../domain/equipment/equipment-state-machine";
import type { EquipmentDescriptor } from "../../domain/equipment/equipment-descriptor";

export type EquipmentCommandEnvelope = Readonly<{
  commandId: string;
  equipmentId: string;
  command: EquipmentCommand;
}>;

export type EquipmentCommandResult = Readonly<{
  commandId: string;
  duplicate: boolean;
  transition: TransitionResult;
}>;

export interface EquipmentPort {
  getDescriptor(equipmentId: string): Promise<EquipmentDescriptor | null>;
  getState(equipmentId: string): Promise<EquipmentState | null>;
  dispatch(command: EquipmentCommandEnvelope): Promise<EquipmentCommandResult>;
}
