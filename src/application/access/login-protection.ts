export type HumanLoginAttemptDecision = Readonly<{
  allowed: boolean;
  retryAfterSeconds: number | null;
}>;

export type HumanLoginProtectionPolicy = Readonly<{
  failureLimit: number;
  failureWindowSeconds: number;
  throttleSeconds: number;
}>;

export function loadHumanLoginProtectionPolicy(): HumanLoginProtectionPolicy {
  return {
    failureLimit: integer("HUMAN_LOGIN_FAILURE_LIMIT", 5, 3, 20),
    failureWindowSeconds: integer(
      "HUMAN_LOGIN_FAILURE_WINDOW_SECONDS",
      900,
      60,
      86_400,
    ),
    throttleSeconds: integer("HUMAN_LOGIN_THROTTLE_SECONDS", 900, 60, 86_400),
  };
}

export function isHumanLoginAttemptDecision(
  value: unknown,
): value is HumanLoginAttemptDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const decision = value as Record<string, unknown>;
  return (
    typeof decision.allowed === "boolean" &&
    (decision.retryAfterSeconds === null ||
      (typeof decision.retryAfterSeconds === "number" &&
        Number.isSafeInteger(decision.retryAfterSeconds) &&
        decision.retryAfterSeconds > 0))
  );
}

function integer(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(
      `${name} must be an integer from ${minimum} to ${maximum}.`,
    );
  }
  return value;
}
