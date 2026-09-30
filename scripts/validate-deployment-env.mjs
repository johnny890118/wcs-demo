const target = process.argv[2];
const knownTargets = ["api", "web", "all"];
if (!knownTargets.includes(target)) {
  throw new Error("Usage: npm run deployment:validate -- <api|web|all>");
}

const knownPermissions = new Set([
  "access.resolve",
  "audit.view",
  "operations.view",
  "inbound.create",
  "outbound.create",
  "transport.execute",
  "alarm.inject",
  "alarm.acknowledge",
  "alarm.recover",
]);
const knownUserPermissions = new Set([
  "operations.view",
  "audit.view",
  "inbound.create",
  "outbound.create",
  "transport.execute",
  "alarm.acknowledge",
  "alarm.recover",
]);
const errors = [];
const lifecycleEnvironments = ["development", "test", "staging", "production"];
const deploymentProfiles = [
  "public_demo",
  "private_demo",
  "pilot",
  "production",
];
const equipmentSources = ["simulation", "hardware", "hybrid"];
const allowedEquipmentSources = {
  public_demo: ["simulation"],
  private_demo: ["simulation"],
  pilot: ["hardware", "hybrid"],
  production: ["hardware", "hybrid"],
};

function required(name, minimumLength = 1) {
  const value = process.env[name]?.trim() ?? "";
  if (value.length < minimumLength) {
    errors.push(`${name} must contain at least ${minimumLength} characters.`);
  }
  if (/replace-with|changeme|example-secret/i.test(value)) {
    errors.push(`${name} still contains a placeholder value.`);
  }
  return value;
}

function url(name, protocols) {
  const value = required(name);
  try {
    const parsed = new URL(value);
    if (!protocols.includes(parsed.protocol)) {
      errors.push(`${name} must use ${protocols.join(" or ")}.`);
    }
    if (
      process.env.DEPLOYMENT_ENV === "production" &&
      parsed.protocol === "http:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    ) {
      errors.push(`${name} must use HTTPS outside a loopback deployment.`);
    }
    return parsed;
  } catch {
    errors.push(`${name} must be a valid URL.`);
    return null;
  }
}

function integer(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    errors.push(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return value;
}

function oneOf(name, allowed) {
  const value = required(name);
  if (!allowed.includes(value)) {
    errors.push(`${name} must be one of ${allowed.join(", ")}.`);
  }
  return value;
}

function validateOperationalRuntime() {
  oneOf("SWP_LIFECYCLE_ENVIRONMENT", lifecycleEnvironments);
  const profile = oneOf("SWP_DEPLOYMENT_PROFILE", deploymentProfiles);
  const source = oneOf("SWP_EQUIPMENT_SOURCE", equipmentSources);
  if (
    Object.hasOwn(allowedEquipmentSources, profile) &&
    !allowedEquipmentSources[profile].includes(source)
  ) {
    errors.push(
      `SWP_DEPLOYMENT_PROFILE ${profile} does not allow SWP_EQUIPMENT_SOURCE ${source}.`,
    );
  }
  return profile;
}

const deploymentProfile = validateOperationalRuntime();

if (target === "api" || target === "all") {
  const database = url("DATABASE_URL", ["postgres:", "postgresql:"]);
  if (
    process.env.DEPLOYMENT_ENV === "production" &&
    database &&
    database.hostname !== "localhost" &&
    database.hostname !== "127.0.0.1" &&
    !["require", "verify-ca", "verify-full"].includes(
      database.searchParams.get("sslmode") ?? "",
    )
  ) {
    errors.push("DATABASE_URL must require TLS outside a loopback deployment.");
  }
  required("API_SERVICE_ID");
  required("API_SERVICE_TOKEN", 32);
  const permissions = required("API_SERVICE_PERMISSIONS")
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  const unknown = permissions.filter(
    (permission) => !knownPermissions.has(permission),
  );
  if (unknown.length > 0) {
    errors.push("API_SERVICE_PERMISSIONS contains unknown permissions.");
  }
  if (new Set(permissions).size !== permissions.length) {
    errors.push("API_SERVICE_PERMISSIONS must not contain duplicates.");
  }
}

if (target === "web" || target === "all") {
  const nextAuth = url("NEXTAUTH_URL", ["http:", "https:"]);
  const publicSite = url("PUBLIC_SITE_URL", ["http:", "https:"]);
  if (
    publicSite &&
    (publicSite.username ||
      publicSite.password ||
      publicSite.pathname !== "/" ||
      publicSite.search ||
      publicSite.hash)
  ) {
    errors.push("PUBLIC_SITE_URL must be an origin without a path.");
  }
  if (nextAuth && publicSite && nextAuth.origin !== publicSite.origin) {
    errors.push("NEXTAUTH_URL and PUBLIC_SITE_URL must use the same origin.");
  }
  url("INTERNAL_API_BASE_URL", ["http:", "https:"]);
  integer("INTERNAL_API_TIMEOUT_MS", 55_000, 1_000, 60_000);
  required("NEXTAUTH_SECRET", 32);
  required("DEMO_ADMIN_USERNAME", 3);
  required("DEMO_ADMIN_PASSWORD", 16);
  required("API_SERVICE_TOKEN", 32);
  if (deploymentProfile === "public_demo") {
    const warehouseId = required("DEMO_WAREHOUSE_ID");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        warehouseId,
      )
    ) {
      errors.push("DEMO_WAREHOUSE_ID must be a UUID.");
    }
    required("DEMO_WAREHOUSE_CODE");
    required("DEMO_WAREHOUSE_NAME");
    required("ANONYMOUS_DEMO_SECRET", 32);
    integer("ANONYMOUS_DEMO_SESSION_TTL_SECONDS", 1_800, 300, 7_200);
    const publicDemoPermissions = required("PUBLIC_DEMO_USER_PERMISSIONS")
      .split(",")
      .map((permission) => permission.trim())
      .filter(Boolean);
    if (
      publicDemoPermissions.length === 0 ||
      new Set(publicDemoPermissions).size !== publicDemoPermissions.length ||
      publicDemoPermissions.some(
        (permission) => !knownUserPermissions.has(permission),
      )
    ) {
      errors.push(
        "PUBLIC_DEMO_USER_PERMISSIONS must be non-empty, unique, and known.",
      );
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(
    `Deployment environment validation failed:\n- ${errors.join("\n- ")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(`Deployment environment is valid for ${target}.\n`);
}
