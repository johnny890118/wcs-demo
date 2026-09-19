import { describe, expect, it } from "vitest";
import {
  createEquipmentState,
  transitionEquipment,
  type EquipmentCommand,
  type EquipmentState,
} from "../../src/domain/equipment/equipment-state-machine";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";

function apply(
  state: EquipmentState,
  command: EquipmentCommand,
): EquipmentState {
  const result = transitionEquipment(state, command);
  expect(result.accepted).toBe(true);
  return result.state;
}

describe("equipment state machine", () => {
  it("completes the deterministic transport lifecycle", () => {
    let state = createEquipmentState("AMR-01", "idle");
    state = apply(state, { type: "assign_task", taskId: "TASK-01" });
    state = apply(state, { type: "start_pickup" });
    state = apply(state, {
      type: "arrive_at_pickup",
      nodeId: "RECEIVING-01",
    });
    state = apply(state, { type: "complete_loading", loadId: "LOAD-01" });
    state = apply(state, {
      type: "arrive_at_destination",
      nodeId: "STORAGE-A-01",
    });
    state = apply(state, { type: "complete_unloading" });

    expect(state).toMatchObject({
      status: "idle",
      taskId: null,
      loadId: null,
      nodeId: "STORAGE-A-01",
      version: 6,
    });
  });

  it("rejects an unsafe transition without changing state", () => {
    const state = createEquipmentState("AMR-01", "idle");
    const result = transitionEquipment(state, { type: "start_pickup" });

    expect(result).toMatchObject({
      accepted: false,
      code: "INVALID_TRANSITION",
      state,
    });
  });

  it("resumes the interrupted state after fault recovery", () => {
    let state = createEquipmentState("AMR-01", "idle");
    state = apply(state, { type: "assign_task", taskId: "TASK-01" });
    state = apply(state, { type: "start_pickup" });
    state = apply(state, { type: "inject_fault", faultCode: "DRIVE_BLOCKED" });

    expect(state).toMatchObject({
      status: "faulted",
      interruptedStatus: "moving_to_pickup",
    });

    state = apply(state, { type: "recover", strategy: "resume" });
    expect(state).toMatchObject({
      status: "moving_to_pickup",
      faultCode: null,
      interruptedStatus: null,
    });
  });

  it("releases assignment and load on controlled recovery", () => {
    let state = createEquipmentState("AMR-01", "idle");
    state = apply(state, { type: "assign_task", taskId: "TASK-01" });
    state = apply(state, { type: "start_pickup" });
    state = apply(state, {
      type: "arrive_at_pickup",
      nodeId: "STORAGE-A-01",
    });
    state = apply(state, { type: "complete_loading", loadId: "LOAD-01" });
    state = apply(state, { type: "inject_fault", faultCode: "LIFT_FAULT" });
    state = apply(state, { type: "recover", strategy: "release" });

    expect(state).toMatchObject({
      status: "idle",
      taskId: null,
      loadId: null,
    });
  });
});

describe("simulator equipment adapter", () => {
  it("returns the original result for an idempotent duplicate command", async () => {
    const adapter = new SimulatorEquipmentAdapter();
    adapter.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const command = {
      commandId: "CMD-01",
      equipmentId: "AMR-01",
      command: { type: "assign_task", taskId: "TASK-01" } as const,
    };

    const first = await adapter.dispatch(command);
    const duplicate = await adapter.dispatch(command);

    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.transition.state.version).toBe(1);
    expect(await adapter.getState("AMR-01")).toEqual(first.transition.state);
  });

  it("rejects command-id reuse with different content", async () => {
    const adapter = new SimulatorEquipmentAdapter();
    adapter.register(createMobileTransportDescriptor("AMR-01"), "idle");

    await adapter.dispatch({
      commandId: "CMD-01",
      equipmentId: "AMR-01",
      command: { type: "assign_task", taskId: "TASK-01" },
    });

    await expect(
      adapter.dispatch({
        commandId: "CMD-01",
        equipmentId: "AMR-01",
        command: { type: "assign_task", taskId: "TASK-02" },
      }),
    ).rejects.toThrow("reused with different content");
  });
});
