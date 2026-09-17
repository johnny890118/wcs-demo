import { describe, expect, it } from "vitest";
import {
  createTransportTask,
  transitionTransportTask,
  type TransportTask,
  type TransportTaskCommand,
} from "../../src/domain/transport/transport-task";

function createTask(): TransportTask {
  return createTransportTask({
    taskId: "TASK-01",
    loadId: "LOAD-01",
    sourceLocationId: "DOCK-01",
    destinationLocationId: "BIN-A-01",
  });
}

function apply(
  task: TransportTask,
  command: TransportTaskCommand,
): TransportTask {
  const result = transitionTransportTask(task, command);
  expect(result.accepted).toBe(true);
  return result.task;
}

describe("transport task state machine", () => {
  it("completes a transport through explicit assignment and execution", () => {
    let task = createTask();
    task = apply(task, { type: "assign", equipmentId: "AMR-01" });
    task = apply(task, { type: "start" });
    task = apply(task, { type: "complete" });

    expect(task).toMatchObject({
      status: "completed",
      equipmentId: "AMR-01",
      version: 3,
    });
  });

  it("blocks on an alarm and resumes only through reconciliation", () => {
    let task = createTask();
    task = apply(task, { type: "assign", equipmentId: "AMR-01" });
    task = apply(task, { type: "start" });
    task = apply(task, { type: "block", alarmId: "ALARM-01" });

    expect(transitionTransportTask(task, { type: "complete" })).toMatchObject({
      accepted: false,
      code: "INVALID_TRANSITION",
    });

    task = apply(task, { type: "resume" });
    expect(task).toMatchObject({
      status: "in_progress",
      blockingAlarmId: null,
    });
  });

  it("does not allow terminal task outcomes to be overwritten", () => {
    const cancelled = apply(createTask(), { type: "cancel" });
    const result = transitionTransportTask(cancelled, { type: "mark_unknown" });

    expect(result).toMatchObject({
      accepted: false,
      task: cancelled,
    });
  });
});
