import { afterEach, describe, expect, it } from "vitest";
import { loadWcsApiTimeoutMs } from "../../src/infrastructure/http/wcs-api-client";

const originalTimeout = process.env.INTERNAL_API_TIMEOUT_MS;

afterEach(() => {
  if (originalTimeout === undefined) {
    delete process.env.INTERNAL_API_TIMEOUT_MS;
  } else {
    process.env.INTERNAL_API_TIMEOUT_MS = originalTimeout;
  }
});

describe("WCS API client timeout", () => {
  it("allows the managed demo API to wake from free-tier idle", () => {
    delete process.env.INTERNAL_API_TIMEOUT_MS;
    expect(loadWcsApiTimeoutMs()).toBe(75_000);

    process.env.INTERNAL_API_TIMEOUT_MS = "90000";
    expect(loadWcsApiTimeoutMs()).toBe(90_000);
  });

  it("rejects timeouts outside the operational safety bounds", () => {
    process.env.INTERNAL_API_TIMEOUT_MS = "999";
    expect(() => loadWcsApiTimeoutMs()).toThrow(/INTERNAL_API_TIMEOUT_MS/);

    process.env.INTERNAL_API_TIMEOUT_MS = "120001";
    expect(() => loadWcsApiTimeoutMs()).toThrow(/INTERNAL_API_TIMEOUT_MS/);
  });
});
