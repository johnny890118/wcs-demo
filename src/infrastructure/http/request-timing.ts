import { AsyncLocalStorage } from "node:async_hooks";

/** Fixed names only: never include resource IDs, URLs, credentials or SQL. */
export type TimingStage =
  | "session_validation"
  | "projection_api"
  | "api_handler"
  | "database_query";

type TimingContext = {
  stages: Partial<Record<TimingStage, number>>;
};

const timingContext = new AsyncLocalStorage<TimingContext>();

export function withRequestTiming<T>(work: () => T): T {
  return timingContext.run({ stages: {} }, work);
}

export function recordRequestTiming(stage: TimingStage, milliseconds: number) {
  captureRequestTimingRecorder(stage)(milliseconds);
}

/** Capture attribution at dispatch: pooled callback resources may have another context. */
export function captureRequestTimingRecorder(stage: TimingStage) {
  const context = timingContext.getStore();
  return (milliseconds: number) => {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
    if (context) {
      context.stages[stage] = (context.stages[stage] ?? 0) + milliseconds;
    }
  };
}

export async function measureRequestTiming<T>(
  stage: TimingStage,
  work: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    return await work();
  } finally {
    recordRequestTiming(stage, performance.now() - started);
  }
}

export function requestTimingHeader(): string {
  const stages = timingContext.getStore()?.stages ?? {};
  return Object.entries(stages)
    .map(([stage, duration]) => `${stage};dur=${duration.toFixed(2)}`)
    .join(", ");
}

/** Consume only this API's fixed timing vocabulary, never arbitrary descriptions. */
export function recordUpstreamTiming(header: string | null): void {
  if (!header || header.length > 1024) return;
  for (const part of header.split(",")) {
    const match =
      /^\s*(api_handler|database_query);dur=(\d+(?:\.\d+)?)\s*$/.exec(part);
    if (match) recordRequestTiming(match[1] as TimingStage, Number(match[2]));
  }
}
