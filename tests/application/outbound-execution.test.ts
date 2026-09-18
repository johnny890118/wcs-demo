import { describe, expect, it } from "vitest";
import type { TransitionMetadata } from "../../src/application/execution/inbound-execution";
import {
  DeterministicOutboundExecutor,
  type OutboundExecutionRepository,
  type PersistedOutboundTask,
} from "../../src/application/execution/outbound-execution";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

class MemoryOutboundRepository implements OutboundExecutionRepository {
  task: PersistedOutboundTask = {
    taskId: "c0000000-0000-4000-8000-000000000001",
    outboundOrderId: "a0000000-0000-4000-8000-000000000001",
    allocationId: "b0000000-0000-4000-8000-000000000001",
    inventoryUnitId: "d0000000-0000-4000-8000-000000000001",
    quantity: 5,
    sourceLocationId: "20000000-0000-4000-8000-000000000002",
    destinationLocationId: "20000000-0000-4000-8000-000000000003",
    status: "queued",
    equipmentId: null,
    version: 0,
  };
  shipped = false;
  unknownReason: string | null = null;
  failCompletion = false;

  async getTask(taskId: string): Promise<PersistedOutboundTask | null> {
    return taskId === this.task.taskId ? this.task : null;
  }

  async markAssigned(
    _taskId: string,
    equipmentId: string,
    expectedVersion: number,
  ): Promise<PersistedOutboundTask> {
    expect(this.task).toMatchObject({
      status: "queued",
      version: expectedVersion,
    });
    this.task = {
      ...this.task,
      status: "assigned",
      equipmentId,
      version: this.task.version + 1,
    };
    return this.task;
  }

  async markInProgress(
    _taskId: string,
    expectedVersion: number,
  ): Promise<PersistedOutboundTask> {
    expect(this.task).toMatchObject({
      status: "assigned",
      version: expectedVersion,
    });
    this.task = {
      ...this.task,
      status: "in_progress",
      version: this.task.version + 1,
    };
    return this.task;
  }

  async complete(_taskId: string, expectedVersion: number): Promise<void> {
    expect(this.task).toMatchObject({
      status: "in_progress",
      version: expectedVersion,
    });
    if (this.failCompletion) throw new Error("shipping commit failed");
    this.shipped = true;
  }

  async markUnknown(
    _taskId: string,
    expectedVersion: number,
    _actorId: string,
    reason: string,
    _metadata: TransitionMetadata,
  ): Promise<void> {
    expect(this.task.version).toBe(expectedVersion);
    this.task = {
      ...this.task,
      status: "unknown",
      version: this.task.version + 1,
    };
    this.unknownReason = reason;
  }
}

function ids(): () => string {
  let sequence = 0;
  return () => `OUTBOUND-${++sequence}`;
}

describe("deterministic outbound execution", () => {
  it("confirms shipping only after physical unloading", async () => {
    const repository = new MemoryOutboundRepository();
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const result = await new DeterministicOutboundExecutor(
      repository,
      equipment,
      new ManualClock(2_000),
      ids(),
    ).execute({
      taskId: repository.task.taskId,
      equipmentId: "AMR-01",
      actorId: "test",
    });

    expect(result).toMatchObject({ status: "completed", completedAt: 7_000 });
    expect(repository.shipped).toBe(true);
  });

  it("marks task and equipment unknown when shipping persistence fails", async () => {
    const repository = new MemoryOutboundRepository();
    repository.failCompletion = true;
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const executor = new DeterministicOutboundExecutor(
      repository,
      equipment,
      new ManualClock(),
      ids(),
    );

    await expect(
      executor.execute({
        taskId: repository.task.taskId,
        equipmentId: "AMR-01",
        actorId: "test",
      }),
    ).rejects.toThrow("shipping commit failed");
    expect(repository.shipped).toBe(false);
    expect(repository.task.status).toBe("unknown");
    expect(repository.unknownReason).toBe("shipping commit failed");
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "unknown",
    });
  });
});
