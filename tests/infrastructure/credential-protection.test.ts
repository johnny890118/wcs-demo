import { afterEach, describe, expect, it } from "vitest";
import {
  credentialsMatch,
  fingerprintLoginIdentifier,
} from "../../src/infrastructure/auth/credential-protection";

const originalSecret = process.env.NEXTAUTH_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
  else process.env.NEXTAUTH_SECRET = originalSecret;
});

describe("credential protection", () => {
  it("uses a stable keyed fingerprint without retaining the identifier", () => {
    process.env.NEXTAUTH_SECRET = "s".repeat(40);
    const first = fingerprintLoginIdentifier(
      "demo-credentials",
      "  Example-Operator  ",
    );
    const second = fingerprintLoginIdentifier(
      "demo-credentials",
      "example-operator",
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain("example-operator");
  });

  it("compares both credential fields through equal-length digests", () => {
    expect(credentialsMatch("operator", "secret", "operator", "secret")).toBe(
      true,
    );
    expect(credentialsMatch("operator", "wrong", "operator", "secret")).toBe(
      false,
    );
    expect(credentialsMatch("wrong", "secret", "operator", "secret")).toBe(
      false,
    );
  });
});
