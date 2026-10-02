import { afterEach, describe, expect, it, vi } from "vitest";
import { HumanLoginProtectionService } from "../../apps/api/src/access-context/human-login-protection.service";
import { requestContext } from "../../apps/api/src/logging/request-context";

const fingerprint = "a".repeat(64);
const now = new Date("2026-10-01T00:00:00.000Z");

function harness(results: object[]) {
  const query = vi.fn();
  for (const result of results) query.mockResolvedValueOnce(result);
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }) };
  return {
    service: new HumanLoginProtectionService(pool as never),
    query,
    release,
  };
}

afterEach(() => {
  delete process.env.HUMAN_LOGIN_FAILURE_LIMIT;
  delete process.env.HUMAN_LOGIN_FAILURE_WINDOW_SECONDS;
  delete process.env.HUMAN_LOGIN_THROTTLE_SECONDS;
});

describe("persistent human login protection", () => {
  it("records a failed attempt without storing a raw identifier", async () => {
    const { service, query, release } = harness([
      {},
      {},
      { rows: [{ now }] },
      { rows: [] },
      {},
      {},
      {},
    ]);

    await expect(
      requestContext.run({ requestId: "request:login-failure-001" }, () =>
        service.evaluate("demo-credentials", fingerprint, false),
      ),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: null });
    expect(query.mock.calls[4][0]).toContain("human_login_throttles");
    expect(query.mock.calls[5][0]).toContain("authentication_security_events");
    expect(query.mock.calls[5][1]).toEqual([
      expect.any(String),
      "demo-credentials",
      fingerprint,
      "failed",
      "request:login-failure-001",
    ]);
    expect(query.mock.calls.flat()).not.toContain("operator@example.com");
    expect(release).toHaveBeenCalled();
  });

  it("blocks at the configured threshold and reports database-clock retry", async () => {
    process.env.HUMAN_LOGIN_FAILURE_LIMIT = "3";
    process.env.HUMAN_LOGIN_THROTTLE_SECONDS = "120";
    const { service, query } = harness([
      {},
      {},
      { rows: [{ now }] },
      {
        rows: [
          {
            failure_count: 2,
            window_started_at: new Date("2026-09-30T23:59:00.000Z"),
            blocked_until: null,
          },
        ],
      },
      {},
      {},
      {},
    ]);

    await expect(
      service.evaluate("demo-credentials", fingerprint, false),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 120 });
    expect(query.mock.calls[4][1][2]).toBe(3);
    expect(query.mock.calls[4][1][5]).toEqual(
      new Date("2026-10-01T00:02:00.000Z"),
    );
  });

  it("denies even a valid credential while blocked and records throttling", async () => {
    const blockedUntil = new Date("2026-10-01T00:01:01.000Z");
    const { service, query } = harness([
      {},
      {},
      { rows: [{ now }] },
      {
        rows: [
          {
            failure_count: 5,
            window_started_at: new Date("2026-09-30T23:59:00.000Z"),
            blocked_until: blockedUntil,
          },
        ],
      },
      {},
      {},
    ]);

    await expect(
      service.evaluate("demo-credentials", fingerprint, true),
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 61 });
    expect(query.mock.calls[4][1][3]).toBe("throttled");
    expect(query.mock.calls[5][0]).toBe("COMMIT");
  });

  it("clears expired failure state after accepted proof", async () => {
    const { service, query } = harness([
      {},
      {},
      { rows: [{ now }] },
      {
        rows: [
          {
            failure_count: 5,
            window_started_at: new Date("2026-09-30T22:00:00.000Z"),
            blocked_until: new Date("2026-09-30T23:00:00.000Z"),
          },
        ],
      },
      {},
      {},
    ]);

    await expect(
      service.evaluate("demo-credentials", fingerprint, true),
    ).resolves.toEqual({ allowed: true, retryAfterSeconds: null });
    expect(query.mock.calls[4][0]).toContain(
      "DELETE FROM human_login_throttles",
    );
    expect(query.mock.calls[5][0]).toBe("COMMIT");
  });
});
