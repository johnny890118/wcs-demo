import { describe, expect, it } from "vitest";
import {
  requireDemoAdmissionPolicy,
  requireDemoCreationBudgetPolicy,
  defaultDemoCreationBudget,
  requireDemoExpiryBatch,
  requireDemoReservationInput,
} from "../../src/application/demo/demo-admission";
import type { OperationalRuntime } from "../../src/application/access/operational-access";
import { PgDemoAdmissionRepository } from "../../apps/api/src/demo/pg-demo-admission.repository";

const runtime: OperationalRuntime = {
  environment: "production",
  deploymentProfile: "public_demo",
  equipmentSource: "simulation",
};
const policy = { ttlSeconds: 1_800, maximumReservations: 10 };

describe("demo admission foundation", () => {
  it("validates bounded global creation configuration before connecting", () => {
    expect(() =>
      requireDemoCreationBudgetPolicy(defaultDemoCreationBudget),
    ).not.toThrow();
    for (const windowSeconds of [0, 9, 3601, 10.5, NaN, Infinity]) {
      expect(() =>
        requireDemoCreationBudgetPolicy({ windowSeconds, maximumCreations: 1 }),
      ).toThrow("INVALID");
    }
    for (const maximumCreations of [0, 1001, 1.5, NaN, Infinity]) {
      expect(
        () =>
          new PgDemoAdmissionRepository({} as never, runtime, policy, {
            windowSeconds: 60,
            maximumCreations,
          }),
      ).toThrow("INVALID");
    }
    for (const windowSeconds of [10, 3600]) {
      expect(() =>
        requireDemoCreationBudgetPolicy({
          windowSeconds,
          maximumCreations: 1000,
        }),
      ).not.toThrow();
    }
  });
  it("allows hosted public simulation without confusing lifecycle and profile", () => {
    expect(() => requireDemoAdmissionPolicy(runtime, policy)).not.toThrow();
  });

  it.each(["production", "pilot", "private_demo"] as const)(
    "denies %s before opening a database connection",
    (deploymentProfile) => {
      expect(
        () =>
          new PgDemoAdmissionRepository(
            {} as never,
            { ...runtime, deploymentProfile },
            policy,
          ),
      ).toThrow("UNAVAILABLE");
    },
  );

  it.each(["hardware", "hybrid"] as const)("denies %s", (equipmentSource) => {
    expect(() =>
      requireDemoAdmissionPolicy({ ...runtime, equipmentSource }, policy),
    ).toThrow("UNAVAILABLE");
  });

  it.each([0, 299, 7_201, 300.5, NaN, Infinity])(
    "rejects TTL %s",
    (ttlSeconds) => {
      expect(() =>
        requireDemoAdmissionPolicy(runtime, { ...policy, ttlSeconds }),
      ).toThrow("INVALID");
    },
  );

  it.each([0, -1, 1_001, 2.5, NaN, Infinity])(
    "rejects capacity %s",
    (maximumReservations) => {
      expect(() =>
        requireDemoAdmissionPolicy(runtime, { ...policy, maximumReservations }),
      ).toThrow("INVALID");
    },
  );

  it("validates UUID scope and bounded cleanup candidates", () => {
    expect(() =>
      requireDemoReservationInput({
        sessionId: "invalid",
        templateWarehouseId: "x",
      }),
    ).toThrow("INVALID");
    for (const limit of [0, 101, 2.5, NaN]) {
      expect(() => requireDemoExpiryBatch(limit)).toThrow("INVALID");
    }
    expect(() => requireDemoExpiryBatch(100)).not.toThrow();
    for (const ttlSeconds of [300, 7_200]) {
      expect(() =>
        requireDemoAdmissionPolicy(runtime, { ...policy, ttlSeconds }),
      ).not.toThrow();
    }
  });
});
