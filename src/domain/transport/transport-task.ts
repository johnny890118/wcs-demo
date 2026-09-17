export const transportTaskStatuses = [
  "queued",
  "assigned",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
  "unknown",
] as const;

export type TransportTaskStatus = (typeof transportTaskStatuses)[number];

export type TransportTask = Readonly<{
  taskId: string;
  loadId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  status: TransportTaskStatus;
  equipmentId: string | null;
  blockingAlarmId: string | null;
  version: number;
}>;

export type TransportTaskCommand =
  | { type: "assign"; equipmentId: string }
  | { type: "start" }
  | { type: "block"; alarmId: string }
  | { type: "resume" }
  | { type: "complete" }
  | { type: "cancel" }
  | { type: "mark_unknown" };

export type TransportTaskTransition =
  | { accepted: true; task: TransportTask }
  | {
      accepted: false;
      code: "INVALID_TRANSITION" | "INVALID_COMMAND";
      message: string;
      task: TransportTask;
    };

type NewTransportTask = Pick<
  TransportTask,
  "taskId" | "loadId" | "sourceLocationId" | "destinationLocationId"
>;

function requireValue(value: string, field: string): void {
  if (value.trim().length === 0) throw new Error(`${field} must not be empty.`);
}

export function createTransportTask(input: NewTransportTask): TransportTask {
  requireValue(input.taskId, "taskId");
  requireValue(input.loadId, "loadId");
  requireValue(input.sourceLocationId, "sourceLocationId");
  requireValue(input.destinationLocationId, "destinationLocationId");

  if (input.sourceLocationId === input.destinationLocationId) {
    throw new Error("Source and destination locations must be different.");
  }

  return {
    ...input,
    status: "queued",
    equipmentId: null,
    blockingAlarmId: null,
    version: 0,
  };
}

function accept(
  task: TransportTask,
  changes: Partial<TransportTask>,
): TransportTaskTransition {
  return {
    accepted: true,
    task: { ...task, ...changes, version: task.version + 1 },
  };
}

function reject(
  task: TransportTask,
  command: TransportTaskCommand,
  code: "INVALID_TRANSITION" | "INVALID_COMMAND" = "INVALID_TRANSITION",
  message = `Cannot apply ${command.type} while task is ${task.status}.`,
): TransportTaskTransition {
  return { accepted: false, code, message, task };
}

export function transitionTransportTask(
  task: TransportTask,
  command: TransportTaskCommand,
): TransportTaskTransition {
  if (command.type === "mark_unknown") {
    if (task.status === "completed" || task.status === "cancelled") {
      return reject(task, command);
    }
    return task.status === "unknown"
      ? { accepted: true, task }
      : accept(task, { status: "unknown" });
  }

  switch (task.status) {
    case "queued":
      if (command.type === "cancel") {
        return accept(task, { status: "cancelled" });
      }
      if (command.type !== "assign") return reject(task, command);
      if (command.equipmentId.trim().length === 0) {
        return reject(
          task,
          command,
          "INVALID_COMMAND",
          "equipmentId must not be empty.",
        );
      }
      return accept(task, {
        status: "assigned",
        equipmentId: command.equipmentId,
      });

    case "assigned":
      if (command.type === "start") {
        return accept(task, { status: "in_progress" });
      }
      if (command.type === "cancel") {
        return accept(task, {
          status: "cancelled",
          equipmentId: null,
        });
      }
      return reject(task, command);

    case "in_progress":
      if (command.type === "complete") {
        return accept(task, { status: "completed" });
      }
      if (command.type !== "block") return reject(task, command);
      if (command.alarmId.trim().length === 0) {
        return reject(
          task,
          command,
          "INVALID_COMMAND",
          "alarmId must not be empty.",
        );
      }
      return accept(task, {
        status: "blocked",
        blockingAlarmId: command.alarmId,
      });

    case "blocked":
      return command.type === "resume"
        ? accept(task, {
            status: "in_progress",
            blockingAlarmId: null,
          })
        : reject(task, command);

    case "completed":
    case "cancelled":
    case "unknown":
      return reject(task, command);
  }
}
