import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchAuditEvents: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import handler from "../../pages/api/operations/audit";
import { fetchAuditEvents } from "../../src/infrastructure/http/wcs-api-client";

function createResponse() {
  const response = {
    body: undefined as unknown,
    statusCode: undefined as number | undefined,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((name: string, value: string) => {
      response.headers[name] = value;
      return response;
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

describe("audit history browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a browser session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await handler({ method: "GET", query: {} } as never, response as never);
    expect(response.statusCode).toBe(401);
    expect(fetchAuditEvents).not.toHaveBeenCalled();
  });

  it("forwards only scalar supported query values", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
    vi.mocked(fetchAuditEvents).mockResolvedValue({
      events: [],
      nextCursor: null,
    });
    const response = createResponse();
    await handler(
      {
        method: "GET",
        query: {
          limit: "25",
          correlationId: "request:workflow-001",
          resourceId: ["first", "second"],
          ignored: "not-forwarded",
        },
      } as never,
      response as never,
    );
    expect(response.statusCode).toBe(200);
    expect(fetchAuditEvents).toHaveBeenCalledWith({
      limit: 25,
      correlationId: "request:workflow-001",
      resourceId: undefined,
      resourceType: undefined,
      cursor: undefined,
    });
  });

  it("rejects an invalid page size before calling the service", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
    const response = createResponse();
    await handler(
      { method: "GET", query: { limit: "not-a-number" } } as never,
      response as never,
    );
    expect(response.statusCode).toBe(400);
    expect(fetchAuditEvents).not.toHaveBeenCalled();
  });

  it("does not expose upstream error details", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: "operator" },
    });
    vi.mocked(fetchAuditEvents).mockRejectedValue(new Error("Bearer secret"));
    const response = createResponse();
    await handler({ method: "GET", query: {} } as never, response as never);
    expect(response.statusCode).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain("secret");
  });
});
