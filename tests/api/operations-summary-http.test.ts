import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchOperationsSummary: vi.fn(),
  fetchOperationsDetails: vi.fn(),
  fetchOperationsHome: vi.fn(),
  fetchOperationsOverview: vi.fn(),
  fetchOperationsLiveView: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import handler from "../../pages/api/operations/summary";
import detailsHandler from "../../pages/api/operations/details";
import homeHandler from "../../pages/api/operations/home";
import overviewHandler from "../../pages/api/operations/overview";
import liveViewHandler from "../../pages/api/operations/live-view";
import {
  fetchOperationsDetails,
  fetchOperationsSummary,
  fetchOperationsHome,
  fetchOperationsOverview,
  fetchOperationsLiveView,
} from "../../src/infrastructure/http/wcs-api-client";
import {
  testOperationalAccess,
  testOperationalSession,
} from "../fixtures/operational-access";

function createResponse() {
  const response = {
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    statusCode: undefined as number | undefined,
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
    setHeader: vi.fn((name: string, value: string) => {
      response.headers[name] = value;
      return response;
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
  };
  return response;
}

describe("operations home browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects anonymous access before requesting warehouse data", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await homeHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchOperationsHome).not.toHaveBeenCalled();
  });
  it("forwards authorized scope and conceals upstream failure details", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsHome).mockRejectedValue(
      new Error("secret upstream"),
    );
    const response = createResponse();
    await homeHandler({ method: "GET" } as never, response as never);
    expect(fetchOperationsHome).toHaveBeenCalledWith(testOperationalAccess);
    expect(response.statusCode).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain("secret upstream");
  });
});

describe("combined operations overview boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("revalidates once per refresh, forwards scope and forbids cache", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsOverview).mockResolvedValue({
      home: null,
      summary: null,
    });
    const response = createResponse();
    await overviewHandler({ method: "GET" } as never, response as never);
    expect(getServerSession).toHaveBeenCalledTimes(1);
    expect(fetchOperationsOverview).toHaveBeenCalledWith(testOperationalAccess);
    expect(response.headers["Cache-Control"]).toBe("no-store");
    await overviewHandler(
      { method: "GET" } as never,
      createResponse() as never,
    );
    expect(getServerSession).toHaveBeenCalledTimes(2);
  });
  it("fails closed before upstream read for invalid identity", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await overviewHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchOperationsOverview).not.toHaveBeenCalled();
  });
  it("conceals upstream failures and rejects writes", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsOverview).mockRejectedValue(
      new Error("private diagnostic"),
    );
    const failed = createResponse();
    await overviewHandler({ method: "GET" } as never, failed as never);
    expect(failed.statusCode).toBe(503);
    expect(failed.body).toEqual({ code: "OPERATIONS_OVERVIEW_UNAVAILABLE" });
    const denied = createResponse();
    await overviewHandler({ method: "POST" } as never, denied as never);
    expect(denied.statusCode).toBe(405);
  });
});

describe("live view browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects missing permission and forwards only the revalidated current warehouse", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      ...testOperationalSession,
      access: {
        ...testOperationalAccess,
        principal: {
          ...testOperationalAccess.principal,
          permissions: ["audit.view"],
          warehouseScopes: testOperationalAccess.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["audit.view"] }),
          ),
        },
      },
    });
    const denied = createResponse();
    await liveViewHandler({ method: "GET" } as never, denied as never);
    expect(denied.statusCode).toBe(403);
    expect(fetchOperationsLiveView).not.toHaveBeenCalled();
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsLiveView).mockResolvedValue({
      equipment: [],
      work: [],
      alarms: [],
      locations: [],
      topology: null,
      generatedAt: "2026-10-03T00:00:00Z",
      coverage: {
        workMayBeLimited: false,
        equipmentMayBeLimited: false,
        locationsMayBeLimited: false,
        alarmsMayBeLimited: false,
      },
    });
    const allowed = createResponse();
    await liveViewHandler({ method: "GET" } as never, allowed as never);
    expect(allowed.statusCode).toBe(200);
    expect(fetchOperationsLiveView).toHaveBeenCalledWith(testOperationalAccess);
  });
  it("fails closed and revalidates every request without caching authority", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const anonymous = createResponse();
    await liveViewHandler({ method: "GET" } as never, anonymous as never);
    expect(anonymous.statusCode).toBe(401);
    expect(fetchOperationsLiveView).not.toHaveBeenCalled();
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsLiveView).mockRejectedValue(
      new Error("private diagnostic"),
    );
    const failed = createResponse();
    await liveViewHandler({ method: "GET" } as never, failed as never);
    expect(getServerSession).toHaveBeenCalledTimes(2);
    expect(fetchOperationsLiveView).toHaveBeenCalledWith(testOperationalAccess);
    expect(failed.headers["Cache-Control"]).toBe("no-store");
    expect(failed.statusCode).toBe(503);
    expect(failed.body).toEqual({ code: "OPERATIONS_LIVE_VIEW_UNAVAILABLE" });
    const write = createResponse();
    await liveViewHandler({ method: "POST" } as never, write as never);
    expect(write.statusCode).toBe(405);
  });
});

describe("operations summary browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows only GET", async () => {
    const response = createResponse();
    await handler({ method: "POST" } as never, response as never);
    expect(response.statusCode).toBe(405);
    expect(response.headers.Allow).toBe("GET");
  });

  it("rejects requests without a browser session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await handler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchOperationsSummary).not.toHaveBeenCalled();
  });

  it("returns the server-fetched projection to an authenticated operator", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsSummary).mockResolvedValue({
      counts: {
        activeTasks: 1,
        storedInventory: 2,
        openReceipts: 3,
        configuredEquipment: 4,
      },
      topology: null,
      recentTasks: [],
      generatedAt: "2026-09-18T00:00:00.000Z",
    });
    const response = createResponse();
    await handler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ counts: { activeTasks: 1 } });
    expect(fetchOperationsSummary).toHaveBeenCalledWith(testOperationalAccess);
  });

  it("does not expose upstream errors or credentials", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsSummary).mockRejectedValue(
      new Error("Bearer secret-value"),
    );
    const response = createResponse();
    await handler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      code: "OPERATIONS_API_UNAVAILABLE",
      message: "Operations data is temporarily unavailable.",
    });
  });
});

describe("focused operations projection browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a session before fetching details", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await detailsHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchOperationsDetails).not.toHaveBeenCalled();
  });

  it("returns validated server-fetched detail projections", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(fetchOperationsDetails).mockResolvedValue({
      tasks: [],
      equipment: [],
      inventory: [],
      alarms: [],
      locations: [],
      topology: null,
      generatedAt: "2026-09-18T00:00:00.000Z",
    });
    const response = createResponse();
    await detailsHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ tasks: [], topology: null });
    expect(fetchOperationsDetails).toHaveBeenCalledWith(testOperationalAccess);
  });

  it("fails closed when the signed session lacks an access context", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "legacy-session" },
    });
    const response = createResponse();
    await detailsHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchOperationsDetails).not.toHaveBeenCalled();
  });
});
