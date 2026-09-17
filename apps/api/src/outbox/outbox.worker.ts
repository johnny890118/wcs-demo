import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { OutboxProcessor } from "../../../../src/application/outbox/outbox";
import { JsonLogger } from "../logging/json-logger";

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  #timer: NodeJS.Timeout | null = null;
  #running = false;

  constructor(
    private readonly processor: OutboxProcessor,
    private readonly logger: JsonLogger,
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1_000);
    if (!Number.isSafeInteger(intervalMs) || intervalMs < 100) {
      throw new Error(
        "OUTBOX_POLL_INTERVAL_MS must be an integer of at least 100.",
      );
    }
    this.#timer = setInterval(() => void this.tick(), intervalMs);
    this.#timer.unref();
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.#timer) clearInterval(this.#timer);
  }

  private async tick(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    try {
      const result = await this.processor.drainOnce();
      if (result.claimed > 0) {
        this.logger.log(
          { event: "outbox.drain", ...result },
          OutboxWorker.name,
        );
      }
    } catch (error) {
      this.logger.error(error, undefined, OutboxWorker.name);
    } finally {
      this.#running = false;
    }
  }
}

export function createOutboxWorkerId(): string {
  return `${hostname()}:${process.pid}:${randomUUID()}`;
}
