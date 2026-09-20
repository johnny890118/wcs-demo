import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve("scripts/validate-deployment-env.mjs");
const webAccessEnvironment = {
  DEMO_USER_PERMISSIONS:
    "operations.view,audit.view,inbound.create,outbound.create,transport.execute,alarm.acknowledge,alarm.recover",
  DEMO_WAREHOUSE_ID: "10000000-0000-4000-8000-000000000001",
  DEMO_WAREHOUSE_CODE: "DEMO",
  DEMO_WAREHOUSE_NAME: "Deterministic Demo Warehouse",
  SWP_ENVIRONMENT: "demo",
  SWP_EQUIPMENT_SOURCE: "simulation",
};

function validate(target: "api" | "web", environment: Record<string, string>) {
  return spawnSync(process.execPath, [script, target], {
    encoding: "utf8",
    env: {
      NODE_ENV: "test",
      PATH: process.env.PATH,
      DEPLOYMENT_ENV: "production",
      ...environment,
    },
  });
}

describe("deployment environment validation", () => {
  it("accepts a bounded API service identity and TLS database URL", () => {
    const result = validate("api", {
      DATABASE_URL:
        "postgresql://warehouse:validation-password@db.example.internal:5432/warehouse?sslmode=require",
      API_SERVICE_ID: "warehouse-web",
      API_SERVICE_TOKEN: "validation-token-with-at-least-32-characters",
      API_SERVICE_PERMISSIONS: "operations.view,transport.execute",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("valid for api");
  });

  it("fails closed for placeholders, weak secrets, and unknown permissions", () => {
    const weakToken = "do-not-print-this";
    const result = validate("api", {
      DATABASE_URL: "postgresql://warehouse@db.example.internal/warehouse",
      API_SERVICE_ID: "warehouse-web",
      API_SERVICE_TOKEN: weakToken,
      API_SERVICE_PERMISSIONS: "operations.view,admin.everything",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("API_SERVICE_TOKEN");
    expect(result.stderr).toContain("unknown permissions");
    expect(result.stderr).not.toContain(weakToken);
  });

  it("requires HTTPS for non-loopback production web origins", () => {
    const safeSecret = `validation-${"s".repeat(32)}`;
    const safePassword = `validation-${"p".repeat(20)}`;
    const result = validate("web", {
      ...webAccessEnvironment,
      NEXTAUTH_URL: "http://warehouse.example.com",
      PUBLIC_SITE_URL: "https://warehouse.example.com",
      INTERNAL_API_BASE_URL: "https://warehouse-api.example.com",
      NEXTAUTH_SECRET: safeSecret,
      DEMO_ADMIN_USERNAME: "validation-operator",
      DEMO_ADMIN_PASSWORD: safePassword,
      API_SERVICE_TOKEN: "validation-token-with-at-least-32-characters",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("NEXTAUTH_URL must use HTTPS");
  });

  it("accepts matching canonical and authentication origins", () => {
    const result = validate("web", {
      ...webAccessEnvironment,
      NEXTAUTH_URL: "https://warehouse.example.com",
      PUBLIC_SITE_URL: "https://warehouse.example.com",
      INTERNAL_API_BASE_URL: "https://warehouse-api.example.com",
      INTERNAL_API_TIMEOUT_MS: "55000",
      NEXTAUTH_SECRET: `validation-${"s".repeat(32)}`,
      DEMO_ADMIN_USERNAME: "validation-operator",
      DEMO_ADMIN_PASSWORD: `validation-${"p".repeat(20)}`,
      API_SERVICE_TOKEN: "validation-token-with-at-least-32-characters",
    });

    expect(result.status).toBe(0);
  });

  it("rejects an unbounded internal API timeout", () => {
    const result = validate("web", {
      ...webAccessEnvironment,
      NEXTAUTH_URL: "https://warehouse.example.com",
      PUBLIC_SITE_URL: "https://warehouse.example.com",
      INTERNAL_API_BASE_URL: "https://warehouse-api.example.com",
      INTERNAL_API_TIMEOUT_MS: "60001",
      NEXTAUTH_SECRET: `validation-${"s".repeat(32)}`,
      DEMO_ADMIN_USERNAME: "validation-operator",
      DEMO_ADMIN_PASSWORD: `validation-${"p".repeat(20)}`,
      API_SERVICE_TOKEN: "validation-token-with-at-least-32-characters",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("INTERNAL_API_TIMEOUT_MS");
  });
});
