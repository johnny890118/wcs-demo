import type { Clock, ScheduledAction } from "../../application/time/clock";

type QueueItem = {
  id: number;
  dueAt: number;
  action: () => void;
  cancelled: boolean;
};

export class ManualClock implements Clock {
  #currentTime: number;
  #nextId = 1;
  readonly #queue: QueueItem[] = [];

  constructor(startAt = 0) {
    if (!Number.isFinite(startAt)) throw new Error("startAt must be finite.");
    this.#currentTime = startAt;
  }

  now(): number {
    return this.#currentTime;
  }

  schedule(delayMs: number, action: () => void): ScheduledAction {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new Error("delayMs must be zero or greater.");
    }

    const item: QueueItem = {
      id: this.#nextId++,
      dueAt: this.#currentTime + delayMs,
      action,
      cancelled: false,
    };
    this.#queue.push(item);

    return {
      id: item.id,
      cancel: () => {
        item.cancelled = true;
      },
    };
  }

  advanceBy(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new Error("durationMs must be zero or greater.");
    }
    this.advanceTo(this.#currentTime + durationMs);
  }

  advanceTo(targetTime: number): void {
    if (!Number.isFinite(targetTime) || targetTime < this.#currentTime) {
      throw new Error("targetTime cannot move the clock backwards.");
    }

    while (true) {
      const next = this.#queue
        .filter((item) => !item.cancelled && item.dueAt <= targetTime)
        .sort(
          (left, right) => left.dueAt - right.dueAt || left.id - right.id,
        )[0];

      if (!next) break;
      this.#queue.splice(this.#queue.indexOf(next), 1);
      this.#currentTime = next.dueAt;
      next.action();
    }

    this.#currentTime = targetTime;
    for (let index = this.#queue.length - 1; index >= 0; index -= 1) {
      if (this.#queue[index]?.cancelled) this.#queue.splice(index, 1);
    }
  }

  pendingCount(): number {
    return this.#queue.filter((item) => !item.cancelled).length;
  }
}
