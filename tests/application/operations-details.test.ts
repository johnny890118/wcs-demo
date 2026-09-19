import { describe, expect, it } from "vitest";
import { isOperationsDetails } from "../../src/application/operations/operations-details";

const validProjection = {
  tasks: [],
  equipment: [
    {
      equipmentId: "AMR-01",
      adapterKey: "simulator.mobile-transport",
      capabilities: ["transport.move"],
      active: true,
      telemetry: {
        status: "idle",
        taskId: null,
        loadId: null,
        faultCode: null,
        topologyId: "TOPOLOGY-01",
        topologyRevision: 1,
        nodeId: "RECEIVING-01",
        connectionStatus: "connected",
        quality: "good",
        freshness: "current",
        ageMs: 250,
        sequence: 3,
        observedAt: "2026-09-19T00:00:00.000Z",
        receivedAt: "2026-09-19T00:00:00.250Z",
        source: "deterministic-simulator",
      },
    },
  ],
  inventory: [],
  alarms: [],
  topology: null,
  generatedAt: "2026-09-19T00:00:01.000Z",
};

describe("operations equipment observation boundary", () => {
  it("accepts timestamped, topology-qualified telemetry and no observation", () => {
    expect(isOperationsDetails(validProjection)).toBe(true);
    expect(
      isOperationsDetails({
        ...validProjection,
        equipment: [{ ...validProjection.equipment[0], telemetry: null }],
      }),
    ).toBe(true);
  });

  it("rejects a node observation without a complete topology identity", () => {
    expect(
      isOperationsDetails({
        ...validProjection,
        equipment: [
          {
            ...validProjection.equipment[0],
            telemetry: {
              ...validProjection.equipment[0].telemetry,
              topologyRevision: null,
            },
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects unknown state vocabulary and unsafe numeric evidence", () => {
    expect(
      isOperationsDetails({
        ...validProjection,
        equipment: [
          {
            ...validProjection.equipment[0],
            telemetry: {
              ...validProjection.equipment[0].telemetry,
              status: "probably-moving",
            },
          },
        ],
      }),
    ).toBe(false);
    expect(
      isOperationsDetails({
        ...validProjection,
        equipment: [
          {
            ...validProjection.equipment[0],
            telemetry: {
              ...validProjection.equipment[0].telemetry,
              ageMs: Number.POSITIVE_INFINITY,
            },
          },
        ],
      }),
    ).toBe(false);
  });
});
