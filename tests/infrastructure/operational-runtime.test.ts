import { afterEach, describe, expect, it } from "vitest";
import { loadOperationalRuntime } from "../../src/infrastructure/runtime/operational-runtime";

const names = [
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

describe("operational runtime configuration", () => {
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

  it("fails closed for invalid runtime labels and unsafe profile/source pairs", () => {
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "production-ish";
    expect(() => loadOperationalRuntime()).toThrow(/SWP_LIFECYCLE_ENVIRONMENT/);

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
