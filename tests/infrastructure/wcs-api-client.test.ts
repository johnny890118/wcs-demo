import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAuditEvents,
  loadWcsApiTimeoutMs,
} from "../../src/infrastructure/http/wcs-api-client";
import { testOperationalAccess } from "../fixtures/operational-access";

const originalTimeout = process.env.INTERNAL_API_TIMEOUT_MS;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalTimeout === undefined) {
    delete process.env.INTERNAL_API_TIMEOUT_MS;
  } else {
    process.env.INTERNAL_API_TIMEOUT_MS = originalTimeout;
  }
});

describe("WCS audit projection client", () => {
  it("forwards exact filters and accepts the public audit contract", async () => {
    process.env.API_SERVICE_TOKEN = "service-token-for-test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], nextCursor: null }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAuditEvents(testOperationalAccess, {
        correlationId: "request:workflow-001",
        limit: 25,
      }),
    ).resolves.toEqual({ events: [], nextCursor: null });
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/v1/audit-events?limit=25&correlationId=request%3Aworkflow-001",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: expect.objectContaining({
        "X-SWP-Principal": "test-operator",
        "X-SWP-Warehouse": testOperationalAccess.currentWarehouseId,
      }),
    });
    delete process.env.API_SERVICE_TOKEN;
  });

  it("rejects an upstream payload that omits redaction contract fields", async () => {
    process.env.API_SERVICE_TOKEN = "service-token-for-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [{ details: { token: "secret" } }],
          nextCursor: null,
        }),
      }),
    );
    await expect(fetchAuditEvents(testOperationalAccess)).rejects.toThrow(
      /invalid projection/,
    );
    delete process.env.API_SERVICE_TOKEN;
  });
});

describe("WCS API client timeout", () => {
  it("allows the managed demo API to wake from free-tier idle", () => {
    delete process.env.INTERNAL_API_TIMEOUT_MS;
    expect(loadWcsApiTimeoutMs()).toBe(55_000);

    process.env.INTERNAL_API_TIMEOUT_MS = "60000";
    expect(loadWcsApiTimeoutMs()).toBe(60_000);
  });

  it("rejects timeouts outside the operational safety bounds", () => {
    process.env.INTERNAL_API_TIMEOUT_MS = "999";
    expect(() => loadWcsApiTimeoutMs()).toThrow(/INTERNAL_API_TIMEOUT_MS/);

    process.env.INTERNAL_API_TIMEOUT_MS = "60001";
    expect(() => loadWcsApiTimeoutMs()).toThrow(/INTERNAL_API_TIMEOUT_MS/);
  });
});
