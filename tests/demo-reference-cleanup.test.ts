import { describe, expect, it } from "vitest";
import {
  requireDemoCleanupIdentity,
  requireDemoCleanupPolicy,
} from "../src/application/demo/demo-reference-cleanup";

const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;
describe("inactive demo cleanup policy", () => {
  it("accepts bounded server lease configuration and UUID identity", () => {
    for (const leaseSeconds of [30, 60, 300]) {
      expect(() =>
        requireDemoCleanupPolicy(runtime, { leaseSeconds }),
      ).not.toThrow();
    }
    expect(() =>
      requireDemoCleanupIdentity("10000000-0000-4000-8000-000000000001"),
    ).not.toThrow();
  });
  it("rejects malformed duration and caller identity", () => {
    for (const leaseSeconds of [0, 29, 301, 30.1, NaN, Infinity]) {
      expect(() =>
        requireDemoCleanupPolicy(runtime, { leaseSeconds }),
      ).toThrow();
    }
    for (const value of ["", "DEMO-test", "../../template", "not-a-uuid"]) {
      expect(() => requireDemoCleanupIdentity(value)).toThrow();
    }
  });
  it("hard-denies private, pilot, production and non-simulation runtimes", () => {
    for (const deploymentProfile of [
      "private_demo",
      "pilot",
      "production",
    ] as const) {
      expect(() =>
        requireDemoCleanupPolicy(
          { ...runtime, deploymentProfile },
          { leaseSeconds: 60 },
        ),
      ).toThrow();
    }
    for (const equipmentSource of ["hardware", "hybrid"] as const) {
      expect(() =>
        requireDemoCleanupPolicy(
          { ...runtime, equipmentSource },
          { leaseSeconds: 60 },
        ),
      ).toThrow();
    }
  });
});
