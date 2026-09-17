import { describe, expect, it } from "vitest";
import {
  OutboxProcessor,
  type EventPublisher,
  type OutboxEvent,
  type OutboxRepository,
} from "../../src/application/outbox/outbox";

class MemoryOutboxRepository implements OutboxRepository {
  published: string[] = [];
  failed: Array<{ id: string; error: string; retryAt: Date }> = [];

  constructor(private readonly events: readonly OutboxEvent[]) {}

  async claimBatch(): Promise<readonly OutboxEvent[]> {
    return this.events;
  }

  async markPublished(eventId: string): Promise<void> {
    this.published.push(eventId);
  }

  async markFailed(
    eventId: string,
    _workerId: string,
    error: string,
    retryAt: Date,
  ): Promise<void> {
    this.failed.push({ id: eventId, error, retryAt });
  }
}

function event(id: string, attempts = 0): OutboxEvent {
  return {
    id,
    aggregateType: "TransportTask",
    aggregateId: "TASK-01",
    eventType: "TransportTaskCompleted",
    payload: {},
    occurredAt: new Date(0),
    attempts,
  };
}

describe("outbox processor", () => {
  it("acknowledges successfully published events", async () => {
    const repository = new MemoryOutboxRepository([event("EVENT-01")]);
    const publisher: EventPublisher = { publish: async () => undefined };
    const processor = new OutboxProcessor(
      repository,
      publisher,
      "WORKER-01",
      () => new Date(1_000),
    );

    await expect(processor.drainOnce()).resolves.toEqual({
      claimed: 1,
      published: 1,
      failed: 0,
    });
    expect(repository.published).toEqual(["EVENT-01"]);
  });

  it("releases failures with bounded exponential retry timing", async () => {
    const repository = new MemoryOutboxRepository([event("EVENT-01", 3)]);
    const publisher: EventPublisher = {
      publish: async () => {
        throw new Error("broker unavailable");
      },
    };
    const processor = new OutboxProcessor(
      repository,
      publisher,
      "WORKER-01",
      () => new Date(1_000),
    );

    await expect(processor.drainOnce()).resolves.toEqual({
      claimed: 1,
      published: 0,
      failed: 1,
    });
    expect(repository.failed).toEqual([
      {
        id: "EVENT-01",
        error: "broker unavailable",
        retryAt: new Date(9_000),
      },
    ]);
  });
});
