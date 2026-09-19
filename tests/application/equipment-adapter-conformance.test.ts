import { describe, expect, it } from "vitest";
import { runAdapterConformance } from "../../src/application/equipment/adapter-conformance";
import type { EquipmentCommandEnvelope } from "../../src/application/equipment/equipment-port";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

const equipmentId = "AMR-CONFORMANCE-01";
const lifecycle: readonly EquipmentCommandEnvelope[] = [
  {
    commandId: "CMD-01",
    equipmentId,
    command: { type: "assign_task", taskId: "TASK-01" },
  },
  { commandId: "CMD-02", equipmentId, command: { type: "start_pickup" } },
  {
    commandId: "CMD-03",
    equipmentId,
    command: { type: "arrive_at_pickup", nodeId: "PICKUP-01" },
  },
  {
    commandId: "CMD-04",
    equipmentId,
    command: { type: "complete_loading", loadId: "LOAD-01" },
  },
  {
    commandId: "CMD-05",
    equipmentId,
    command: { type: "arrive_at_destination", nodeId: "DROPOFF-01" },
  },
  { commandId: "CMD-06", equipmentId, command: { type: "complete_unloading" } },
];

describe("equipment adapter conformance kit", () => {
  it("certifies the simulator against the protocol-neutral port contract", async () => {
    const report = await runAdapterConformance({
      adapterKey: "simulator.mobile-transport",
      equipmentId,
      requiredCapabilities: [
        "transport.move",
        "load.pickup",
        "load.dropoff",
        "navigation.graph",
      ],
      lifecycle,
      createAdapter: () => {
        const adapter = new SimulatorEquipmentAdapter();
        adapter.register(createMobileTransportDescriptor(equipmentId), "idle");
        return adapter;
      },
    });

    expect(report.passed).toBe(true);
    expect(report.checks.map(({ name }) => name)).toEqual([
      "descriptor",
      "capabilities",
      "lifecycle",
      "idempotency",
      "command-id collision",
    ]);
    expect(report.checks.every(({ passed }) => passed)).toBe(true);
  });
});
