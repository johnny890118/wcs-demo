import { describe, expect, it } from "vitest";
import {
  requireDemoRuntimePolicy,
  requireDemoRuntimeIdentity,
} from "../../src/application/demo/demo-runtime-ownership";
import { PgDemoRuntimeOwnershipRepository } from "../../apps/api/src/demo/pg-demo-runtime-ownership.repository";
const runtime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
} as const;
describe("demo runtime ownership policy", () => {
  it("accepts bounded server lease settings and UUID identity", () => {
    for (const leaseSeconds of [30, 60, 300])
      expect(() =>
        requireDemoRuntimePolicy(runtime, { leaseSeconds }),
      ).not.toThrow();
    expect(() =>
      requireDemoRuntimeIdentity("10000000-0000-4000-8000-000000000001"),
    ).not.toThrow();
  });
  it("rejects malformed lease/identity before connecting", () => {
    for (const leaseSeconds of [0, 29, 301, 30.1, NaN, Infinity])
      expect(
        () =>
          new PgDemoRuntimeOwnershipRepository({} as never, runtime, {
            leaseSeconds,
          }),
      ).toThrow("INVALID");
    for (const value of ["", "source-warehouse", "../owned"])
      expect(() => requireDemoRuntimeIdentity(value)).toThrow("INVALID");
  });
  it("hard-denies non-public or non-simulated runtime", () => {
    for (const deploymentProfile of [
      "private_demo",
      "pilot",
      "production",
    ] as const)
      expect(
        () =>
          new PgDemoRuntimeOwnershipRepository(
            {} as never,
            { ...runtime, deploymentProfile },
            { leaseSeconds: 30 },
          ),
      ).toThrow("UNAVAILABLE");
    for (const equipmentSource of ["hardware", "hybrid"] as const)
      expect(
        () =>
          new PgDemoRuntimeOwnershipRepository(
            {} as never,
            { ...runtime, equipmentSource },
            { leaseSeconds: 30 },
          ),
      ).toThrow("UNAVAILABLE");
  });
});
