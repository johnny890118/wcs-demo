import type { OperationsDetails } from "./operations-details";

export type SpatialReadContext = Readonly<{
  contractVersion: 1;
  positionRepresentation: "versioned_topology_node";
  physicalLayout: "unrecorded";
  coordinateSystems: readonly Readonly<{
    identifier: string;
    interpretation: "configured_topology_diagram";
    unit: null;
    floorId: null;
    coordinateFrameId: null;
    calibration: "unrecorded";
  }>[];
}>;

export function projectSpatialReadContext(
  topology: OperationsDetails["topology"],
): SpatialReadContext {
  const identifiers = [
    ...new Set(
      topology?.nodes.flatMap((node) =>
        node.position ? [node.position.coordinateSystem] : [],
      ) ?? [],
    ),
  ].sort();
  return {
    contractVersion: 1,
    positionRepresentation: "versioned_topology_node",
    physicalLayout: "unrecorded",
    coordinateSystems: identifiers.map((identifier) => ({
      identifier,
      interpretation: "configured_topology_diagram",
      unit: null,
      floorId: null,
      coordinateFrameId: null,
      calibration: "unrecorded",
    })),
  };
}

export function isSpatialReadContext(
  value: unknown,
  topology: OperationsDetails["topology"],
): value is SpatialReadContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const context = value as Record<string, unknown>;
  if (
    Object.keys(context).length !== 4 ||
    context.contractVersion !== 1 ||
    context.positionRepresentation !== "versioned_topology_node" ||
    context.physicalLayout !== "unrecorded" ||
    !Array.isArray(context.coordinateSystems)
  )
    return false;
  const expected = projectSpatialReadContext(topology).coordinateSystems;
  return (
    context.coordinateSystems.length === expected.length &&
    context.coordinateSystems.every((system: unknown, index: number) => {
      if (!system || typeof system !== "object" || Array.isArray(system))
        return false;
      const data = system as Record<string, unknown>;
      return (
        Object.keys(data).length === 6 &&
        data.identifier === expected[index].identifier &&
        data.interpretation === "configured_topology_diagram" &&
        data.unit === null &&
        data.floorId === null &&
        data.coordinateFrameId === null &&
        data.calibration === "unrecorded"
      );
    })
  );
}
