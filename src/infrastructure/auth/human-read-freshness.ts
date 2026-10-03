import { AsyncLocalStorage } from "node:async_hooks";
import {
  isHumanSessionExpired,
  isHumanSessionReference,
} from "../../application/access/human-session";

const readPolicy = new AsyncLocalStorage<boolean>();

/** Only server-owned route wrappers may opt in; unknown requests remain strict. */
export function withHumanReadPolicy<T>(
  method: string | undefined,
  work: () => T,
): T {
  return readPolicy.run(method === "GET", work);
}

export function loadHumanReadFreshnessSeconds(): number {
  const configured = process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS;
  if (configured === undefined) return 3600;
  if (!/^\d+$/.test(configured))
    throw new Error(
      "HUMAN_SESSION_READ_FRESHNESS_SECONDS must be an integer from 0 to 3600.",
    );
  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value > 3600)
    throw new Error(
      "HUMAN_SESSION_READ_FRESHNESS_SECONDS must be an integer from 0 to 3600.",
    );
  return value;
}

export function mayReuseHumanReadClaims(
  session: unknown,
  validatedAt: unknown,
  trigger: unknown,
  now = Date.now(),
): boolean {
  if (readPolicy.getStore() !== true || trigger === "update") return false;
  const seconds = loadHumanReadFreshnessSeconds();
  return (
    seconds > 0 &&
    isHumanSessionReference(session) &&
    !isHumanSessionExpired(session, new Date(now)) &&
    typeof validatedAt === "number" &&
    Number.isSafeInteger(validatedAt) &&
    validatedAt > 0 &&
    validatedAt <= now &&
    now - validatedAt < seconds * 1000
  );
}
