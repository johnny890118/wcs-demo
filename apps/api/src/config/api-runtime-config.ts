import {
  servicePermissions,
  type ServicePermission,
} from "../auth/permissions";

export type ApiRuntimeConfig = Readonly<{
  rateLimitMax: number;
  rateLimitWindowMs: number;
  trustProxyHops: number;
}>;

export function loadApiListenerPort(): number {
  const name = process.env.PORT === undefined ? "API_PORT" : "PORT";
  return integer(name, 3_001, 1, 65_535);
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

function required(name: string, minimumLength = 1): string {
  const value = process.env[name]?.trim() ?? "";
  if (value.length < minimumLength) {
    throw new Error(
      `${name} must contain at least ${minimumLength} characters.`,
    );
  }
  if (/replace-with|changeme|__set_me__|example-secret/i.test(value)) {
    throw new Error(`${name} contains a forbidden placeholder value.`);
  }
  return value;
}

export function validateApiRuntimeEnvironment(): ApiRuntimeConfig {
  required("DATABASE_URL");
  required("API_SERVICE_ID");
  required("API_SERVICE_TOKEN", 32);
  const permissions = required("API_SERVICE_PERMISSIONS")
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (
    permissions.length === 0 ||
    new Set(permissions).size !== permissions.length
  ) {
    throw new Error("API_SERVICE_PERMISSIONS must be non-empty and unique.");
  }
  const unknown = permissions.filter(
    (permission) =>
      !servicePermissions.includes(permission as ServicePermission),
  );
  if (unknown.length > 0) {
    throw new Error("API_SERVICE_PERMISSIONS contains an unknown permission.");
  }

  return loadApiRuntimeConfig();
}

export function loadApiRuntimeConfig(): ApiRuntimeConfig {
  return {
    rateLimitMax: integer("API_RATE_LIMIT_MAX", 120, 1, 10_000),
    rateLimitWindowMs: integer(
      "API_RATE_LIMIT_WINDOW_MS",
      60_000,
      1_000,
      3_600_000,
    ),
    trustProxyHops: integer("API_TRUST_PROXY_HOPS", 0, 0, 5),
  };
}
