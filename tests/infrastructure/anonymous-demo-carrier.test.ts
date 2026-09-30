import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  anonymousDemoCookie,
  anonymousDemoCookieName,
  authorizeAnonymousDemoCarrier,
  createAnonymousDemoAccess,
  issueAnonymousDemoCarrier,
  verifyAnonymousDemoCarrier,
} from "../../src/infrastructure/auth/anonymous-demo-carrier";

const sessionId = "90000000-0000-4000-8000-000000000099";
const now = new Date("2026-09-29T12:00:00.000Z");
const runtime = {
  environment: "production" as const,
  deploymentProfile: "public_demo" as const,
  equipmentSource: "simulation" as const,
};

describe("anonymous demo access carrier", () => {
  beforeEach(() => {
    process.env.ANONYMOUS_DEMO_SECRET = "a".repeat(48);
    process.env.PUBLIC_DEMO_USER_PERMISSIONS = "operations.view,inbound.create";
  });

  afterEach(() => {
    delete process.env.ANONYMOUS_DEMO_SECRET;
    delete process.env.ANONYMOUS_DEMO_SESSION_TTL_SECONDS;
    delete process.env.PUBLIC_DEMO_USER_PERMISSIONS;
  });

  it("issues a bounded opaque carrier and derives server-owned access", () => {
    const carrier = issueAnonymousDemoCarrier({
      now,
      createId: () => sessionId,
    });
    expect(carrier.token).not.toContain(sessionId);
    expect(carrier.maxAgeSeconds).toBe(1_800);
    expect(verifyAnonymousDemoCarrier(carrier.token, now)).toEqual(
      carrier.scope,
    );
    expect(createAnonymousDemoAccess(carrier.scope)).toMatchObject({
      principal: {
        kind: "anonymous_demo",
        subject: `anonymous-demo:${sessionId}`,
        permissions: ["operations.view", "inbound.create"],
      },
      demoSessionScope: carrier.scope,
    });
    expect(anonymousDemoCookie(carrier, true)).toContain(
      `${anonymousDemoCookieName}=`,
    );
    expect(anonymousDemoCookie(carrier, true)).toContain(
      "HttpOnly; SameSite=Strict; Secure",
    );
  });

  it("rejects tampering, expiry, unsafe TTLs, and missing secrets", () => {
    const carrier = issueAnonymousDemoCarrier({
      now,
      createId: () => sessionId,
    });
    expect(
      verifyAnonymousDemoCarrier(`${carrier.token.slice(0, -1)}x`, now),
    ).toBeNull();
    expect(
      verifyAnonymousDemoCarrier(
        carrier.token,
        new Date("2026-09-29T12:31:00.000Z"),
      ),
    ).toBeNull();
    process.env.ANONYMOUS_DEMO_SESSION_TTL_SECONDS = "10";
    expect(() => issueAnonymousDemoCarrier({ now })).toThrow(/300 to 7200/);
    delete process.env.ANONYMOUS_DEMO_SESSION_TTL_SECONDS;
    delete process.env.ANONYMOUS_DEMO_SECRET;
    expect(() => issueAnonymousDemoCarrier({ now })).toThrow(/32 bytes/);
  });

  it("authorizes only public simulation permissions carried by a valid cookie", () => {
    const carrier = issueAnonymousDemoCarrier({
      now,
      createId: () => sessionId,
    });
    const cookieHeader = `${anonymousDemoCookieName}=${carrier.token}`;
    expect(
      authorizeAnonymousDemoCarrier({
        cookieHeader,
        permission: "inbound.create",
        runtime,
        now,
      }),
    ).toMatchObject({ allowed: true });
    expect(
      authorizeAnonymousDemoCarrier({
        cookieHeader,
        permission: "alarm.recover",
        runtime,
        now,
      }),
    ).toEqual({ allowed: false, reason: "forbidden" });
    expect(
      authorizeAnonymousDemoCarrier({
        cookieHeader,
        permission: "operations.view",
        runtime: { ...runtime, deploymentProfile: "private_demo" },
        now,
      }),
    ).toEqual({ allowed: false, reason: "unavailable" });
  });
});
