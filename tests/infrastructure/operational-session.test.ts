import type { Session } from "next-auth";
import { describe, expect, it } from "vitest";
import { authorizeOperationalSession } from "../../src/infrastructure/auth/operational-session";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import {
  testOperationalAccess,
  testOperationalRuntime,
  testWarehouseId,
} from "../fixtures/operational-access";

function session(access: Session["access"]): Session {
  return {
    user: { name: "Test Operator" },
    expires: "2099-01-01T00:00:00.000Z",
    access,
    runtime: testOperationalRuntime,
  };
}

describe("operational session decisions", () => {
  it("distinguishes permission denial from an expired anonymous demo", () => {
    expect(
      authorizeOperationalSession(session(testOperationalAccess), "audit.view"),
    ).toMatchObject({ allowed: true });

    const forbidden = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        permissions: ["operations.view"] as const,
      },
    };
    expect(
      authorizeOperationalSession(session(forbidden), "audit.view"),
    ).toEqual({ allowed: false, reason: "forbidden" });
    expect(
      operationalPageAccess(
        session(forbidden),
        "audit.view",
        "/operations/audit",
      ),
    ).toEqual({
      allowed: false,
      destination: "/operations/access-denied",
    });

    const sessionId = "90000000-0000-4000-8000-000000000099";
    const expired = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        kind: "anonymous_demo" as const,
        subject: `anonymous-demo:${sessionId}`,
      },
      currentWarehouseId: testWarehouseId,
      demoSessionScope: {
        sessionId,
        expiresAt: "2020-01-01T00:00:00.000Z",
      },
    };
    expect(
      authorizeOperationalSession(session(expired), "operations.view"),
    ).toEqual({ allowed: false, reason: "expired-session" });
    expect(
      operationalPageAccess(
        session(expired),
        "operations.view",
        "/operations/inbound",
      ),
    ).toEqual({
      allowed: false,
      destination: "/login?callbackUrl=%2Foperations%2Finbound&reason=expired",
    });
  });
});
