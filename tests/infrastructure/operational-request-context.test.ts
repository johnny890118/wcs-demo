import { describe, expect, it, vi } from "vitest";
import {
  mayReuseHumanReadClaims,
  recordHumanReadAuthority,
} from "../../src/infrastructure/auth/human-read-freshness";
import { testOperationalAccess } from "../fixtures/operational-access";
import {
  withReadOnlyOperationalBff,
  withReadOnlyOperationalNavigation,
} from "../../src/infrastructure/http/operational-request-context";
import { recordRequestTiming } from "../../src/infrastructure/http/request-timing";

const now = Date.now();
const reference = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: new Date(now + 7200000).toISOString(),
};
describe("explicit read request boundary", () => {
  it("enforces method isolation even if a future mixed-method BFF is wrapped", async () => {
    const observed: boolean[] = [];
    const handler = withReadOnlyOperationalBff(async (_request, response) => {
      await Promise.resolve();
      observed.push(mayReuseHumanReadClaims(reference, now, undefined, now));
      recordRequestTiming("projection_api", 3);
      response.json({ ok: true });
    });
    const responses = ["GET", "POST"].map((method) => {
      const json = vi.fn();
      const response = { json, setHeader: vi.fn() };
      return { method, response, json };
    });
    await Promise.all(
      responses.map(({ method, response }) =>
        handler({ method } as never, response as never),
      ),
    );
    expect(observed).toEqual([true, false]);
    for (const { response, json } of responses) {
      expect(response.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        "private, no-store",
      );
      expect(response.json).toBe(json);
      expect(response.setHeader).toHaveBeenCalledWith(
        "Server-Timing",
        expect.stringContaining("projection_api;dur=3.00"),
      );
      expect(json).toHaveBeenCalledWith({ ok: true });
    }
    expect(mayReuseHumanReadClaims(reference, now, undefined, now)).toBe(false);
  });
  it("records denied SSR timing while preserving the redirect", async () => {
    const res = { headersSent: false, setHeader: vi.fn() };
    const handler = withReadOnlyOperationalNavigation(async () => ({
      redirect: { destination: "/login", permanent: false },
    }));
    expect(await handler({ req: { method: "GET" }, res } as never)).toEqual({
      redirect: { destination: "/login", permanent: false },
    });
    expect(res.setHeader).toHaveBeenCalledWith(
      "Server-Timing",
      expect.stringMatching(/^navigation_server;dur=\d+\.\d{2}$/),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store",
    );
  });
  it("emits opaque authority only on successful opted-in reads, never denied or strict requests", async () => {
    for (const method of ["GET", "POST"])
      for (const statusCode of [200, 401, 403, 500]) {
        const response = {
          statusCode,
          headersSent: false,
          setHeader: vi.fn(),
          json: vi.fn(),
        };
        const handler = withReadOnlyOperationalBff(async (_req, res) => {
          recordHumanReadAuthority(testOperationalAccess, reference, now, now);
          res.json({ ok: statusCode === 200 });
        });
        await handler({ method } as never, response as never);
        const keys = response.setHeader.mock.calls.map(([key]) => key);
        expect(keys.includes("X-SWP-Read-Scope")).toBe(
          method === "GET" && statusCode === 200,
        );
        expect(keys.includes("X-SWP-Read-Until")).toBe(
          method === "GET" && statusCode === 200,
        );
        expect(response.setHeader).toHaveBeenCalledWith(
          "Cache-Control",
          "private, no-store",
        );
      }
  });
  it("isolates successful SSR authority and keeps redirects private", async () => {
    const handler = withReadOnlyOperationalNavigation(async () => {
      recordHumanReadAuthority(testOperationalAccess, reference, now, now);
      return { props: { ok: true } };
    });
    const results = await Promise.all(
      ["GET", "POST"].map(async (method) => {
        const res = { headersSent: false, setHeader: vi.fn() };
        const result = await handler({ req: { method }, res } as never);
        expect(res.setHeader).toHaveBeenCalledWith(
          "Cache-Control",
          "private, no-store",
        );
        return result;
      }),
    );
    expect(results[0]).toMatchObject({
      props: {
        ok: true,
        operationalReadContext: {
          scopeKey: expect.stringMatching(/^[a-f0-9]{64}$/),
        },
      },
    });
    expect(results[1]).toEqual({
      props: { ok: true, operationalReadContext: null },
    });
  });
});
