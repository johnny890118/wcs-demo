import { describe, expect, it } from "vitest";
import {
  DeterministicInboundExecutor,
  type CompletionMetadata,
  type InboundExecutionRepository,
  type PersistedInboundTask,
  type TransitionMetadata,
} from "../../src/application/execution/inbound-execution";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";

const warehouseId = "10000000-0000-4000-8000-000000000001";

class MemoryExecutionRepository implements InboundExecutionRepository {
  task: PersistedInboundTask = {
    taskId: "50000000-0000-4000-8000-000000000001",
    receiptId: "30000000-0000-4000-8000-000000000001",
    loadId: "40000000-0000-4000-8000-000000000001",
    sourceLocationId: "20000000-0000-4000-8000-000000000001",
    destinationLocationId: "20000000-0000-4000-8000-000000000002",
    sourceNodeId: "RECEIVING-01",
    destinationNodeId: "STORAGE-A-01",
    status: "queued",
    equipmentId: null,
    version: 0,
  };
  inventoryConfirmed = false;
  unknownReason: string | null = null;
  failCompletion = false;

  async getTask(taskId: string): Promise<PersistedInboundTask | null> {
    return taskId === this.task.taskId ? this.task : null;
  }

  async isEquipmentAvailableInWarehouse(): Promise<boolean> {
    return true;
  }

  async markAssigned(
    _taskId: string,
    _warehouseId: string,
    equipmentId: string,
    expectedVersion: number,
    _actorId: string,
    _metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask> {
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
    _warehouseId: string,
    expectedVersion: number,
    _actorId: string,
    _metadata: TransitionMetadata,
  ): Promise<PersistedInboundTask> {
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

  async complete(
    _taskId: string,
    _warehouseId: string,
    expectedVersion: number,
    _actorId: string,
    _metadata: CompletionMetadata,
  ): Promise<void> {
    expect(this.task).toMatchObject({
      status: "in_progress",
      version: expectedVersion,
    });
    if (this.failCompletion) throw new Error("database commit failed");
    this.inventoryConfirmed = true;
  }

  async markUnknown(
    _taskId: string,
    _warehouseId: string,
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

function sequentialIdFactory(): () => string {
  let sequence = 0;
  return () => `ID-${String(++sequence).padStart(4, "0")}`;
}

describe("deterministic inbound execution", () => {
  it("confirms inventory only after physical unloading completes", async () => {
    const repository = new MemoryExecutionRepository();
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const clock = new ManualClock(10_000);
    const executor = new DeterministicInboundExecutor(
      repository,
      equipment,
      clock,
      sequentialIdFactory(),
    );

    const result = await executor.execute({
      taskId: repository.task.taskId,
      equipmentId: "AMR-01",
      actorId: "test-service",
      warehouseId,
      confirmationReason: "Verified deterministic inbound execution test.",
    });

    expect(result).toEqual({
      taskId: repository.task.taskId,
      equipmentId: "AMR-01",
      status: "completed",
      completedAt: 15_000,
    });
    expect(repository.inventoryConfirmed).toBe(true);
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "idle",
      taskId: null,
      loadId: null,
    });
  });

  it("marks business and equipment state unknown when final persistence fails", async () => {
    const repository = new MemoryExecutionRepository();
    repository.failCompletion = true;
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    const executor = new DeterministicInboundExecutor(
      repository,
      equipment,
      new ManualClock(),
      sequentialIdFactory(),
    );

    await expect(
      executor.execute({
        taskId: repository.task.taskId,
        equipmentId: "AMR-01",
        actorId: "test-service",
        warehouseId,
        confirmationReason: "Verified deterministic inbound execution test.",
      }),
    ).rejects.toThrow("database commit failed");

    expect(repository.inventoryConfirmed).toBe(false);
    expect(repository.task.status).toBe("unknown");
    expect(repository.unknownReason).toBe("database commit failed");
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "unknown",
    });
  });

  it("rejects a busy equipment assignment before changing persisted state", async () => {
    const repository = new MemoryExecutionRepository();
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
    await equipment.dispatch({
      commandId: "PREVIOUS-COMMAND",
      equipmentId: "AMR-01",
      command: { type: "assign_task", taskId: "ANOTHER-TASK" },
    });
    const executor = new DeterministicInboundExecutor(
      repository,
      equipment,
      new ManualClock(),
      sequentialIdFactory(),
    );

    await expect(
      executor.execute({
        taskId: repository.task.taskId,
        equipmentId: "AMR-01",
        actorId: "test-service",
        warehouseId,
        confirmationReason: "Verified deterministic inbound execution test.",
      }),
    ).rejects.toThrow("not idle");

    expect(repository.task.status).toBe("queued");
    expect(repository.inventoryConfirmed).toBe(false);
  });

  it("rejects equipment without the required capabilities before assignment", async () => {
    const repository = new MemoryExecutionRepository();
    const equipment = new SimulatorEquipmentAdapter();
    equipment.register(
      {
        ...createMobileTransportDescriptor("SCANNER-01"),
        capabilities: ["identity.scan"],
      },
      "idle",
    );
    const executor = new DeterministicInboundExecutor(
      repository,
      equipment,
      new ManualClock(),
      sequentialIdFactory(),
    );

    await expect(
      executor.execute({
        taskId: repository.task.taskId,
        equipmentId: "SCANNER-01",
        actorId: "test-service",
        warehouseId,
        confirmationReason: "Verified deterministic inbound execution test.",
      }),
    ).rejects.toThrow("lacks capabilities");

    expect(repository.task.status).toBe("queued");
  });
});
