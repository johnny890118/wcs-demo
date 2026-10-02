import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", async (original) => ({
  ...(await original<object>()),
  fetchTaskQueue: vi.fn(),
  fetchTaskDetail: vi.fn(),
  fetchInventory: vi.fn(),
}));
import { getServerSession } from "next-auth/next";
import handler from "../../pages/api/operations/tasks/[[...segments]]";
import inventoryHandler from "../../pages/api/operations/inventory";
import {
  fetchTaskDetail,
  fetchTaskQueue,
  fetchInventory,
  WcsProjectionError,
} from "../../src/infrastructure/http/wcs-api-client";
import {
  testOperationalAccess,
  testOperationalSession,
} from "../fixtures/operational-access";
function response() {
  const res = {
    body: undefined as unknown,
    statusCode: 0,
    setHeader: vi.fn(),
    status: vi.fn((value: number) => {
      res.statusCode = value;
      return res;
    }),
    json: vi.fn((value: unknown) => {
      res.body = value;
      return res;
    }),
  };
  return res;
}
describe("task read browser boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
  });
  it("requires a session before upstream reads", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = response();
    await handler({ method: "GET", query: {} } as never, res as never);
    expect(res.statusCode).toBe(401);
    expect(fetchTaskQueue).not.toHaveBeenCalled();
  });
  it("enforces inventory BFF session and scalar-query boundary", async () => {
    const invalid = response();
    await inventoryHandler(
      { method: "GET", query: { search: ["one", "two"] } } as never,
      invalid as never,
    );
    expect(invalid.statusCode).toBe(400);
    expect(fetchInventory).not.toHaveBeenCalled();
    vi.mocked(getServerSession).mockResolvedValue(null);
    const denied = response();
    await inventoryHandler(
      { method: "GET", query: {} } as never,
      denied as never,
    );
    expect(denied.statusCode).toBe(401);
  });
  it("sanitizes inventory upstream errors", async () => {
    vi.mocked(fetchInventory).mockRejectedValue(
      new Error("upstream diagnostic must stay private"),
    );
    const unavailable = response();
    await inventoryHandler(
      { method: "GET", query: {} } as never,
      unavailable as never,
    );
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.body).toEqual({ code: "INVENTORY_UNAVAILABLE" });
  });
  it.each([
    { view: ["all"] },
    { limit: "101" },
    { segments: ["one", "two"] },
    { cursor: ["one"] },
  ])("rejects ambiguous query %j", async (query) => {
    const res = response();
    await handler({ method: "GET", query } as never, res as never);
    expect(res.statusCode).toBe(400);
    expect(fetchTaskQueue).not.toHaveBeenCalled();
    expect(fetchTaskDetail).not.toHaveBeenCalled();
  });
  it("forwards a scoped queue and a single detail separately", async () => {
    await handler(
      { method: "GET", query: { view: "all", limit: "25" } } as never,
      response() as never,
    );
    expect(fetchTaskQueue).toHaveBeenCalledWith(testOperationalAccess, {
      view: "all",
      limit: 25,
      cursor: undefined,
    });
    await handler(
      {
        method: "GET",
        query: { segments: ["50000000-0000-4000-8000-000000000001"] },
      } as never,
      response() as never,
    );
    expect(fetchTaskDetail).toHaveBeenCalledWith(
      testOperationalAccess,
      "50000000-0000-4000-8000-000000000001",
    );
  });
  it.each([404, 503])("sanitizes upstream failure %s", async (status) => {
    vi.mocked(fetchTaskQueue).mockRejectedValue(new WcsProjectionError(status));
    const res = response();
    await handler({ method: "GET", query: {} } as never, res as never);
    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({
      code: status === 404 ? "TASK_NOT_FOUND" : "TASKS_UNAVAILABLE",
    });
  });
});
