import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  hasUserPermission,
  isOperationalAccess,
  type DemoSessionScope,
  type OperationalAccess,
  type OperationalRuntime,
  type UserPermission,
  userPermissions,
} from "../../application/access/operational-access";

export const anonymousDemoCookieName = "swp_anonymous_demo";
const carrierAudience = "swp-public-demo";
const defaultTtlMs = 30 * 60 * 1_000;
const minimumTtlMs = 5 * 60 * 1_000;
const maximumTtlMs = 2 * 60 * 60 * 1_000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CarrierPayload = Readonly<{
  version: 1;
  audience: typeof carrierAudience;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
}>;

export type AnonymousDemoCarrier = Readonly<{
  token: string;
  scope: DemoSessionScope;
  maxAgeSeconds: number;
}>;

export type AnonymousDemoAuthorization =
  | Readonly<{ allowed: true; access: OperationalAccess }>
  | Readonly<{
      allowed: false;
      reason: "unavailable" | "missing" | "invalid" | "forbidden";
    }>;

function requiredSecret(): string {
  const secret = process.env.ANONYMOUS_DEMO_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("ANONYMOUS_DEMO_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

function parseTtlMs(): number {
  const configured = process.env.ANONYMOUS_DEMO_SESSION_TTL_SECONDS;
  if (!configured) return defaultTtlMs;
  const value = Number(configured) * 1_000;
  if (
    !Number.isSafeInteger(value) ||
    value < minimumTtlMs ||
    value > maximumTtlMs
  ) {
    throw new Error(
      "ANONYMOUS_DEMO_SESSION_TTL_SECONDS must be an integer from 300 to 7200.",
    );
  }
  return value;
}

function configuredPermissions(): readonly UserPermission[] {
  const configured = process.env.PUBLIC_DEMO_USER_PERMISSIONS;
  if (!configured) return ["operations.view"];
  const permissions = configured
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (
    permissions.length === 0 ||
    new Set(permissions).size !== permissions.length ||
    !permissions.every((permission) =>
      userPermissions.includes(permission as UserPermission),
    )
  ) {
    throw new Error(
      "PUBLIC_DEMO_USER_PERMISSIONS contains invalid permissions.",
    );
  }
  return permissions as UserPermission[];
}

function configuredValue(
  name: string,
  fallback: string,
  maximum: number,
): string {
  const value = process.env[name]?.trim() || fallback;
  if (value.length > maximum) throw new Error(`${name} is too long.`);
  return value;
}

export function issueAnonymousDemoCarrier(
  options: {
    now?: Date;
    createId?: () => string;
  } = {},
): AnonymousDemoCarrier {
  const now = options.now ?? new Date();
  const ttlMs = parseTtlMs();
  const payload: CarrierPayload = {
    version: 1,
    audience: carrierAudience,
    sessionId: (options.createId ?? randomUUID)(),
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };
  if (!uuidPattern.test(payload.sessionId)) {
    throw new Error("Anonymous demo session IDs must be UUIDs.");
  }
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signed = signature(encoded, requiredSecret()).toString("base64url");
  return {
    token: `${encoded}.${signed}`,
    scope: { sessionId: payload.sessionId, expiresAt: payload.expiresAt },
    maxAgeSeconds: ttlMs / 1_000,
  };
}

export function verifyAnonymousDemoCarrier(
  token: string,
  now = new Date(),
): DemoSessionScope | null {
  if (token.length > 2_048) return null;
  const [encoded, provided, extra] = token.split(".");
  if (!encoded || !provided || extra) return null;
  let providedSignature: Buffer;
  try {
    providedSignature = Buffer.from(provided, "base64url");
  } catch {
    return null;
  }
  const expected = signature(encoded, requiredSecret());
  if (
    providedSignature.length !== expected.length ||
    !timingSafeEqual(providedSignature, expected)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<CarrierPayload>;
    const issuedAt = Date.parse(payload.issuedAt ?? "");
    const expiresAt = Date.parse(payload.expiresAt ?? "");
    if (
      payload.version !== 1 ||
      payload.audience !== carrierAudience ||
      typeof payload.sessionId !== "string" ||
      !uuidPattern.test(payload.sessionId) ||
      !Number.isFinite(issuedAt) ||
      !Number.isFinite(expiresAt) ||
      issuedAt > now.getTime() + 60_000 ||
      expiresAt <= now.getTime() ||
      expiresAt - issuedAt < minimumTtlMs ||
      expiresAt - issuedAt > maximumTtlMs
    ) {
      return null;
    }
    return {
      sessionId: payload.sessionId,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  } catch {
    return null;
  }
}

export function createAnonymousDemoAccess(
  scope: DemoSessionScope,
): OperationalAccess {
  const warehouseId = configuredValue(
    "DEMO_WAREHOUSE_ID",
    "10000000-0000-4000-8000-000000000001",
    36,
  );
  const permissions = configuredPermissions();
  const access: OperationalAccess = {
    principal: {
      kind: "anonymous_demo",
      subject: `anonymous-demo:${scope.sessionId}`,
      displayName: "Anonymous Demo",
      identityProvider: "anonymous-demo-carrier",
      permissions,
      warehouseScopes: [
        {
          warehouseId,
          code: configuredValue("DEMO_WAREHOUSE_CODE", "DEMO", 50),
          name: configuredValue(
            "DEMO_WAREHOUSE_NAME",
            "Deterministic Demo Warehouse",
            160,
          ),
          permissions,
        },
      ],
    },
    currentWarehouseId: warehouseId,
    demoSessionScope: scope,
  };
  if (!isOperationalAccess(access)) {
    throw new Error("Anonymous demo access configuration is invalid.");
  }
  return access;
}

function cookieValue(cookieHeader: string | undefined): string | null {
  for (const part of (cookieHeader ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === anonymousDemoCookieName) {
      return part.slice(separator + 1).trim() || null;
    }
  }
  return null;
}

export function authorizeAnonymousDemoCarrier(input: {
  cookieHeader?: string;
  permission: UserPermission;
  runtime: OperationalRuntime;
  now?: Date;
}): AnonymousDemoAuthorization {
  if (
    input.runtime.deploymentProfile !== "public_demo" ||
    input.runtime.equipmentSource !== "simulation"
  ) {
    return { allowed: false, reason: "unavailable" };
  }
  const token = cookieValue(input.cookieHeader);
  if (!token) return { allowed: false, reason: "missing" };
  const scope = verifyAnonymousDemoCarrier(token, input.now);
  if (!scope) return { allowed: false, reason: "invalid" };
  const access = createAnonymousDemoAccess(scope);
  if (!hasUserPermission(access, input.permission)) {
    return { allowed: false, reason: "forbidden" };
  }
  return { allowed: true, access };
}

export function anonymousDemoCookie(
  carrier: AnonymousDemoCarrier,
  secure: boolean,
): string {
  return [
    `${anonymousDemoCookieName}=${carrier.token}`,
    "Path=/api",
    `Max-Age=${carrier.maxAgeSeconds}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
