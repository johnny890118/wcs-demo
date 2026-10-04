import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { isOperationalAccess } from "../../application/access/operational-access";
import type { ReadProjectionAuthority } from "../../application/access/read-projection-authority";
import {
  isHumanSessionExpired,
  isHumanSessionReference,
} from "../../application/access/human-session";

const readPolicy = new AsyncLocalStorage<{
  allowed: boolean;
  authority: ReadProjectionAuthority | null;
}>();

/** Only server-owned route wrappers may opt in; unknown requests remain strict. */
export function withHumanReadPolicy<T>(
  method: string | undefined,
  work: () => T,
): T {
  return readPolicy.run({ allowed: method === "GET", authority: null }, work);
}

export function loadHumanReadFreshnessSeconds(): number {
  const configured = process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS;
  if (configured === undefined) return 900;
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
  if (readPolicy.getStore()?.allowed !== true || trigger === "update")
    return false;
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

/** Server-only JWT callback evidence; does not expose the persisted session ref
 * or validation stamp. Concurrent requests cannot share this metadata. */
export function recordHumanReadAuthority(
  access: unknown,
  session: unknown,
  validatedAt: unknown,
  now = Date.now(),
): void {
  const context = readPolicy.getStore();
  if (!context?.allowed) return;
  context.authority = null;
  if (
    !isOperationalAccess(access) ||
    access.principal.kind !== "human" ||
    !isHumanSessionReference(session) ||
    isHumanSessionExpired(session, new Date(now)) ||
    typeof validatedAt !== "number" ||
    !Number.isSafeInteger(validatedAt) ||
    validatedAt <= 0 ||
    validatedAt > now
  )
    return;
  const validUntil = Math.min(
    Date.parse(session.expiresAt),
    validatedAt + loadHumanReadFreshnessSeconds() * 1000,
  );
  const scopeKey = createHash("sha256")
    .update(
      JSON.stringify({
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        subject: access.principal.subject,
        provider: access.principal.identityProvider,
        warehouseId: access.currentWarehouseId,
        permissions: [...access.principal.permissions].sort(),
        scopes: access.principal.warehouseScopes
          .map((scope) => ({
            warehouseId: scope.warehouseId,
            permissions: [...scope.permissions].sort(),
          }))
          .sort((a, b) => a.warehouseId.localeCompare(b.warehouseId)),
      }),
    )
    .digest("hex");
  context.authority = { scopeKey, validUntil };
}
export function humanReadAuthority(): ReadProjectionAuthority | null {
  const authority = readPolicy.getStore()?.authority;
  return authority ? { ...authority } : null;
}
