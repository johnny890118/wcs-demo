import type { EquipmentCommand } from "./equipment-state-machine";

export const inboundTransportCapabilities = [
  "transport.move",
  "load.pickup",
  "load.dropoff",
] as const;

export const mobileTransportCommandTypes = [
  "bring_online",
  "assign_task",
  "start_pickup",
  "arrive_at_pickup",
  "complete_loading",
  "arrive_at_destination",
  "complete_unloading",
  "inject_fault",
  "recover",
  "mark_offline",
  "mark_unknown",
] as const satisfies readonly EquipmentCommand["type"][];

export type EquipmentCommandType = EquipmentCommand["type"];

export type EquipmentDescriptor = Readonly<{
  equipmentId: string;
  adapterKey: string;
  capabilities: readonly string[];
  supportedCommands: readonly EquipmentCommandType[];
  constraints: Readonly<Record<string, unknown>>;
}>;

export type EquipmentDescriptorIssue = Readonly<{
  path: string;
  message: string;
}>;

export function createMobileTransportDescriptor(
  equipmentId: string,
  adapterKey = "simulator.mobile-transport",
): EquipmentDescriptor {
  return {
    equipmentId,
    adapterKey,
    capabilities: [...inboundTransportCapabilities, "navigation.graph"],
    supportedCommands: mobileTransportCommandTypes,
    constraints: {},
  };
}

export function validateEquipmentDescriptor(
  descriptor: EquipmentDescriptor,
): readonly EquipmentDescriptorIssue[] {
  const issues: EquipmentDescriptorIssue[] = [];
  if (descriptor.equipmentId.trim().length === 0) {
    issues.push({
      path: "equipmentId",
      message: "equipmentId must not be empty.",
    });
  }
  if (descriptor.adapterKey.trim().length === 0) {
    issues.push({
      path: "adapterKey",
      message: "adapterKey must not be empty.",
    });
  }

  for (const [field, values] of [
    ["capabilities", descriptor.capabilities],
    ["supportedCommands", descriptor.supportedCommands],
  ] as const) {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (value.trim().length === 0) {
        issues.push({
          path: `${field}[${index}]`,
          message: `${field} values must not be empty.`,
        });
      } else if (seen.has(value)) {
        issues.push({
          path: `${field}[${index}]`,
          message: `${value} is duplicated.`,
        });
      }
      seen.add(value);
    });
  }

  const knownCommands = new Set<string>(mobileTransportCommandTypes);
  descriptor.supportedCommands.forEach((command, index) => {
    if (!knownCommands.has(command)) {
      issues.push({
        path: `supportedCommands[${index}]`,
        message: `${command} is not supported by the mobile transport profile.`,
      });
    }
  });

  return issues;
}

export function supportsCapabilities(
  descriptor: EquipmentDescriptor,
  required: readonly string[],
): boolean {
  const available = new Set(descriptor.capabilities);
  return required.every((capability) => available.has(capability));
}
