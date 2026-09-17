export const alarmSeverities = ["info", "warning", "critical"] as const;
export type AlarmSeverity = (typeof alarmSeverities)[number];
export type AlarmStatus = "active" | "acknowledged" | "cleared";

export type Alarm = Readonly<{
  alarmId: string;
  sourceId: string;
  code: string;
  severity: AlarmSeverity;
  message: string;
  status: AlarmStatus;
  raisedAt: number;
  acknowledgedAt: number | null;
  acknowledgedBy: string | null;
  clearedAt: number | null;
  clearedBy: string | null;
  resolution: string | null;
  version: number;
}>;

export type AlarmCommand =
  | { type: "acknowledge"; actorId: string; at: number }
  | { type: "clear"; actorId: string; at: number; resolution: string };

export type AlarmTransition =
  | { accepted: true; alarm: Alarm }
  | {
      accepted: false;
      code: "INVALID_TRANSITION" | "INVALID_COMMAND";
      message: string;
      alarm: Alarm;
    };

type NewAlarm = Pick<
  Alarm,
  "alarmId" | "sourceId" | "code" | "severity" | "message" | "raisedAt"
>;

function requireValue(value: string, field: string): void {
  if (value.trim().length === 0) throw new Error(`${field} must not be empty.`);
}

export function createAlarm(input: NewAlarm): Alarm {
  requireValue(input.alarmId, "alarmId");
  requireValue(input.sourceId, "sourceId");
  requireValue(input.code, "code");
  requireValue(input.message, "message");

  return {
    ...input,
    status: "active",
    acknowledgedAt: null,
    acknowledgedBy: null,
    clearedAt: null,
    clearedBy: null,
    resolution: null,
    version: 0,
  };
}

export function transitionAlarm(
  alarm: Alarm,
  command: AlarmCommand,
): AlarmTransition {
  if (alarm.status === "cleared") {
    return {
      accepted: false,
      code: "INVALID_TRANSITION",
      message: `Cannot apply ${command.type} to a cleared alarm.`,
      alarm,
    };
  }

  if (command.at < alarm.raisedAt) {
    return {
      accepted: false,
      code: "INVALID_COMMAND",
      message: "Alarm event time cannot be earlier than raisedAt.",
      alarm,
    };
  }

  if (command.actorId.trim().length === 0) {
    return {
      accepted: false,
      code: "INVALID_COMMAND",
      message: "actorId must not be empty.",
      alarm,
    };
  }

  if (command.type === "acknowledge") {
    if (alarm.status !== "active") {
      return {
        accepted: false,
        code: "INVALID_TRANSITION",
        message: "Only an active alarm can be acknowledged.",
        alarm,
      };
    }
    return {
      accepted: true,
      alarm: {
        ...alarm,
        status: "acknowledged",
        acknowledgedAt: command.at,
        acknowledgedBy: command.actorId,
        version: alarm.version + 1,
      },
    };
  }

  if (command.resolution.trim().length === 0) {
    return {
      accepted: false,
      code: "INVALID_COMMAND",
      message: "resolution must not be empty.",
      alarm,
    };
  }

  return {
    accepted: true,
    alarm: {
      ...alarm,
      status: "cleared",
      clearedAt: command.at,
      clearedBy: command.actorId,
      resolution: command.resolution,
      version: alarm.version + 1,
    },
  };
}
