import type { Clock, ScheduledAction } from "../time/clock";
import {
  createCommandExecution,
  recordCommandOutcome,
  type CommandExecution,
  type CommandOutcomeResult,
} from "../../domain/command/command-execution";

type TrackedCommand = {
  execution: CommandExecution;
  timeout: ScheduledAction;
};

export class CommandTracker {
  readonly #commands = new Map<string, TrackedCommand>();

  constructor(private readonly clock: Clock) {}

  request(commandId: string, timeoutMs: number): CommandExecution {
    if (this.#commands.has(commandId)) {
      throw new Error(`Command ${commandId} is already tracked.`);
    }

    const execution = createCommandExecution(
      commandId,
      this.clock.now(),
      timeoutMs,
    );
    const tracked: TrackedCommand = {
      execution,
      timeout: this.clock.schedule(timeoutMs, () => {
        const result = recordCommandOutcome(tracked.execution, {
          type: "timeout",
          at: this.clock.now(),
        });
        if (result.accepted) tracked.execution = result.execution;
      }),
    };
    this.#commands.set(commandId, tracked);
    return execution;
  }

  get(commandId: string): CommandExecution | null {
    return this.#commands.get(commandId)?.execution ?? null;
  }

  resolve(
    commandId: string,
    outcome: { type: "accept" } | { type: "reject"; code: string },
  ): CommandOutcomeResult {
    const tracked = this.#commands.get(commandId);
    if (!tracked) throw new Error(`Command ${commandId} is not tracked.`);

    const result = recordCommandOutcome(tracked.execution, {
      ...outcome,
      at: this.clock.now(),
    });
    if (result.accepted) {
      tracked.execution = result.execution;
      tracked.timeout.cancel();
    }
    return result;
  }
}
