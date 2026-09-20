import { describe, expect, it, vi } from "vitest";
import type {
  FaultRecoveryRepository,
  PersistedAlarm,
  RecoverableTask,
} from "../../src/application/recovery/fault-recovery";
import { FaultRecoveryService } from "../../src/application/recovery/fault-recovery";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

const taskId = "50000000-0000-4000-8000-000000000001";
const alarmId = "80000000-0000-4000-8000-000000000002";

function identifiers(): () => string {
  const values = [
    "80000000-0000-4000-8000-000000000001",
    alarmId,
    "80000000-0000-4000-8000-000000000003",
    "80000000-0000-4000-8000-000000000004",
    "80000000-0000-4000-8000-000000000005",
    "80000000-0000-4000-8000-000000000006",
    "80000000-0000-4000-8000-000000000007",
    "80000000-0000-4000-8000-000000000008",
  ];
  return () => values.shift() ?? crypto.randomUUID();
}

async function fixture(options?: { failBlock?: boolean }) {
  let task: RecoverableTask = {
    taskId,
    equipmentId: "AMR-01",
    status: "in_progress",
    blockingAlarmId: null,
    version: 2,
  };
  let alarm: PersistedAlarm | null = null;
  const repository: FaultRecoveryRepository = {
    getTask: vi.fn(async () => task),
    blockForFault: vi.fn(async (input) => {
      if (options?.failBlock) throw new Error("database unavailable");
      task = {
        ...task,
        status: "blocked",
        blockingAlarmId: input.alarm.alarmId,
        version: task.version + 1,
      };
      const created: PersistedAlarm = {
        ...input.alarm,
        taskId,
        equipmentId: "AMR-01",
        sourceId: "AMR-01",
        previousTaskStatus: "in_progress",
        status: "active",
        acknowledgedAt: null,
        acknowledgedBy: null,
        clearedAt: null,
        clearedBy: null,
        resolution: null,
        version: 0,
      };
      alarm = created;
      return created;
    }),
    getAlarm: vi.fn(async () => alarm),
    acknowledge: vi.fn(async (input) => {
      if (!alarm) throw new Error("missing alarm");
      alarm = {
        ...alarm,
        status: "acknowledged",
        acknowledgedAt: input.at,
        acknowledgedBy: input.actorId,
        version: alarm.version + 1,
      };
      return alarm;
    }),
    recover: vi.fn(async (input) => {
      task = {
        ...task,
        status:
          input.strategy === "resume"
            ? input.alarm.previousTaskStatus
            : "queued",
        equipmentId:
          input.strategy === "release" ? null : input.alarm.equipmentId,
        blockingAlarmId: null,
        version: task.version + 1,
      };
      return task;
    }),
    markUnknown: vi.fn(async () => {
      task = { ...task, status: "unknown", version: task.version + 1 };
    }),
  };
  const equipment = new SimulatorEquipmentAdapter();
  equipment.register(createMobileTransportDescriptor("AMR-01"), "idle");
  await equipment.dispatch({
    commandId: "assign",
    equipmentId: "AMR-01",
    command: { type: "assign_task", taskId },
  });
  await equipment.dispatch({
    commandId: "start",
    equipmentId: "AMR-01",
    command: { type: "start_pickup" },
  });
  return {
    equipment,
    repository,
    service: new FaultRecoveryService(
      repository,
      equipment,
      new ManualClock(1_000),
      identifiers(),
    ),
  };
}

describe("fault recovery orchestration", () => {
  it("blocks a task, records acknowledgement, and resumes interrupted equipment", async () => {
    const { equipment, service } = await fixture();
    const alarm = await service.injectFault({
      taskId,
      faultCode: "DRIVE_BLOCKED",
      severity: "critical",
      message: "Travel path is blocked.",
      actorId: "operator-01",
      confirmationReason: "Controlled simulator fault drill.",
    });
    expect(alarm).toMatchObject({ alarmId, status: "active" });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "faulted",
      interruptedStatus: "moving_to_pickup",
    });

    await service.acknowledge({
      alarmId,
      actorId: "operator-02",
      confirmationReason: "Alarm evidence reviewed by operator.",
    });
    const recovered = await service.recover({
      alarmId,
      strategy: "resume",
      resolution: "Obstacle removed and route inspected.",
      actorId: "supervisor-01",
      confirmationReason: "Route inspection completed before resume.",
    });

    expect(recovered).toMatchObject({
      taskId,
      status: "in_progress",
      equipmentId: "AMR-01",
      blockingAlarmId: null,
    });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "moving_to_pickup",
      taskId,
      faultCode: null,
    });
  });

  it("releases faulted equipment so the task can be reassigned", async () => {
    const { equipment, service } = await fixture();
    await service.injectFault({
      taskId,
      faultCode: "BATTERY_LOW",
      severity: "warning",
      message: "Battery reserve is below the recovery threshold.",
      actorId: "operator-01",
      confirmationReason: "Controlled low-battery drill.",
    });
    await service.acknowledge({
      alarmId,
      actorId: "operator-01",
      confirmationReason: "Alarm evidence reviewed by operator.",
    });
    const recovered = await service.recover({
      alarmId,
      strategy: "release",
      resolution: "Vehicle released for charging; task returned to queue.",
      actorId: "supervisor-01",
      confirmationReason: "Release approved for charging.",
    });

    expect(recovered).toMatchObject({
      status: "queued",
      equipmentId: null,
      blockingAlarmId: null,
    });
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "idle",
      taskId: null,
      loadId: null,
    });
  });

  it("marks equipment and task unknown when fault persistence fails", async () => {
    const { equipment, repository, service } = await fixture({
      failBlock: true,
    });
    await expect(
      service.injectFault({
        taskId,
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
        actorId: "operator-01",
        confirmationReason: "Controlled persistence-failure drill.",
      }),
    ).rejects.toThrow("database unavailable");

    expect(repository.markUnknown).toHaveBeenCalledWith(
      expect.objectContaining({ taskId, expectedVersion: 2 }),
    );
    expect(await equipment.getState("AMR-01")).toMatchObject({
      status: "unknown",
    });
  });
});
