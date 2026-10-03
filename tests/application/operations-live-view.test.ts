import { describe, expect, it } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import {
  isOperationsLiveView,
  projectOperationsLiveView,
} from "../../src/application/operations/operations-live-view";

const now = "2026-10-03T00:00:00.000Z";
const telemetry: NonNullable<
  OperationsDetails["equipment"][number]["telemetry"]
> = {
  status: "idle",
  taskId: null,
  loadId: "private-load",
  faultCode: "private-fault",
  topologyId: "topology",
  topologyRevision: 2,
  nodeId: "node",
  connectionStatus: "connected",
  quality: "good",
  freshness: "current",
  ageMs: 0,
  sequence: 1,
  observedAt: now,
  receivedAt: now,
  source: "private-adapter",
};
const details: OperationsDetails = {
  generatedAt: now,
  equipment: [
    {
      equipmentId: "equipment",
      active: true,
      adapterKey: "private-adapter",
      capabilities: ["transport.move"],
      telemetry,
    },
  ],
  tasks: [
    {
      taskId: "assigned",
      equipmentId: "equipment",
      status: "assigned",
      source: "Receiving",
      destination: "Storage",
      updatedAt: now,
    },
  ],
  inventory: [],
  alarms: [],
  locations: [
    {
      locationId: "location",
      code: "Storage",
      kind: "storage",
      status: "available",
      capabilities: [],
      activeNodeId: "node",
    },
    {
      locationId: "unbound",
      code: "node",
      kind: "storage",
      status: "available",
      capabilities: [],
      activeNodeId: null,
    },
  ],
  topology: {
    topologyId: "topology",
    revision: 2,
    nodes: [{ nodeId: "node", kind: "storage", capabilities: [] }],
    edges: [],
  },
};

