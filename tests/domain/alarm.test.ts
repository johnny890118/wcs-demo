import { describe, expect, it } from "vitest";
import { createAlarm, transitionAlarm } from "../../src/domain/alarm/alarm";

describe("alarm lifecycle", () => {
  it("records acknowledgement and clearance accountability", () => {
    let alarm = createAlarm({
      alarmId: "ALARM-01",
      sourceId: "AMR-01",
      code: "DRIVE_BLOCKED",
      severity: "critical",
      message: "Travel path is blocked.",
      raisedAt: 1_000,
    });

    const acknowledged = transitionAlarm(alarm, {
      type: "acknowledge",
      actorId: "operator-01",
      at: 1_200,
    });
    expect(acknowledged.accepted).toBe(true);
    alarm = acknowledged.alarm;

    const cleared = transitionAlarm(alarm, {
      type: "clear",
      actorId: "supervisor-01",
      at: 1_500,
      resolution: "Obstacle removed and route inspected.",
    });

    expect(cleared).toMatchObject({
      accepted: true,
      alarm: {
        status: "cleared",
        acknowledgedBy: "operator-01",
        clearedBy: "supervisor-01",
        version: 2,
      },
    });
  });

  it("requires a resolution before clearing", () => {
    const alarm = createAlarm({
      alarmId: "ALARM-01",
      sourceId: "AMR-01",
      code: "DRIVE_BLOCKED",
      severity: "warning",
      message: "Travel path is blocked.",
      raisedAt: 1_000,
    });

    expect(
      transitionAlarm(alarm, {
        type: "clear",
        actorId: "operator-01",
        at: 1_100,
        resolution: " ",
      }),
    ).toMatchObject({ accepted: false, code: "INVALID_COMMAND" });
  });
});
