import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchOperationsSummary: vi.fn(),
  fetchOperationsDetails: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import handler from "../../pages/api/operations/summary";
import detailsHandler from "../../pages/api/operations/details";
import {
  fetchOperationsDetails,
  fetchOperationsSummary,
} from "../../src/infrastructure/http/wcs-api-client";

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
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
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
  });

  it("does not expose upstream errors or credentials", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
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
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
    vi.mocked(fetchOperationsDetails).mockResolvedValue({
      tasks: [],
      equipment: [],
      inventory: [],
      alarms: [],
      topology: null,
      generatedAt: "2026-09-18T00:00:00.000Z",
    });
    const response = createResponse();
    await detailsHandler({ method: "GET" } as never, response as never);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ tasks: [], topology: null });
  });
});
