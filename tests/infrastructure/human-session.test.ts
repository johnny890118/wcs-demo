import { afterEach, describe, expect, it } from "vitest";
import {
  defaultHumanSessionTtlSeconds,
  isHumanSessionExpired,
  isHumanSessionReference,
  loadHumanSessionTtlSeconds,
} from "../../src/application/access/human-session";

const originalTtl = process.env.HUMAN_SESSION_TTL_SECONDS;

afterEach(() => {
  if (originalTtl === undefined) {
    delete process.env.HUMAN_SESSION_TTL_SECONDS;
  } else {
    process.env.HUMAN_SESSION_TTL_SECONDS = originalTtl;
  }
});

describe("human session contract", () => {
  const session = {
    sessionId: "90000000-0000-4000-8000-000000000099",
    expiresAt: "2099-01-01T00:00:00.000Z",
  };

  it("accepts only a UUID session with an absolute expiry", () => {
    expect(isHumanSessionReference(session)).toBe(true);
    expect(
      isHumanSessionReference({ ...session, sessionId: "predictable" }),
    ).toBe(false);
    expect(isHumanSessionReference({ ...session, expiresAt: "later" })).toBe(
      false,
    );
  });

  it("expires at the boundary rather than granting a grace interval", () => {
    const boundary = new Date(session.expiresAt);
    expect(
      isHumanSessionExpired(session, new Date(boundary.getTime() - 1)),
    ).toBe(false);
    expect(isHumanSessionExpired(session, boundary)).toBe(true);
  });

  it("bounds the configurable lifetime to one day", () => {
    delete process.env.HUMAN_SESSION_TTL_SECONDS;
    expect(loadHumanSessionTtlSeconds()).toBe(defaultHumanSessionTtlSeconds);
    process.env.HUMAN_SESSION_TTL_SECONDS = "900";
    expect(loadHumanSessionTtlSeconds()).toBe(900);
    process.env.HUMAN_SESSION_TTL_SECONDS = "899";
    expect(() => loadHumanSessionTtlSeconds()).toThrow(
      /HUMAN_SESSION_TTL_SECONDS/,
    );
    process.env.HUMAN_SESSION_TTL_SECONDS = "86401";
    expect(() => loadHumanSessionTtlSeconds()).toThrow(
      /HUMAN_SESSION_TTL_SECONDS/,
    );
  });
});
