import { describe, expect, it } from "vitest";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import {
  isOperationsHome,
  projectOperationsHome,
} from "../../src/application/operations/operations-home";

const empty: OperationsDetails = {
  tasks: [],
  equipment: [],
  inventory: [],
  alarms: [],
  locations: [],
  topology: null,
  generatedAt: "2026-10-03T00:00:00.000Z",
};
const task = {
  taskId: "task",
  status: "queued",
  source: "Receiving",
  destination: "Storage",
  equipmentId: null,
  updatedAt: empty.generatedAt,
};

describe("operational home meaning", () => {
  it("distinguishes waiting, active, blocked and unknown work from terminal history", () => {
    const home = projectOperationsHome({
      ...empty,
      tasks: [
        "queued",
        "assigned",
        "in_progress",
        "blocked",
        "unknown",
        "completed",
        "cancelled",
      ].map((status) => ({ ...task, taskId: status, status })),
    });
    expect(home.work.map((work) => work.nextStep)).toEqual([
      "await_assignment",
      "monitor",
      "monitor",
      "review_exception",
      "review_exception",
    ]);
    expect(home.attention.map((item) => item.reason)).toEqual([
      "unknown_task",
      "blocked_task",
    ]);
    expect(home.work[0]).toMatchObject({
      source: "Receiving",
      destination: "Storage",
      needsAttention: false,
    });
    expect(isOperationsHome(home)).toBe(true);
  });

  it("keeps alarms open until cleared and retains affected task/equipment context", () => {
    const alarm = {
      alarmId: "alarm",
      taskId: "task",
      equipmentId: "equipment",
      code: "PATH_BLOCKED",
      severity: "critical",
      message: "Blocked",
      status: "active",
      raisedAt: empty.generatedAt,
      acknowledgedAt: null,
      clearedAt: null,
      resolution: null,
    };
    const home = projectOperationsHome({
      ...empty,
      alarms: ["active", "acknowledged", "cleared"].map((status) => ({
        ...alarm,
        status,
      })),
    });
    expect(home.attention.map((item) => item.reason)).toEqual([
      "active_alarm",
      "acknowledged_alarm",
    ]);
    expect(home.attention[0]).toMatchObject({
      taskId: "task",
      equipmentId: "equipment",
    });
  });

  it("never reports missing, stale, disconnected, uncertain or faulted equipment as healthy", () => {
    const telemetry = {
      status: "idle",
      taskId: null,
      loadId: null,
      faultCode: null,
      topologyId: null,
      topologyRevision: null,
      nodeId: null,
      connectionStatus: "connected" as const,
      quality: "good" as const,
      freshness: "current" as const,
      ageMs: 0,
      sequence: 0,
      observedAt: empty.generatedAt,
      receivedAt: empty.generatedAt,
      source: "test",
    };
    const equipment = {
      equipmentId: "equipment",
      adapterKey: "test",
      capabilities: [],
      active: true,
      telemetry,
    };
    const home = projectOperationsHome({
      ...empty,
      equipment: [
        equipment,
        { ...equipment, telemetry: null },
        {
          ...equipment,
          telemetry: { ...telemetry, connectionStatus: "disconnected" },
        },
        { ...equipment, telemetry: { ...telemetry, freshness: "stale" } },
        { ...equipment, telemetry: { ...telemetry, quality: "unknown" } },
        ...["faulted", "unknown", "offline"].map((status) => ({
          ...equipment,
          telemetry: { ...telemetry, status },
        })),
      ],
    });
    expect(new Set(home.attention.map((item) => item.reason))).toEqual(
      new Set([
        "missing_telemetry",
        "disconnected_equipment",
        "stale_telemetry",
        "uncertain_telemetry",
        "faulted_equipment",
        "unknown_equipment",
        "offline_equipment",
      ]),
    );
  });

  it("labels bounded coverage and visible inventory without claiming warehouse totals", () => {
    const home = projectOperationsHome({
      ...empty,
      tasks: Array.from({ length: 100 }, () => task),
      inventory: [
        {
          inventoryUnitId: "one",
          sku: "SKU",
          quantity: 4,
          location: "A",
          status: "available",
          updatedAt: empty.generatedAt,
        },
        {
          inventoryUnitId: "two",
          sku: "SKU",
          quantity: 5,
          location: "A",
          status: "allocated",
          updatedAt: empty.generatedAt,
        },
      ],
    });
    expect(home.coverage.tasksMayBeLimited).toBe(true);
    expect(home.inventory).toEqual({
      visibleUnits: 2,
      visibleQuantity: 9,
      occupiedLocations: 1,
    });
  });

  it("rejects malformed timestamps, vocabulary and coverage at the browser contract", () => {
    const home = projectOperationsHome(empty);
    expect(isOperationsHome({ ...home, generatedAt: "invalid" })).toBe(false);
    expect(isOperationsHome({ ...home, coverage: {} })).toBe(false);
    expect(
      isOperationsHome({
        ...home,
        inventory: { ...home.inventory, visibleQuantity: -1 },
      }),
    ).toBe(false);
    expect(
      isOperationsHome({
        ...home,
        work: [
          {
            ...task,
            needsAttention: false,
            nextStep: "execute_without_review",
          },
        ],
      }),
    ).toBe(false);
  });
});
