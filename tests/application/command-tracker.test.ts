import { describe, expect, it } from "vitest";
import { CommandTracker } from "../../src/application/command/command-tracker";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";

describe("deterministic command tracking", () => {
  it("marks a command unknown exactly at its deadline", () => {
    const clock = new ManualClock(10_000);
    const tracker = new CommandTracker(clock);
    tracker.request("CMD-01", 500);

    clock.advanceBy(499);
    expect(tracker.get("CMD-01")?.status).toBe("pending");

    clock.advanceBy(1);
    expect(tracker.get("CMD-01")).toMatchObject({
      status: "unknown",
      resolvedAt: 10_500,
    });
  });

  it("cancels the timeout after a deterministic response", () => {
    const clock = new ManualClock(10_000);
    const tracker = new CommandTracker(clock);
    tracker.request("CMD-01", 500);
    clock.advanceBy(200);

    const result = tracker.resolve("CMD-01", {
      type: "accept",
    });
    expect(result).toMatchObject({
      accepted: true,
      execution: { status: "accepted" },
    });

    clock.advanceBy(500);
    expect(tracker.get("CMD-01")?.status).toBe("accepted");
    expect(clock.pendingCount()).toBe(0);
  });

  it("executes same-time actions in stable insertion order", () => {
    const clock = new ManualClock();
    const observed: string[] = [];
    clock.schedule(100, () => observed.push("first"));
    clock.schedule(100, () => observed.push("second"));

    clock.advanceBy(100);
    expect(observed).toEqual(["first", "second"]);
  });
});
