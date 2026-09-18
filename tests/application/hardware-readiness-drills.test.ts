import { describe, expect, it } from "vitest";
import { reconcileEquipmentCommand } from "../../src/application/equipment/command-reconciliation";
import {
  ResilientEquipmentGateway,
  RetryableAdapterError,
} from "../../src/application/equipment/resilient-equipment-gateway";
import type { Clock, ScheduledAction } from "../../src/application/time/clock";
import {
  OutboxProcessor,
  type OutboxEvent,
  type OutboxRepository,
} from "../../src/application/outbox/outbox";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { createEquipmentState } from "../../src/domain/equipment/equipment-state-machine";
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

const envelope = {
  commandId: "CMD-DRILL-01",
  equipmentId: "AMR-DRILL-01",
  command: { type: "assign_task", taskId: "TASK-DRILL-01" } as const,
};

function simulator() {
  const adapter = new SimulatorEquipmentAdapter();
  adapter.register(createMobileTransportDescriptor("AMR-DRILL-01"), "idle");
  return adapter;
}

describe("hardware readiness drills", () => {
  it("recovers an acknowledgement-loss retry through command idempotency", async () => {
    const inner = simulator();
    let loseFirstAcknowledgement = true;
    const gateway = new ResilientEquipmentGateway(
      {
        getDescriptor: (id) => inner.getDescriptor(id),
        getState: (id) => inner.getState(id),
        dispatch: async (command) => {
          const result = await inner.dispatch(command);
          if (loseFirstAcknowledgement) {
            loseFirstAcknowledgement = false;
            throw new RetryableAdapterError("Acknowledgement frame was lost.");
          }
          return result;
        },
      },
      new ImmediateClock(),
      { maximumAttempts: 2, retryDelayMs: 10 },
    );

    const outcome = await gateway.dispatch(envelope);
    expect(outcome).toMatchObject({
      status: "confirmed",
      attempts: 2,
      result: { duplicate: true },
    });
    expect(await inner.getState("AMR-DRILL-01")).toMatchObject({
      status: "assigned",
      version: 1,
    });
  });

  it("reconciles applied, not-applied, and divergent unknown outcomes", async () => {
    const before = createEquipmentState("AMR-DRILL-01", "idle");
    const appliedAdapter = simulator();
    const applied = await appliedAdapter.dispatch(envelope);
    expect(applied.transition.accepted).toBe(true);
    if (!applied.transition.accepted)
      throw new Error("Fixture command failed.");

    expect(
      reconcileEquipmentCommand(
        before,
        envelope.command,
        applied.transition.state,
      ),
    ).toMatchObject({ status: "confirmed-applied" });
    expect(
      reconcileEquipmentCommand(before, envelope.command, before),
    ).toMatchObject({
      status: "confirmed-not-applied",
    });
    expect(
      reconcileEquipmentCommand(before, envelope.command, {
        ...applied.transition.state,
        status: "unknown",
        version: 2,
      }),
    ).toMatchObject({ status: "unresolved", reason: "state-diverged" });
  });

  it("keeps local execution available while WAN event publication is down", async () => {
    const adapter = simulator();
    await adapter.dispatch(envelope);
    await adapter.dispatch({
      commandId: "CMD-DRILL-02",
      equipmentId: "AMR-DRILL-01",
      command: { type: "start_pickup" },
    });

    const event: OutboxEvent = {
      id: "EVENT-WAN-01",
      aggregateType: "TransportTask",
      aggregateId: "TASK-DRILL-01",
      eventType: "TransportTaskStarted",
      payload: {},
      occurredAt: new Date(0),
      attempts: 0,
    };
    const failures: string[] = [];
    const repository: OutboxRepository = {
      claimBatch: async () => [event],
      markPublished: async () => undefined,
      markFailed: async (eventId) => {
        failures.push(eventId);
      },
    };
    const result = await new OutboxProcessor(
      repository,
      {
        publish: async () => {
          throw new Error("WAN unavailable");
        },
      },
      "EDGE-WORKER",
      () => new Date(0),
    ).drainOnce();

    expect(await adapter.getState("AMR-DRILL-01")).toMatchObject({
      status: "moving_to_pickup",
      version: 2,
    });
    expect(result).toEqual({ claimed: 1, published: 0, failed: 1 });
    expect(failures).toEqual(["EVENT-WAN-01"]);
  });
});
