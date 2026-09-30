import { afterEach, describe, expect, it } from "vitest";
import {
  createDemoOperationalAccess,
  loadOperationalRuntime,
} from "../../src/infrastructure/auth/demo-identity";

const names = [
  "DEMO_USER_PERMISSIONS",
  "DEMO_WAREHOUSE_ID",
  "DEMO_WAREHOUSE_CODE",
  "DEMO_WAREHOUSE_NAME",
  "DEMO_WAREHOUSE_SCOPES_JSON",
  "DEMO_CURRENT_WAREHOUSE_ID",
  "SWP_ENVIRONMENT",
  "SWP_LIFECYCLE_ENVIRONMENT",
  "SWP_DEPLOYMENT_PROFILE",
  "SWP_EQUIPMENT_SOURCE",
  "NODE_ENV",
] as const;
const originals = Object.fromEntries(
  names.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of names) {
    const value = originals[name];
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Reflect.set(process.env, name, value);
  }
});

describe("demo identity adapter", () => {
  it("issues the provider-neutral access contract from adapter configuration", () => {
    process.env.DEMO_USER_PERMISSIONS = "operations.view,audit.view";
    process.env.DEMO_WAREHOUSE_CODE = "DEMO-ONE";
    const access = createDemoOperationalAccess("operator@example.test");
    expect(access).toMatchObject({
      principal: {
        subject: "legacy-demo-admin",
        displayName: "operator@example.test",
        identityProvider: "demo-credentials",
        permissions: ["operations.view", "audit.view"],
        warehouseScopes: [{ code: "DEMO-ONE" }],
      },
    });
  });

  it("rejects unknown permissions, invalid warehouse IDs, and unsafe runtime labels", () => {
    process.env.DEMO_USER_PERMISSIONS = "operations.view,admin.everything";
    expect(() => createDemoOperationalAccess("operator")).toThrow(
      /DEMO_USER_PERMISSIONS/,
    );
    process.env.DEMO_USER_PERMISSIONS = "operations.view";
    process.env.DEMO_WAREHOUSE_ID = "not-a-uuid";
    expect(() => createDemoOperationalAccess("operator")).toThrow(
      /access configuration/,
    );
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "production-ish";
    expect(() => loadOperationalRuntime()).toThrow(/SWP_LIFECYCLE_ENVIRONMENT/);
  });

  it("supports bounded multi-warehouse demo grants without changing authorization semantics", () => {
    process.env.DEMO_WAREHOUSE_SCOPES_JSON = JSON.stringify([
      {
        warehouseId: "10000000-0000-4000-8000-000000000001",
        code: "ONE",
        name: "Warehouse One",
      },
      {
        warehouseId: "20000000-0000-4000-8000-000000000001",
        code: "TWO",
        name: "Warehouse Two",
      },
    ]);
    process.env.DEMO_CURRENT_WAREHOUSE_ID =
      "20000000-0000-4000-8000-000000000001";

    const access = createDemoOperationalAccess("operator@example.test");
    expect(access.currentWarehouseId).toBe(
      "20000000-0000-4000-8000-000000000001",
    );
    expect(access.principal.warehouseScopes).toHaveLength(2);

    process.env.DEMO_CURRENT_WAREHOUSE_ID =
      "30000000-0000-4000-8000-000000000001";
    expect(() => createDemoOperationalAccess("operator")).toThrow(
      /access configuration/,
    );
  });

  it("distinguishes lifecycle environment, deployment profile, and equipment source", () => {
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "staging";
    process.env.SWP_DEPLOYMENT_PROFILE = "pilot";
    process.env.SWP_EQUIPMENT_SOURCE = "hybrid";
    expect(loadOperationalRuntime()).toEqual({
      environment: "staging",
      deploymentProfile: "pilot",
      equipmentSource: "hybrid",
    });
  });

  it("fails closed for a public demo configured with hardware", () => {
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "production";
    process.env.SWP_DEPLOYMENT_PROFILE = "public_demo";
    process.env.SWP_EQUIPMENT_SOURCE = "hardware";

    expect(() => loadOperationalRuntime()).toThrow(
      /public_demo does not allow equipment source hardware/,
    );
  });

  it("accepts a public demo configured with simulation", () => {
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "production";
    process.env.SWP_DEPLOYMENT_PROFILE = "public_demo";
    process.env.SWP_EQUIPMENT_SOURCE = "simulation";

    expect(loadOperationalRuntime()).toEqual({
      environment: "production",
      deploymentProfile: "public_demo",
      equipmentSource: "simulation",
    });
  });

  it("requires all runtime dimensions explicitly in production", () => {
    Reflect.set(process.env, "NODE_ENV", "production");
    delete process.env.SWP_ENVIRONMENT;
    delete process.env.SWP_LIFECYCLE_ENVIRONMENT;
    delete process.env.SWP_DEPLOYMENT_PROFILE;
    delete process.env.SWP_EQUIPMENT_SOURCE;

    expect(() => loadOperationalRuntime()).toThrow(
      /Production runtime requires explicit lifecycle environment, deployment profile, and equipment source/,
    );
  });
});
