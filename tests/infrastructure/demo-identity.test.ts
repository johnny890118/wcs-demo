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
  "SWP_ENVIRONMENT",
  "SWP_EQUIPMENT_SOURCE",
] as const;
const originals = Object.fromEntries(
  names.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of names) {
    const value = originals[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
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
    process.env.SWP_ENVIRONMENT = "production-ish";
    expect(() => loadOperationalRuntime()).toThrow(/SWP_ENVIRONMENT/);
  });

  it("distinguishes environment from equipment execution source", () => {
    process.env.SWP_ENVIRONMENT = "staging";
    process.env.SWP_EQUIPMENT_SOURCE = "hardware";
    expect(loadOperationalRuntime()).toEqual({
      environment: "staging",
      equipmentSource: "hardware",
    });
  });
});
