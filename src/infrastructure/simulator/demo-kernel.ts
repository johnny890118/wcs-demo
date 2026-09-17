import { LegacyKernelFacade } from "../../application/legacy/legacy-kernel-facade";
import { ManualClock } from "./manual-clock";
import { SimulatorEquipmentAdapter } from "./simulator-equipment-adapter";
import { createMobileTransportDescriptor } from "../../domain/equipment/equipment-descriptor";

const clock = new ManualClock();
const equipment = new SimulatorEquipmentAdapter();
// This explicit descriptor is a compatibility fixture for the legacy read-only UI.
equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");

const facade = new LegacyKernelFacade(equipment, ["AMR-01"], clock);

export function getDemoKernelFacade(): LegacyKernelFacade {
  return facade;
}
