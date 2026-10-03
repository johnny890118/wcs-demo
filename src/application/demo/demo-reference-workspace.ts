import {
  validateTopology,
  type WarehouseTopology,
} from "../../domain/topology/warehouse-topology";
import {
  validateEquipmentDescriptor,
  type EquipmentDescriptor,
} from "../../domain/equipment/equipment-descriptor";

export type DemoReferenceLocation = Readonly<{
  locationId: string;
  warehouseId: string;
  code: string;
  kind: string;
  status: "available" | "blocked" | "disabled";
  capabilities: readonly string[];
}>;
export type DemoReferenceBinding = Readonly<{
  locationId: string;
  nodeId: string;
}>;
export type DemoTemplateSnapshot = Readonly<{
  topology: WarehouseTopology;
  locations: readonly DemoReferenceLocation[];
  bindings: readonly DemoReferenceBinding[];
  equipment: readonly (EquipmentDescriptor & { warehouseId: string })[];
}>;
export type DemoReferenceWorkspace = Readonly<{
  warehouseId: string;
  topology: WarehouseTopology;
  locations: readonly DemoReferenceLocation[];
  bindings: readonly DemoReferenceBinding[];
  equipment: readonly EquipmentDescriptor[];
  referenceMap: Readonly<{
    locations: Record<string, string>;
    equipment: Record<string, string>;
  }>;
}>;
export type DemoReferenceWorkspaceRecord = Readonly<{
  sessionId: string;
  warehouseId: string;
  topologyId: string;
  topologyRevision: number;
  templateWarehouseId: string;
  templateTopologyId: string;
  templateTopologyRevision: number;
  referenceMap: DemoReferenceWorkspace["referenceMap"];
  createdAt: string;
}>;
export interface DemoReferenceWorkspaceRepository {
  snapshot(sessionId: string): Promise<DemoReferenceWorkspaceRecord>;
}
export class DemoWorkspaceError extends Error {
  constructor(readonly code: "UNAVAILABLE" | "INVALID_TEMPLATE") {
    super(`Demo reference workspace failed: ${code}.`);
    this.name = "DemoWorkspaceError";
  }
}

/** No operational rows, authorization, adapter state or mode switching. */
export function prepareDemoReferenceWorkspace(
  template: DemoTemplateSnapshot,
  createId: () => string,
  allowedSimulationAdapterKeys: readonly string[],
): DemoReferenceWorkspace {
  const invalid = () => {
    throw new DemoWorkspaceError("INVALID_TEMPLATE");
  };
  // Public-demo bounds, not a limit on commercial warehouse configuration.
  if (
    template.locations.length === 0 ||
    template.locations.length > 250 ||
    template.topology.nodes.length > 1_000 ||
    template.topology.edges.length > 4_000 ||
    template.equipment.length > 100 ||
    template.bindings.length > 250 ||
    new TextEncoder().encode(JSON.stringify(template)).length > 1_048_576
  )
    invalid();
  if (
    template.topology.status !== "active" ||
    validateTopology(template.topology).length > 0
  )
    invalid();
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const location of template.locations) {
    if (
      location.warehouseId !== template.topology.warehouseId ||
      !location.locationId ||
      !location.code.trim() ||
      !location.kind.trim() ||
      ids.has(location.locationId) ||
      codes.has(location.code) ||
      !["available", "blocked", "disabled"].includes(location.status) ||
      new Set(location.capabilities).size !== location.capabilities.length ||
      location.capabilities.some((value) => !value.trim())
    )
      invalid();
    ids.add(location.locationId);
    codes.add(location.code);
  }
  const nodes = new Set(template.topology.nodes.map((node) => node.nodeId));
  const bound = new Set<string>();
  for (const binding of template.bindings) {
    if (
      !ids.has(binding.locationId) ||
      !nodes.has(binding.nodeId) ||
      bound.has(binding.locationId)
    )
      invalid();
    bound.add(binding.locationId);
  }
  if (
    template.locations.some(
      (location) =>
        location.status !== "disabled" && !bound.has(location.locationId),
    )
  )
    invalid();
  const equipmentIds = new Set<string>();
  for (const equipment of template.equipment) {
    if (
      equipment.warehouseId !== template.topology.warehouseId ||
      equipmentIds.has(equipment.equipmentId) ||
      !allowedSimulationAdapterKeys.includes(equipment.adapterKey) ||
      validateEquipmentDescriptor(equipment).length > 0
    )
      invalid();
    equipmentIds.add(equipment.equipmentId);
  }
  const generated = new Set<string>();
  const nextId = () => {
    const id = createId().toLowerCase();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      ) ||
      generated.has(id) ||
      id === template.topology.warehouseId ||
      id === template.topology.topologyId ||
      ids.has(id) ||
      equipmentIds.has(id)
    )
      invalid();
    generated.add(id);
    return id;
  };
  const warehouseId = nextId();
  const topologyId = nextId();
  const locationMap: Record<string, string> = Object.create(null);
  const equipmentMap: Record<string, string> = Object.create(null);
  const locations = template.locations.map((location) => {
    const locationId = nextId();
    locationMap[location.locationId] = locationId;
    return { ...structuredClone(location), locationId, warehouseId };
  });
  const equipment = template.equipment.map((descriptor) => {
    const equipmentId = nextId();
    equipmentMap[descriptor.equipmentId] = equipmentId;
    const reference: EquipmentDescriptor = {
      equipmentId: descriptor.equipmentId,
      adapterKey: descriptor.adapterKey,
      capabilities: descriptor.capabilities,
      supportedCommands: descriptor.supportedCommands,
      constraints: descriptor.constraints,
    };
    return { ...structuredClone(reference), equipmentId };
  });
  return {
    warehouseId,
    topology: {
      ...structuredClone(template.topology),
      topologyId,
      warehouseId,
      revision: 1,
    },
    locations,
    bindings: template.bindings.map((binding) => ({
      locationId: locationMap[binding.locationId],
      nodeId: binding.nodeId,
    })),
    equipment,
    referenceMap: { locations: locationMap, equipment: equipmentMap },
  };
}
