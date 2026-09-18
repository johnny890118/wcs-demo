import { describe, expect, it } from "vitest";
import fixture from "../fixtures/equipment/simulator-transport.trace.json";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import {
  RecordingEquipmentAdapter,
  replayEquipmentTrace,
  type EquipmentTrace,
} from "../../src/infrastructure/simulator/recording-equipment-adapter";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

function simulator() {
  const adapter = new SimulatorEquipmentAdapter();
  adapter.register(createMobileTransportDescriptor("AMR-TRACE-01"), "idle");
  return adapter;
}

describe("recorded equipment traces", () => {
  it("records a deterministic, replayable adapter interaction", async () => {
    const clock = new ManualClock(1_000);
    const recorder = new RecordingEquipmentAdapter(
      "simulator.mobile-transport",
      simulator(),
      clock,
    );
    const envelope = {
      commandId: "CMD-TRACE-01",
      equipmentId: "AMR-TRACE-01",
      command: { type: "assign_task", taskId: "TASK-TRACE-01" } as const,
    };

    await recorder.dispatch(envelope);
    clock.advanceBy(50);
    await recorder.dispatch(envelope);
    await recorder.getState("AMR-TRACE-01");

    expect(recorder.trace()).toEqual(fixture);
    await expect(
      replayEquipmentTrace(fixture as EquipmentTrace, simulator()),
    ).resolves.toBeUndefined();
  });
});
