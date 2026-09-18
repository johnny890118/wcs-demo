import { describe, expect, it } from "vitest";
import { EquipmentLinkSupervisor } from "../../src/application/equipment/equipment-link-supervisor";
import type { EquipmentPort } from "../../src/application/equipment/equipment-port";
import {
  ResilientEquipmentGateway,
  RetryableAdapterError,
} from "../../src/application/equipment/resilient-equipment-gateway";
import type { Clock, ScheduledAction } from "../../src/application/time/clock";
import { createEquipmentState } from "../../src/domain/equipment/equipment-state-machine";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { ManualClock } from "../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";

class ImmediateClock implements Clock {
  now(): number {
    return 0;
  }
  schedule(_delayMs: number, action: () => void): ScheduledAction {
    action();
    return { id: 1, cancel() {} };
  }
}

function flakyAdapter(failures: number): EquipmentPort {
  const inner = new SimulatorEquipmentAdapter();
  inner.register(createMobileTransportDescriptor("AMR-01"), "idle");
  let remaining = failures;
  return {
    getDescriptor: (id) => inner.getDescriptor(id),
    getState: (id) => inner.getState(id),
    dispatch: async (envelope) => {
      if (remaining > 0) {
        remaining -= 1;
        throw new RetryableAdapterError(
          "Connection closed before acknowledgement.",
        );
      }
      return inner.dispatch(envelope);
    },
  };
}

const command = {
  commandId: "CMD-01",
  equipmentId: "AMR-01",
  command: { type: "assign_task", taskId: "TASK-01" } as const,
};

describe("equipment connection resilience", () => {
  it("retries the same idempotency key and confirms a later acknowledgement", async () => {
    const result = await new ResilientEquipmentGateway(
      flakyAdapter(1),
      new ImmediateClock(),
      {
        maximumAttempts: 3,
        retryDelayMs: 100,
      },
    ).dispatch(command);

    expect(result).toMatchObject({ status: "confirmed", attempts: 2 });
  });

  it("returns an explicit unknown outcome after bounded retry exhaustion", async () => {
    const result = await new ResilientEquipmentGateway(
      flakyAdapter(3),
      new ImmediateClock(),
      {
        maximumAttempts: 3,
        retryDelayMs: 100,
      },
    ).dispatch(command);

    expect(result).toEqual({
      status: "unknown",
      attempts: 3,
      commandId: "CMD-01",
      reason: "Connection closed before acknowledgement.",
    });
  });

  it("distinguishes current, stale, and disconnected telemetry", () => {
    const clock = new ManualClock(1_000);
    const supervisor = new EquipmentLinkSupervisor(clock, 500);
    supervisor.setConnection("AMR-01", "connected");
    supervisor.observe(createEquipmentState("AMR-01", "idle"));

    expect(supervisor.assess("AMR-01")).toMatchObject({
      status: "current",
      ageMs: 0,
    });
    clock.advanceBy(501);
    expect(supervisor.assess("AMR-01")).toMatchObject({
      status: "stale",
      ageMs: 501,
    });
    supervisor.setConnection("AMR-01", "disconnected");
    expect(supervisor.assess("AMR-01")).toMatchObject({
      status: "disconnected",
      lastObservedAt: 1_000,
    });
  });
});
