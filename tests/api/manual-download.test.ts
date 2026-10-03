import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
import { readFile } from "node:fs/promises";
import { getServerSession } from "next-auth/next";
import handler from "../../pages/api/operations/manual/[locale]";
import { testOperationalSession } from "../fixtures/operational-access";
import { manualVersion } from "../../src/ui/manual/manual-content";
function response() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((name: string, value: string) => {
      res.headers[name] = value;
      return res;
    }),
    status: vi.fn((value: number) => {
      res.statusCode = value;
      return res;
    }),
    json: vi.fn((value: unknown) => {
      res.body = value;
      return res;
    }),
    send: vi.fn((value: unknown) => {
      res.body = value;
      return res;
    }),
  };
  return res;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
  vi.mocked(readFile).mockResolvedValue(Buffer.from("%PDF-test"));
});
describe("authenticated operational manual PDF", () => {
  it("revalidates on every read and prevents caching or indexing", async () => {
    const first = response();
    await handler(
      { method: "GET", query: { locale: "zh-TW" } } as never,
      first as never,
    );
    expect(first.statusCode).toBe(200);
    expect(first.headers["Content-Type"]).toBe("application/pdf");
    expect(first.headers["Content-Disposition"]).toContain(
      `${manualVersion}-zh-TW.pdf`,
    );
    expect(first.headers["Cache-Control"]).toBe("no-store");
    expect(first.headers["X-Robots-Tag"]).toBe("noindex, nofollow");
    vi.mocked(getServerSession).mockResolvedValue(null);
    const second = response();
    await handler(
      { method: "GET", query: { locale: "en" } } as never,
      second as never,
    );
    expect(second.statusCode).toBe(401);
    expect(getServerSession).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledTimes(1);
  });
  it.each(["../../.env", "EN", ["en", "zh-TW"], undefined])(
    "rejects an invalid locale without filesystem access: %s",
    async (locale) => {
      const res = response();
      await handler(
        { method: "GET", query: { locale } } as never,
        res as never,
      );
      expect(res.statusCode).toBe(400);
      expect(readFile).not.toHaveBeenCalled();
    },
  );
  it("denies insufficient permission and foreign warehouse context", async () => {
    const session = {
      ...testOperationalSession,
      access: {
        ...testOperationalSession.access,
        principal: {
          ...testOperationalSession.access.principal,
          permissions: ["audit.view"],
          warehouseScopes:
            testOperationalSession.access.principal.warehouseScopes.map(
              (scope) => ({ ...scope, permissions: ["audit.view"] }),
            ),
        },
      },
    };
    vi.mocked(getServerSession).mockResolvedValue(session as never);
    const denied = response();
    await handler(
      { method: "GET", query: { locale: "en" } } as never,
      denied as never,
    );
    expect(denied.statusCode).toBe(403);
    vi.mocked(getServerSession).mockResolvedValue({
      ...testOperationalSession,
      access: {
        ...testOperationalSession.access,
        currentWarehouseId: "20000000-0000-4000-8000-000000000099",
      },
    });
    const foreign = response();
    await handler(
      { method: "GET", query: { locale: "en" } } as never,
      foreign as never,
    );
    expect(foreign.statusCode).toBe(401);
    expect(readFile).not.toHaveBeenCalled();
  });
  it("rejects writes and conceals missing-asset diagnostics", async () => {
    const write = response();
    await handler(
      { method: "POST", query: { locale: "en" } } as never,
      write as never,
    );
    expect(write.statusCode).toBe(405);
    expect(readFile).not.toHaveBeenCalled();
    vi.mocked(readFile).mockRejectedValue(new Error("private server path"));
    const failed = response();
    await handler(
      { method: "GET", query: { locale: "en" } } as never,
      failed as never,
    );
    expect(failed.statusCode).toBe(503);
    expect(failed.body).toEqual({ code: "MANUAL_UNAVAILABLE" });
  });
});
