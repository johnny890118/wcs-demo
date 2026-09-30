import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAuditEvents,
  issueHumanOperationalSession,
  loadWcsApiTimeoutMs,
  recordWarehouseContextChange,
  revokeHumanOperationalSession,
  validateHumanOperationalSession,
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

describe("WCS warehouse context client", () => {
  it("records an in-scope context change through the authenticated API", async () => {
    process.env.API_SERVICE_TOKEN = "service-token-for-test";
    const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ currentWarehouseId: targetWarehouseId }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      recordWarehouseContextChange(testOperationalAccess, targetWarehouseId),
    ).resolves.toEqual({ currentWarehouseId: targetWarehouseId });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/access-context/warehouse"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ targetWarehouseId }),
        headers: expect.objectContaining({
          "X-SWP-Warehouse": testOperationalAccess.currentWarehouseId,
        }),
      }),
    );
    delete process.env.API_SERVICE_TOKEN;
  });
});

describe("WCS persisted human session client", () => {
  const session = {
    sessionId: "90000000-0000-4000-8000-000000000099",
    expiresAt: "2099-01-01T00:00:00.000Z",
  };

  it("issues and validates a bounded session using only the service identity", async () => {
    process.env.API_SERVICE_TOKEN = "service-token-for-test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access: testOperationalAccess, session }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      issueHumanOperationalSession("test", "test-operator"),
    ).resolves.toEqual({ access: testOperationalAccess, session });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/access-context/human/sessions"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          identityProvider: "test",
          subject: "test-operator",
        }),
        headers: {
          Authorization: "Bearer service-token-for-test",
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(
      validateHumanOperationalSession(session, testOperationalAccess),
    ).resolves.toEqual({ access: testOperationalAccess, session });
    expect(fetchMock.mock.calls[1][0]).toContain(
      `/sessions/${session.sessionId}/validate`,
    );
    delete process.env.API_SERVICE_TOKEN;
  });

  it("sends an explicit reason when revoking a session", async () => {
    process.env.API_SERVICE_TOKEN = "service-token-for-test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ revoked: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await revokeHumanOperationalSession(session, "sign_out");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/sessions/${session.sessionId}/revoke`),
      expect.objectContaining({ body: JSON.stringify({ reason: "sign_out" }) }),
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
