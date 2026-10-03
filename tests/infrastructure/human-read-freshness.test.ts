import { afterEach, describe, expect, it } from "vitest";
import {
  loadHumanReadFreshnessSeconds,
  mayReuseHumanReadClaims,
  withHumanReadPolicy,
} from "../../src/infrastructure/auth/human-read-freshness";

const now = Date.parse("2026-10-03T12:00:00Z");
const session = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: new Date(now + 7200000).toISOString(),
};
afterEach(() => {
  delete process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS;
});

describe("bounded human read authority", () => {
  it("defaults to 3600 seconds, supports strict zero and rejects invalid settings", () => {
    expect(loadHumanReadFreshnessSeconds()).toBe(3600);
    process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS = "0";
    expect(
      withHumanReadPolicy("GET", () =>
        mayReuseHumanReadClaims(session, now, undefined, now),
      ),
    ).toBe(false);
    for (const value of ["", " ", "-1", "3601", "NaN", "1.5", "1e3"]) {
      process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS = value;
      expect(loadHumanReadFreshnessSeconds).toThrow(/0 to 3600/);
    }
  });
  it("requires an explicit GET context and rejects update even inside it", () => {
    expect(mayReuseHumanReadClaims(session, now, undefined, now)).toBe(false);
    for (const method of [undefined, "POST", "PATCH", "DELETE", "HEAD"]) {
      expect(
        withHumanReadPolicy(method, () =>
          mayReuseHumanReadClaims(session, now, undefined, now),
        ),
      ).toBe(false);
    }
    expect(
      withHumanReadPolicy("GET", () =>
        mayReuseHumanReadClaims(session, now, "update", now),
      ),
    ).toBe(false);
    expect(
      withHumanReadPolicy("GET", () =>
        mayReuseHumanReadClaims(session, now, undefined, now),
      ),
    ).toBe(true);
  });
  it("uses a non-sliding exact freshness boundary and independently checks expiry", () => {
    withHumanReadPolicy("GET", () => {
      expect(
        mayReuseHumanReadClaims(session, now, undefined, now + 3599999),
      ).toBe(true);
      expect(
        mayReuseHumanReadClaims(session, now, undefined, now + 3600000),
      ).toBe(false);
      expect(
        mayReuseHumanReadClaims(
          { ...session, expiresAt: new Date(now).toISOString() },
          now,
          undefined,
          now,
        ),
      ).toBe(false);
      for (const stamp of [
        undefined,
        null,
        "timestamp",
        now + 1,
        0,
        -1,
        NaN,
        Infinity,
        now + 0.5,
      ]) {
        expect(mayReuseHumanReadClaims(session, stamp, undefined, now)).toBe(
          false,
        );
      }
      expect(
        mayReuseHumanReadClaims(
          { ...session, sessionId: "invalid" },
          now,
          undefined,
          now,
        ),
      ).toBe(false);
    });
  });
  it("keeps parallel read and mutation policy isolated", async () => {
    const values = await Promise.all(
      ["GET", "POST"].map((method) =>
        withHumanReadPolicy(method, async () => {
          await Promise.resolve();
          return mayReuseHumanReadClaims(session, now, undefined, now);
        }),
      ),
    );
    expect(values).toEqual([true, false]);
  });
});
