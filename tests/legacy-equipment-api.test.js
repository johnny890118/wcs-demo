import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../pages/api/auth/[...nextauth]", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth/next";
import handler from "../pages/api/index";

function createResponse() {
  const response = {
    body: undefined,
    headers: {},
    statusCode: undefined,
    json: vi.fn((body) => {
      response.body = body;
      return response;
    }),
    setHeader: vi.fn((name, value) => {
      response.headers[name] = value;
    }),
    status: vi.fn((statusCode) => {
      response.statusCode = statusCode;
      return response;
    }),
  };

  return response;
}

describe("legacy equipment API safety boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a server session", async () => {
    getServerSession.mockResolvedValue(null);
    const response = createResponse();

    await handler({ method: "POST" }, response);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
  });

  it("does not claim an equipment command succeeded", async () => {
    getServerSession.mockResolvedValue({ user: { name: "operator" } });
    const response = createResponse();

    await handler({ method: "POST" }, response);

    expect(response.statusCode).toBe(503);
    expect(response.body.code).toBe("EQUIPMENT_COMMANDS_DISABLED");
  });

  it("exposes an authenticated read-only simulator snapshot", async () => {
    getServerSession.mockResolvedValue({ user: { name: "operator" } });
    const response = createResponse();

    await handler({ method: "GET" }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      schemaVersion: 1,
      mode: "simulator",
      capabilities: { observe: true, command: false },
      equipment: [{ equipmentId: "AMR-01", status: "idle" }],
    });
  });

  it("rejects unsupported methods explicitly", async () => {
    getServerSession.mockResolvedValue({ user: { name: "operator" } });
    const response = createResponse();

    await handler({ method: "DELETE" }, response);

    expect(response.statusCode).toBe(405);
    expect(response.body.code).toBe("METHOD_NOT_ALLOWED");
  });
});
