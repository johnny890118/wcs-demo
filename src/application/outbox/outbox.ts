export type OutboxEvent = Readonly<{
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  attempts: number;
}>;

export interface OutboxRepository {
  claimBatch(
    workerId: string,
    batchSize: number,
    leaseMs: number,
    now: Date,
  ): Promise<readonly OutboxEvent[]>;
  markPublished(eventId: string, workerId: string, at: Date): Promise<void>;
  markFailed(
    eventId: string,
    workerId: string,
    error: string,
    retryAt: Date,
  ): Promise<void>;
}

export interface EventPublisher {
  publish(event: OutboxEvent): Promise<void>;
}

export type OutboxDrainResult = Readonly<{
  claimed: number;
  published: number;
  failed: number;
}>;

export class OutboxProcessor {
  constructor(
    private readonly repository: OutboxRepository,
    private readonly publisher: EventPublisher,
    private readonly workerId: string,
    private readonly now: () => Date = () => new Date(),
    private readonly batchSize = 50,
    private readonly leaseMs = 30_000,
  ) {}

  async drainOnce(): Promise<OutboxDrainResult> {
    const events = await this.repository.claimBatch(
      this.workerId,
      this.batchSize,
      this.leaseMs,
      this.now(),
    );
    let published = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.publisher.publish(event);
        await this.repository.markPublished(
          event.id,
          this.workerId,
          this.now(),
        );
        published += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        const delayMs = Math.min(60_000, 1_000 * 2 ** event.attempts);
        await this.repository.markFailed(
          event.id,
          this.workerId,
          message,
          new Date(this.now().getTime() + delayMs),
        );
        failed += 1;
      }
    }

    return { claimed: events.length, published, failed };
  }
}
