const target = process.argv[2];
const knownTargets = ["api", "web", "all"];
if (!knownTargets.includes(target)) {
  throw new Error("Usage: npm run deployment:validate -- <api|web|all>");
}

const knownPermissions = new Set([
  "operations.view",
  "inbound.create",
  "outbound.create",
  "transport.execute",
  "alarm.inject",
  "alarm.acknowledge",
  "alarm.recover",
]);
const errors = [];

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
  url("NEXTAUTH_URL", ["http:", "https:"]);
  url("INTERNAL_API_BASE_URL", ["http:", "https:"]);
  required("NEXTAUTH_SECRET", 32);
  required("DEMO_ADMIN_USERNAME", 3);
  required("DEMO_ADMIN_PASSWORD", 16);
  required("API_SERVICE_TOKEN", 32);
}

if (errors.length > 0) {
  process.stderr.write(
    `Deployment environment validation failed:\n- ${errors.join("\n- ")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(`Deployment environment is valid for ${target}.\n`);
}
