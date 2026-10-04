import "reflect-metadata";
import { describe, expect, it, vi } from "vitest";
import {
  ExecutionModule,
  EXECUTION_EQUIPMENT,
} from "../../apps/api/src/execution/execution.module";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import {
  ObservationSequenceConflict,
  ObservationPublishingEquipmentPort,
} from "../../src/infrastructure/simulator/observation-publishing-equipment-port";
import { initializePrivateSimulatorWithRetry } from "../../src/infrastructure/simulator/private-simulator-initialization";
import type { EquipmentObservationWrite } from "../../src/application/equipment/equipment-observation-sink";

describe("private simulator rolling startup", () => {
  it("rebuilds the real provider from fresh persisted state after a startup sequence race", async () => {
    const descriptor = createMobileTransportDescriptor("AMR-01");
    const base = {
      equipment_id: descriptor.equipmentId,
      adapter_key: descriptor.adapterKey,
      capabilities: descriptor.capabilities,
      supported_commands: descriptor.supportedCommands,
      constraints: descriptor.constraints,
      topology_id: "topology",
      topology_revision: 1,
      observation_status: "idle",
      observation_task_id: null,
      observation_load_id: null,
      observation_topology_id: "topology",
      observation_topology_revision: 1,
      observation_node_id: "STORAGE-01",
      observation_connection_status: "connected",
      observation_quality: "good",
      observation_sequence: "10",
    };
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [base] })
      .mockResolvedValueOnce({
        rows: [
          {
            ...base,
            observation_sequence: "12",
            observation_status: "moving_to_pickup",
            observation_task_id: "in-progress-task",
          },
        ],
      });
    const observations: EquipmentObservationWrite[] = [];
    const publish = vi.fn(async (observation: EquipmentObservationWrite) => {
      observations.push(observation);
      return observations.length === 1
        ? ("ignored" as const)
        : ("applied" as const);
    });
    const provider = (
      Reflect.getMetadata("providers", ExecutionModule) as {
        provide?: symbol;
        useFactory?: (
          ...args: unknown[]
        ) => Promise<ObservationPublishingEquipmentPort>;
      }[]
    ).find((entry) => entry.provide === EXECUTION_EQUIPMENT)!;
    const runtime = await provider.useFactory!({ query }, { publish });
    try {
      expect(query).toHaveBeenCalledTimes(2);
      expect(query.mock.calls[0][0]).toContain("demo_reference_workspaces");
      expect(observations.map((row) => row.sequence)).toEqual([11, 13]);
      expect(observations[1]).toMatchObject({
        status: "unknown",
        taskId: "in-progress-task",
        quality: "unknown",
      });
      expect(await runtime.getState("AMR-01")).toMatchObject({
        status: "unknown",
        taskId: "in-progress-task",
      });
    } finally {
      await runtime.onModuleDestroy();
    }
  });
  it("bounds repeated sequence conflicts and preserves the actual failure", async () => {
    const conflict = new ObservationSequenceConflict("AMR-01", 10);
    const factory = vi.fn().mockRejectedValue(conflict);
    await expect(initializePrivateSimulatorWithRetry(factory)).rejects.toBe(
      conflict,
    );
    expect(factory).toHaveBeenCalledTimes(3);
  });
  it("never retries DB, validation or other unrelated failures", async () => {
    const failure = new Error("database unavailable");
    const factory = vi.fn().mockRejectedValue(failure);
    await expect(initializePrivateSimulatorWithRetry(factory)).rejects.toBe(
      failure,
    );
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it("does not repeat a successful initialization", async () => {
    const factory = vi.fn().mockResolvedValue("ready");
    await expect(initializePrivateSimulatorWithRetry(factory)).resolves.toBe(
      "ready",
    );
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
