export type AcknowledgeAlarmRequest = Readonly<{
  confirmedAction: "acknowledge_alarm";
  confirmationReason: string;
}>;

export type RecoverAlarmRequest = Readonly<{
  strategy: "resume" | "release";
  resolution: string;
  confirmedAction: "resume_task" | "release_task";
  confirmationReason: string;
}>;

export type AlarmAcknowledged = Readonly<{
  alarmId: string;
  status: "acknowledged";
}>;

export type AlarmRecovered = Readonly<{
  taskId: string;
  equipmentId: string | null;
  status: "queued" | "assigned" | "in_progress" | "unknown";
  blockingAlarmId: string | null;
  version: number;
}>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function reason(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length >= 8 && value.length <= 500
  );
}

export function isAcknowledgeAlarmRequest(
  value: unknown,
): value is AcknowledgeAlarmRequest {
  const data = record(value);
  return Boolean(
    data &&
      data.confirmedAction === "acknowledge_alarm" &&
      reason(data.confirmationReason),
  );
}

export function isRecoverAlarmRequest(
  value: unknown,
): value is RecoverAlarmRequest {
  const data = record(value);
  return Boolean(
    data &&
      (data.strategy === "resume" || data.strategy === "release") &&
      data.confirmedAction === `${data.strategy}_task` &&
      reason(data.confirmationReason) &&
      typeof data.resolution === "string" &&
      data.resolution.trim().length > 0 &&
      data.resolution.length <= 500,
  );
}

export function isAlarmAcknowledged(
  value: unknown,
): value is AlarmAcknowledged {
  const data = record(value);
  return Boolean(
    data && typeof data.alarmId === "string" && data.status === "acknowledged",
  );
}

export function isAlarmRecovered(value: unknown): value is AlarmRecovered {
  const data = record(value);
  return Boolean(
    data &&
      typeof data.taskId === "string" &&
      (data.equipmentId === null || typeof data.equipmentId === "string") &&
      ["queued", "assigned", "in_progress", "unknown"].includes(
        data.status as string,
      ) &&
      data.blockingAlarmId === null &&
      typeof data.version === "number",
  );
}
