import { describe, expect, it, vi } from "vitest";
import { mayReuseHumanReadClaims } from "../../src/infrastructure/auth/human-read-freshness";
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
  });
});