describe("qualified operational Live View", () => {
  it("bounds current position by the shared observation deadline, not client polling", () => {
    const view = projectOperationsLiveView(details);
    expect(view.equipment[0].position.validUntil).toBe(
      "2026-10-03T00:00:30.000Z",
    );
    const fabricated = {
      ...view,
      equipment: [
        {
          ...view.equipment[0],
          position: {
            ...view.equipment[0].position,
            validUntil: "2026-10-03T00:01:00.000Z",
          },
        },
      ],
    };
    expect(isOperationsLiveView(fabricated)).toBe(false);
    const expired = projectOperationsLiveView({
      ...details,
      generatedAt: "2026-10-03T00:00:30.000Z",
    });
    expect(expired.equipment[0].position).toMatchObject({
      state: "last_known",
      reason: "stale",
      validUntil: null,
    });
    expect(isOperationsLiveView(expired)).toBe(true);
  });
  it("uses active version bindings without treating assignment or matching labels as observations", () => {
    const view = projectOperationsLiveView(details);
    expect(view.equipment[0]).toMatchObject({
      position: {
        state: "current",
        reason: "observed",
        locations: ["Storage"],
      },
      observedTaskId: null,
      observedTaskContext: "none",
      assignedTaskIds: ["assigned"],
    });
    expect(isOperationsLiveView(view)).toBe(true);
    for (const privateValue of [
      "private-load",
      "private-fault",
      "private-adapter",
    ])
      expect(JSON.stringify(view)).not.toContain(privateValue);
  });
  it.each([
    ["disconnected", { connectionStatus: "disconnected" }, "last_known"],
    ["stale", { freshness: "stale" }, "last_known"],
    ["uncertain", { quality: "uncertain" }, "last_known"],
    ["uncertain", { quality: "bad" }, "unknown"],
    ["uncertain", { quality: "unknown" }, "unknown"],
    ["topology_mismatch", { topologyRevision: 1 }, "unknown"],
    ["topology_mismatch", { topologyId: "foreign-topology" }, "unknown"],
    ["node_unknown", { nodeId: "absent-node" }, "unknown"],
  ] as const)(
    "preserves %s observations as %s evidence",
    (reason, change, state) => {
      const view = projectOperationsLiveView({
        ...details,
        equipment: [
          { ...details.equipment[0], telemetry: { ...telemetry, ...change } },
        ],
      });
      expect(view.equipment[0].position).toMatchObject({ state, reason });
      if (state === "unknown")
        expect(view.equipment[0].position).toMatchObject({
          nodeId: null,
          locations: [],
        });
      expect(isOperationsLiveView(view)).toBe(true);
    },
  );
  it("preserves missing and inactive equipment without inventing position or health", () => {
    expect(
      projectOperationsLiveView({
        ...details,
        equipment: [{ ...details.equipment[0], telemetry: null }],
      }).equipment[0].position,
    ).toMatchObject({ state: "unknown", reason: "missing_telemetry" });
    const inactive = projectOperationsLiveView({
      ...details,
      equipment: [{ ...details.equipment[0], active: false }],
    });
    expect(inactive.equipment[0].position).toMatchObject({
      state: "last_known",
      reason: "inactive_equipment",
    });
    const faulted = projectOperationsLiveView({
      ...details,
      equipment: [
        {
          ...details.equipment[0],
          telemetry: { ...telemetry, status: "faulted" },
        },
      ],
    });
    expect(faulted.equipment[0].status).toBe("faulted");
    expect(faulted.equipment[0].position.state).toBe("current"); // trustworthy location is not healthy equipment
  });
  it("resolves observed work only within scoped active evidence, retaining unresolved meaning", () => {
    const resolved = projectOperationsLiveView({
      ...details,
      equipment: [
        {
          ...details.equipment[0],
          telemetry: { ...telemetry, taskId: "assigned" },
        },
      ],
    });
    expect(resolved.equipment[0]).toMatchObject({
      observedTaskId: "assigned",
      observedTaskContext: "resolved",
    });
    const unresolved = projectOperationsLiveView({
      ...details,
      equipment: [
        {
          ...details.equipment[0],
          telemetry: { ...telemetry, taskId: "foreign-task" },
        },
      ],
    });
    expect(unresolved.equipment[0]).toMatchObject({
      observedTaskId: null,
      observedTaskContext: "unresolved",
    });
    expect(JSON.stringify(unresolved)).not.toContain("foreign-task");
    expect(isOperationsLiveView(unresolved)).toBe(true);
  });
  it("does not expose foreign assignment/alarm context or claim complete alarm coverage", () => {
    const view = projectOperationsLiveView({
      ...details,
      tasks: [{ ...details.tasks[0], equipmentId: "foreign-equipment" }],
      alarms: [
        {
          alarmId: "foreign-alarm",
          taskId: "foreign-task",
          equipmentId: "foreign-equipment",
          code: "FAULT",
          severity: "critical",
          message: "private diagnostic",
          status: "active",
          raisedAt: now,
          acknowledgedAt: null,
          clearedAt: null,
          resolution: null,
        },
      ],
    });
    expect(view.work[0].equipmentId).toBeNull();
    expect(view.alarms).toEqual([]);
    expect(view.coverage.alarmsMayBeLimited).toBe(true);
    expect(JSON.stringify(view)).not.toContain("foreign-");
  });
  it.each([
    null,
    {},
    { equipment: [] },
    { ...projectOperationsLiveView(details), generatedAt: "invalid" },
    { ...projectOperationsLiveView(details), coverage: {} },
  ])("rejects malformed payloads", (value) =>
    expect(isOperationsLiveView(value)).toBe(false),
  );
  it("rejects fabricated current positions, bindings and foreign deep links", () => {
    const view = projectOperationsLiveView(details);
    const equipment = view.equipment[0];
    for (const change of [
      { position: { ...equipment.position, locations: ["node"] } },
      { observation: { ...equipment.observation!, freshness: "stale" } },
      { observedTaskId: "foreign-task", observedTaskContext: "resolved" },
      { assignedTaskIds: ["foreign-task"] },
    ])
      expect(
        isOperationsLiveView({
          ...view,
          equipment: [{ ...equipment, ...change }],
        }),
      ).toBe(false);
  });
});
