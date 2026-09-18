import type { Clock } from "../time/clock";
import type {
  EquipmentCommandEnvelope,
  EquipmentCommandResult,
  EquipmentPort,
} from "./equipment-port";

export class RetryableAdapterError extends Error {
  readonly name = "RetryableAdapterError";
}

export type ResilientDispatchResult =
  | Readonly<{
      status: "confirmed";
      attempts: number;
      result: EquipmentCommandResult;
    }>
  | Readonly<{
      status: "unknown";
      attempts: number;
      commandId: string;
      reason: string;
    }>;

export class ResilientEquipmentGateway {
  constructor(
    private readonly adapter: EquipmentPort,
    private readonly clock: Clock,
    private readonly options: Readonly<{
      maximumAttempts: number;
      retryDelayMs: number;
    }>,
  ) {
    if (
      !Number.isSafeInteger(options.maximumAttempts) ||
      options.maximumAttempts < 1
    ) {
      throw new Error("maximumAttempts must be a positive integer.");
    }
    if (
      !Number.isSafeInteger(options.retryDelayMs) ||
      options.retryDelayMs < 0
    ) {
      throw new Error("retryDelayMs must be a non-negative integer.");
    }
  }

  async dispatch(
    envelope: EquipmentCommandEnvelope,
  ): Promise<ResilientDispatchResult> {
    let attempts = 0;
    let reason = "Adapter did not confirm the command outcome.";
    while (attempts < this.options.maximumAttempts) {
      attempts += 1;
      try {
        return {
          status: "confirmed",
          attempts,
          result: await this.adapter.dispatch(envelope),
        };
      } catch (error) {
        if (!(error instanceof RetryableAdapterError)) throw error;
        reason = error.message;
        if (attempts < this.options.maximumAttempts) {
          await new Promise<void>((resolve) => {
            this.clock.schedule(this.options.retryDelayMs, resolve);
          });
        }
      }
    }
    return {
      status: "unknown",
      attempts,
      commandId: envelope.commandId,
      reason,
    };
  }
}
