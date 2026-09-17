export type ScheduledAction = Readonly<{
  id: number;
  cancel(): void;
}>;

export interface Clock {
  now(): number;
  schedule(delayMs: number, action: () => void): ScheduledAction;
}
