const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const defaultHumanSessionTtlSeconds = 8 * 60 * 60;
const minimumHumanSessionTtlSeconds = 15 * 60;
const maximumHumanSessionTtlSeconds = 24 * 60 * 60;

export type HumanSessionReference = Readonly<{
  sessionId: string;
  expiresAt: string;
}>;

export function isHumanSessionReference(
  value: unknown,
): value is HumanSessionReference {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.sessionId === "string" &&
    uuidPattern.test(session.sessionId) &&
    typeof session.expiresAt === "string" &&
    Number.isFinite(Date.parse(session.expiresAt))
  );
}

export function isHumanSessionExpired(
  session: HumanSessionReference,
  now = new Date(),
): boolean {
  return Date.parse(session.expiresAt) <= now.getTime();
}

export function loadHumanSessionTtlSeconds(): number {
  const configured = process.env.HUMAN_SESSION_TTL_SECONDS;
  if (!configured) return defaultHumanSessionTtlSeconds;
  const value = Number(configured);
  if (
    !Number.isSafeInteger(value) ||
    value < minimumHumanSessionTtlSeconds ||
    value > maximumHumanSessionTtlSeconds
  ) {
    throw new Error(
      "HUMAN_SESSION_TTL_SECONDS must be an integer from 900 to 86400.",
    );
  }
  return value;
}
