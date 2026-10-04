import { afterEach, describe, expect, it } from "vitest";
import { testOperationalAccess } from "../fixtures/operational-access";
import {
  withHumanReadPolicy,
  recordHumanReadAuthority,
  humanReadAuthority,
} from "../../src/infrastructure/auth/human-read-freshness";
import { isReadProjectionAuthority } from "../../src/application/access/read-projection-authority";
const now = Date.parse("2026-10-04T00:00:00Z");
const session = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: new Date(now + 3600000).toISOString(),
};
afterEach(() => {
  delete process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS;
});
describe("server-proven read cache boundary", () => {
  it("exposes only opaque scope/deadline and caps at freshness or independent expiry", () => {
    withHumanReadPolicy("GET", () => {
      recordHumanReadAuthority(testOperationalAccess, session, now, now);
      const authority = humanReadAuthority()!;
      expect(isReadProjectionAuthority(authority)).toBe(true);
      expect(authority.validUntil).toBe(now + 900000);
      expect(Object.keys(authority).sort()).toEqual(["scopeKey", "validUntil"]);
      expect(JSON.stringify(authority)).not.toContain(session.sessionId);
      recordHumanReadAuthority(
        testOperationalAccess,
        { ...session, expiresAt: new Date(now + 1000).toISOString() },
        now,
        now,
      );
      expect(humanReadAuthority()?.validUntil).toBe(now + 1000);
      process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS = "0";
      recordHumanReadAuthority(testOperationalAccess, session, now, now);
      expect(humanReadAuthority()?.validUntil).toBe(now);
    });
  });
  it("partitions session and permission changes and returns defensive metadata", () => {
    withHumanReadPolicy("GET", () => {
      recordHumanReadAuthority(testOperationalAccess, session, now, now);
      const first = humanReadAuthority()!;
      Object.assign(first, { validUntil: 1 });
      expect(humanReadAuthority()?.validUntil).toBe(now + 900000);
      const key = humanReadAuthority()?.scopeKey;
      recordHumanReadAuthority(
        testOperationalAccess,
        { ...session, sessionId: "90000000-0000-4000-8000-000000000098" },
        now,
        now,
      );
      expect(humanReadAuthority()?.scopeKey).not.toBe(key);
      recordHumanReadAuthority(
        {
          ...testOperationalAccess,
          principal: {
            ...testOperationalAccess.principal,
            permissions: ["operations.view"],
          },
        },
        session,
        now,
        now,
      );
      expect(humanReadAuthority()?.scopeKey).not.toBe(key);
    });
  });
  it("clears invalid evidence and never exposes metadata outside approved GET context", () => {
    for (const stamp of [undefined, null, now + 1, 0, NaN, "stamp"])
      withHumanReadPolicy("GET", () => {
        recordHumanReadAuthority(testOperationalAccess, session, now, now);
        recordHumanReadAuthority(testOperationalAccess, session, stamp, now);
        expect(humanReadAuthority()).toBeNull();
      });
    withHumanReadPolicy("POST", () => {
      recordHumanReadAuthority(testOperationalAccess, session, now, now);
      expect(humanReadAuthority()).toBeNull();
    });
    expect(humanReadAuthority()).toBeNull();
  });
  it("isolates simultaneous asynchronous request scopes", async () => {
    const results = await Promise.all(
      [now, now - 1000].map((stamp) =>
        withHumanReadPolicy("GET", async () => {
          recordHumanReadAuthority(testOperationalAccess, session, stamp, now);
          await Promise.resolve();
          return humanReadAuthority();
        }),
      ),
    );
    expect(results.map((item) => item?.validUntil)).toEqual([
      now + 900000,
      now + 899000,
    ]);
  });
});
