import { expect, it } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import {
  isSpatialReadContext,
  projectSpatialReadContext,
} from "../../src/application/operations/spatial-read-context";

const topology: NonNullable<OperationsDetails["topology"]> = {
  topologyId: "topology",
  revision: 2,
  edges: [],
  nodes: [
    {
      nodeId: "one",
      kind: "storage",
      capabilities: [],
      position: { coordinateSystem: "frame-B", x: 5, y: 3, z: 9 },
    },
    {
      nodeId: "two",
      kind: "storage",
      capabilities: [],
      position: { coordinateSystem: "frame-A", x: 1, y: 2 },
    },
    {
      nodeId: "three",
      kind: "storage",
      capabilities: [],
      position: { coordinateSystem: "frame-A", x: 10, y: 20 },
    },
    { nodeId: "unpositioned", kind: "transfer", capabilities: [] },
  ],
};
it("preserves multiple configured systems without merging units, floors or physical calibration", () => {
  const context = projectSpatialReadContext(topology);
  expect(context.coordinateSystems.map((system) => system.identifier)).toEqual([
    "frame-A",
    "frame-B",
  ]);
  expect(
    context.coordinateSystems.every(
      (system) =>
        system.floorId === null &&
        system.coordinateFrameId === null &&
        system.unit === null &&
        system.calibration === "unrecorded",
    ),
  ).toBe(true);
  expect(isSpatialReadContext(context, topology)).toBe(true);
});
it("does not infer a default frame when coordinate metadata is absent", () => {
  expect(projectSpatialReadContext(null).coordinateSystems).toEqual([]);
  expect(
    projectSpatialReadContext({ ...topology, nodes: [topology.nodes[3]] })
      .coordinateSystems,
  ).toEqual([]);
});
it("rejects unsupported physical claims or coordinate systems absent from the returned topology", () => {
  const context = projectSpatialReadContext(topology);
  expect(
    isSpatialReadContext({ ...context, floorId: "invented-floor" }, topology),
  ).toBe(false);
  for (const alteration of [
    { unit: "m" },
    { floorId: "floor-9" },
    { coordinateFrameId: "physical-frame" },
    { calibration: "calibrated" },
    { identifier: "foreign-system" },
    { physicalX: 1 },
  ]) {
    expect(
      isSpatialReadContext(
        {
          ...context,
          coordinateSystems: [
            { ...context.coordinateSystems[0], ...alteration },
            context.coordinateSystems[1],
          ],
        },
        topology,
      ),
    ).toBe(false);
  }
  expect(
    isSpatialReadContext({ ...context, contractVersion: 2 }, topology),
  ).toBe(false);
  expect(
    isSpatialReadContext({ ...context, coordinateSystems: [] }, topology),
  ).toBe(false);
});
