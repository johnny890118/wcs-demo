import { describe, expect, it } from "vitest";
import {
  prepareDemoReferenceWorkspace,
  type DemoTemplateSnapshot,
} from "../../src/application/demo/demo-reference-workspace";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";

const warehouseId = "10000000-0000-4000-8000-000000000001";
const template: DemoTemplateSnapshot = {
  topology: {
    warehouseId,
    topologyId: "10000000-0000-4000-8000-000000000002",
    revision: 7,
    status: "active",
    nodes: [
      {
        nodeId: "a",
        kind: "station",
        capabilities: [],
        position: { coordinateSystem: "diagram", x: 5, y: 7 },
      },
      { nodeId: "b", kind: "station", capabilities: [] },
    ],
    edges: [
      {
        edgeId: "a-b",
        fromNodeId: "a",
        toNodeId: "b",
        cost: 4,
        status: "available",
        requiredCapabilities: [],
        resourceIds: ["lane"],
      },
    ],
  },
  locations: [
    {
      warehouseId,
      locationId: "10000000-0000-4000-8000-000000000003",
      code: "a",
      kind: "receiving",
      status: "available",
      capabilities: ["load.pickup"],
    },
  ],
  bindings: [
    { locationId: "10000000-0000-4000-8000-000000000003", nodeId: "b" },
  ],
  equipment: [
    { ...createMobileTransportDescriptor("template-equipment"), warehouseId },
  ],
};
const adapters = ["simulator.mobile-transport"];
function factory() {
  let sequence = 0;
  return () =>
    `90000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
}
function prepare(value = template, ids = factory()) {
  return prepareDemoReferenceWorkspace(value, ids, adapters);
}

describe("isolated demo reference preparation", () => {
  it("creates disjoint identities while preserving explicit semantic graph bindings", () => {
    const ids = factory();
    const first = prepare(template, ids);
    const second = prepare(template, ids);
    expect(first.warehouseId).not.toBe(second.warehouseId);
    expect(first.topology.topologyId).not.toBe(second.topology.topologyId);
    expect(first.topology.revision).toBe(1);
    expect(first.locations[0].locationId).not.toBe(
      second.locations[0].locationId,
    );
    expect(first.equipment[0].equipmentId).not.toBe(
      second.equipment[0].equipmentId,
    );
    expect(first.topology.nodes).toEqual(template.topology.nodes);
    expect(first.bindings[0]).toEqual({
      locationId: first.locations[0].locationId,
      nodeId: "b",
    });
    expect(first.locations[0].code).toBe("a"); // never label-to-node identity
  });
  it("deep copies reference data without transferring source warehouse fields", () => {
    const result = prepare();
    (result.topology.nodes[0].capabilities as string[]).push("changed");
    expect(template.topology.nodes[0].capabilities).toEqual([]);
    expect(result.equipment[0]).not.toHaveProperty("warehouseId");
    expect(result).not.toHaveProperty("observations");
    expect(result).not.toHaveProperty("tasks");
  });
  it("rejects cross-warehouse locations or equipment", () => {
    for (const bad of [
      {
        ...template,
        locations: [{ ...template.locations[0], warehouseId: "other" }],
      },
      {
        ...template,
        equipment: [{ ...template.equipment[0], warehouseId: "other" }],
      },
    ])
      expect(() => prepare(bad)).toThrow("INVALID_TEMPLATE");
  });
  it("rejects missing, duplicate or foreign-node explicit bindings", () => {
    for (const bindings of [
      [],
      [...template.bindings, ...template.bindings],
      [{ ...template.bindings[0], nodeId: "foreign" }],
    ])
      expect(() => prepare({ ...template, bindings })).toThrow(
        "INVALID_TEMPLATE",
      );
  });
  it("rejects invalid/non-active topology and unsupported equipment contracts", () => {
    expect(() =>
      prepare({
        ...template,
        topology: { ...template.topology, status: "retired" },
      }),
    ).toThrow("INVALID_TEMPLATE");
    expect(() =>
      prepare({
        ...template,
        topology: {
          ...template.topology,
          edges: [{ ...template.topology.edges[0], cost: -1 }],
        },
      }),
    ).toThrow("INVALID_TEMPLATE");
    expect(() =>
      prepare({
        ...template,
        equipment: [
          { ...template.equipment[0], adapterKey: "unregistered.adapter" },
        ],
      }),
    ).toThrow("INVALID_TEMPLATE");
    expect(() =>
      prepare({
        ...template,
        equipment: [
          {
            ...template.equipment[0],
            supportedCommands: ["unsupported" as never],
          },
        ],
      }),
    ).toThrow("INVALID_TEMPLATE");
  });
  it("bounds reference counts and serialized size", () => {
    expect(() =>
      prepare({
        ...template,
        locations: Array(251).fill(template.locations[0]),
      }),
    ).toThrow("INVALID_TEMPLATE");
    expect(() =>
      prepare({
        ...template,
        equipment: [
          {
            ...template.equipment[0],
            constraints: { oversized: "x".repeat(1_048_576) },
          },
        ],
      }),
    ).toThrow("INVALID_TEMPLATE");
  });
  it("rejects generated identity collisions or malformed IDs", () => {
    expect(() => prepare(template, () => warehouseId)).toThrow(
      "INVALID_TEMPLATE",
    );
    expect(() => prepare(template, () => "invalid")).toThrow(
      "INVALID_TEMPLATE",
    );
    expect(() =>
      prepare(template, () => "90000000-0000-4000-8000-000000000001"),
    ).toThrow("INVALID_TEMPLATE");
  });
  it("records prototype-like equipment identifiers safely as explicit map keys", () => {
    const value = prepare({
      ...template,
      equipment: [{ ...template.equipment[0], equipmentId: "__proto__" }],
    });
    expect(Object.hasOwn(value.referenceMap.equipment, "__proto__")).toBe(true);
    expect(value.referenceMap.equipment["__proto__"]).toBe(
      value.equipment[0].equipmentId,
    );
    expect(Object.getPrototypeOf(value.referenceMap.equipment)).toBeNull();
  });
});
