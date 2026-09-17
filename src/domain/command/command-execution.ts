export type CommandExecutionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "unknown";

export type CommandExecution = Readonly<{
  commandId: string;
  status: CommandExecutionStatus;
  requestedAt: number;
  deadlineAt: number;
  resolvedAt: number | null;
  rejectionCode: string | null;
  version: number;
}>;

export type CommandOutcome =
  | { type: "accept"; at: number }
  | { type: "reject"; at: number; code: string }
  | { type: "timeout"; at: number };

export type CommandOutcomeResult =
  | { accepted: true; execution: CommandExecution }
  | {
      accepted: false;
      code: "INVALID_TRANSITION" | "INVALID_COMMAND";
      message: string;
      execution: CommandExecution;
    };

export function createCommandExecution(
  commandId: string,
  requestedAt: number,
  timeoutMs: number,
): CommandExecution {
  if (commandId.trim().length === 0) {
    throw new Error("commandId must not be empty.");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("timeoutMs must be greater than zero.");
  }

  return {
    commandId,
    status: "pending",
    requestedAt,
    deadlineAt: requestedAt + timeoutMs,
    resolvedAt: null,
    rejectionCode: null,
    version: 0,
  };
}

export function recordCommandOutcome(
  execution: CommandExecution,
  outcome: CommandOutcome,
): CommandOutcomeResult {
  if (execution.status !== "pending") {
    return {
      accepted: false,
      code: "INVALID_TRANSITION",
      message: `Command ${execution.commandId} is already ${execution.status}.`,
      execution,
    };
  }
  if (outcome.at < execution.requestedAt) {
    return {
      accepted: false,
      code: "INVALID_COMMAND",
      message: "Outcome time cannot be earlier than requestedAt.",
      execution,
    };
  }
  if (outcome.type === "timeout" && outcome.at < execution.deadlineAt) {
    return {
      accepted: false,
      code: "INVALID_TRANSITION",
      message: "A command cannot time out before its deadline.",
      execution,
    };
  }
  if (outcome.type !== "timeout" && outcome.at > execution.deadlineAt) {
    return {
      accepted: false,
      code: "INVALID_TRANSITION",
      message: "A late response cannot establish a safe command outcome.",
      execution,
    };
  }
  if (outcome.type === "reject" && outcome.code.trim().length === 0) {
    return {
      accepted: false,
      code: "INVALID_COMMAND",
      message: "A rejected command requires a rejection code.",
      execution,
    };
  }

  return {
    accepted: true,
    execution: {
      ...execution,
      status:
        outcome.type === "accept"
          ? "accepted"
          : outcome.type === "reject"
            ? "rejected"
            : "unknown",
      resolvedAt: outcome.at,
      rejectionCode: outcome.type === "reject" ? outcome.code : null,
      version: execution.version + 1,
    },
  };
}
