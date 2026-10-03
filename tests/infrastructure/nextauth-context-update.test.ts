import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testOperationalAccess } from "../fixtures/operational-access";
import { withHumanReadPolicy } from "../../src/infrastructure/auth/human-read-freshness";

vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  evaluateHumanLoginAttempt: vi.fn(),
  issueHumanOperationalSession: vi.fn(),
  recordWarehouseContextChange: vi.fn(),
  revokeHumanOperationalSession: vi.fn(),
  validateHumanOperationalSession: vi.fn(),
}));

import { authOptions, authorize } from "../../pages/api/auth/[...nextauth]";
import {
  evaluateHumanLoginAttempt,
  issueHumanOperationalSession,
  recordWarehouseContextChange,
  revokeHumanOperationalSession,
  validateHumanOperationalSession,
} from "../../src/infrastructure/http/wcs-api-client";

function restoreJwt(input: {
  token: Record<string, unknown>;
  user?: unknown;
  trigger?: string;
  session?: unknown;
}) {
  return authOptions.callbacks.jwt({
    user: undefined,
    trigger: undefined,
    session: undefined,
    ...input,
  });
}

const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
const humanSession = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: "2099-01-01T00:00:00.000Z",
};
const multiWarehouseAccess = {
  ...testOperationalAccess,
  principal: {
    ...testOperationalAccess.principal,
    warehouseScopes: [
      ...testOperationalAccess.principal.warehouseScopes,
      {
        warehouseId: targetWarehouseId,
        code: "SECOND",
        name: "Second Warehouse",
        permissions: ["operations.view", "audit.view"] as const,
      },
    ],
  },
};

describe("NextAuth persisted human sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = "s".repeat(40);
    vi.mocked(evaluateHumanLoginAttempt).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: null,
    });
    vi.mocked(recordWarehouseContextChange).mockResolvedValue({
      currentWarehouseId: targetWarehouseId,
    });
    vi.mocked(issueHumanOperationalSession).mockResolvedValue({
      access: testOperationalAccess,
      session: humanSession,
    });
    vi.mocked(validateHumanOperationalSession).mockImplementation(
      async (session, access) => ({ session, access }),
    );
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.HUMAN_SESSION_READ_FRESHNESS_SECONDS;
    vi.useRealTimers();
  });

  it("uses credentials only as identity proof and issues a persisted session", async () => {
    const password = ["configured", "password"].join("-");
    process.env.DEMO_ADMIN_USERNAME = "configured-user";
    process.env.DEMO_ADMIN_PASSWORD = password;

    await expect(
      authorize({
        username: "configured-user",
        password,
      }),
    ).resolves.toEqual({
      id: testOperationalAccess.principal.subject,
      name: testOperationalAccess.principal.displayName,
      access: testOperationalAccess,
      humanSession,
    });
    expect(issueHumanOperationalSession).toHaveBeenCalledWith(
      "demo-credentials",
      "legacy-demo-admin",
    );
    expect(evaluateHumanLoginAttempt).toHaveBeenCalledWith(
      "demo-credentials",
      expect.stringMatching(/^[0-9a-f]{64}$/),
      true,
    );

    delete process.env.DEMO_ADMIN_USERNAME;
    delete process.env.DEMO_ADMIN_PASSWORD;
  });

  it("records rejected proof and returns the same generic denial", async () => {
    const password = ["configured", "password", "safe-length"].join("-");
    const rejectedPassword = ["wrong", "password"].join("-");
    process.env.DEMO_ADMIN_USERNAME = "configured-user";
    process.env.DEMO_ADMIN_PASSWORD = password;
    vi.mocked(evaluateHumanLoginAttempt).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: null,
    });

    await expect(
      authorize({ username: "configured-user", password: rejectedPassword }),
    ).resolves.toBeNull();
    expect(evaluateHumanLoginAttempt).toHaveBeenCalledWith(
      "demo-credentials",
      expect.stringMatching(/^[0-9a-f]{64}$/),
      false,
    );
    expect(issueHumanOperationalSession).not.toHaveBeenCalled();

    delete process.env.DEMO_ADMIN_USERNAME;
    delete process.env.DEMO_ADMIN_PASSWORD;
  });

  it("denies accepted proof while the persisted throttle is active", async () => {
    const password = ["configured", "password", "safe-length"].join("-");
    process.env.DEMO_ADMIN_USERNAME = "configured-user";
    process.env.DEMO_ADMIN_PASSWORD = password;
    vi.mocked(evaluateHumanLoginAttempt).mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 300,
    });

    await expect(
      authorize({
        username: "configured-user",
        password,
      }),
    ).resolves.toBeNull();
    expect(issueHumanOperationalSession).not.toHaveBeenCalled();

    delete process.env.DEMO_ADMIN_USERNAME;
    delete process.env.DEMO_ADMIN_PASSWORD;
  });

  it("revalidates assignments before restoring a signed human session", async () => {
    await restoreJwt({
      token: { access: testOperationalAccess, humanSession },
      user: undefined,
      trigger: undefined,
      session: undefined,
    });

    expect(validateHumanOperationalSession).toHaveBeenCalledWith(
      humanSession,
      testOperationalAccess,
    );
  });

  it("fails closed when the persisted session is revoked or unavailable", async () => {
    vi.mocked(validateHumanOperationalSession).mockRejectedValue(
      new Error("revoked"),
    );
    const result = await restoreJwt({
      token: { access: testOperationalAccess, humanSession },
      user: undefined,
      trigger: undefined,
      session: undefined,
    });

    expect(result.access).toBeUndefined();
    expect(result.humanSession).toBeUndefined();
  });

  it("records evidence and persists context before changing the signed claim", async () => {
    const token = { access: multiWarehouseAccess, humanSession };
    const result = await restoreJwt({
      token,
      user: undefined,
      trigger: "update",
      session: { currentWarehouseId: targetWarehouseId },
    });

    expect(recordWarehouseContextChange).toHaveBeenCalledWith(
      multiWarehouseAccess,
      targetWarehouseId,
    );
    expect(validateHumanOperationalSession).toHaveBeenLastCalledWith(
      humanSession,
      expect.objectContaining({ currentWarehouseId: targetWarehouseId }),
    );
    expect(result.access).toEqual({
      ...multiWarehouseAccess,
      principal: {
        ...multiWarehouseAccess.principal,
        permissions: ["operations.view", "audit.view"],
      },
      currentWarehouseId: targetWarehouseId,
    });
  });

  it("rejects a client-proposed warehouse outside the revalidated scope", async () => {
    await expect(
      restoreJwt({
        token: { access: multiWarehouseAccess, humanSession },
        user: undefined,
        trigger: "update",
        session: {
          currentWarehouseId: "30000000-0000-4000-8000-000000000001",
        },
      }),
    ).rejects.toThrow(/outside the principal scope/);
    expect(recordWarehouseContextChange).not.toHaveBeenCalled();
  });

  it("revokes the durable session during sign out", async () => {
    await authOptions.events.signOut({
      token: { access: testOperationalAccess, humanSession },
    });

    expect(revokeHumanOperationalSession).toHaveBeenCalledWith(
      humanSession,
      "sign_out",
    );
  });

  it("reuses only fresh read claims without extending validation time or expiry", async () => {
    const validatedAt = Date.now() - 1000;
    const token = {
      access: testOperationalAccess,
      humanSession,
      humanValidatedAt: validatedAt,
    };
    const result = await withHumanReadPolicy("GET", () =>
      restoreJwt({ token }),
    );
    expect(validateHumanOperationalSession).not.toHaveBeenCalled();
    expect(result.humanValidatedAt).toBe(validatedAt);
    expect(result.humanSession).toEqual(humanSession);
    const clientSession = authOptions.callbacks.session({
      session: {},
      token: result,
    });
    expect(clientSession).not.toHaveProperty("humanValidatedAt");
    expect(clientSession).not.toHaveProperty("humanSession");
  });

  it.each([
    "principal disabled",
    "assignment revoked",
    "session revoked",
    "registry unavailable",
  ])(
    "bounds stale reads but fails closed for strict mutation when %s",
    async (reason) => {
      vi.mocked(validateHumanOperationalSession).mockRejectedValue(
        new Error(reason),
      );
      const token = {
        access: testOperationalAccess,
        humanSession,
        humanValidatedAt: Date.now(),
      };
      const read = await withHumanReadPolicy("GET", () =>
        restoreJwt({ token: { ...token } }),
      );
      expect(read.access).toEqual(testOperationalAccess);
      expect(validateHumanOperationalSession).not.toHaveBeenCalled();
      const mutation = await withHumanReadPolicy("POST", () =>
        restoreJwt({ token: { ...token } }),
      );
      expect(mutation.access).toBeUndefined();
      expect(mutation.humanSession).toBeUndefined();
      expect(mutation.humanValidatedAt).toBeUndefined();
      const stale = await withHumanReadPolicy("GET", () =>
        restoreJwt({
          token: { ...token, humanValidatedAt: Date.now() - 3600000 },
        }),
      );
      expect(stale.access).toBeUndefined();
    },
  );

  it("applies changed permissions on strict restore and at the read freshness deadline", async () => {
    const access = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        permissions: ["operations.view"] as const,
      },
    };
    vi.mocked(validateHumanOperationalSession).mockResolvedValue({
      access,
      session: humanSession,
    });
    const token = {
      access: testOperationalAccess,
      humanSession,
      humanValidatedAt: Date.now(),
    };
    const strict = await restoreJwt({ token: { ...token } });
    expect(strict.access.principal.permissions).toEqual(["operations.view"]);
    const stale = await withHumanReadPolicy("GET", () =>
      restoreJwt({
        token: { ...token, humanValidatedAt: Date.now() - 3600000 },
      }),
    );
    expect(stale.access.principal.permissions).toEqual(["operations.view"]);
  });

  it("rejects expired persisted sessions even with a fresh validation stamp", async () => {
    const token = {
      access: testOperationalAccess,
      humanSession: {
        ...humanSession,
        expiresAt: new Date(Date.now() - 1).toISOString(),
      },
      humanValidatedAt: Date.now(),
    };
    const result = await withHumanReadPolicy("GET", () =>
      restoreJwt({ token }),
    );
    expect(result.access).toBeUndefined();
    expect(result.humanValidatedAt).toBeUndefined();
    expect(validateHumanOperationalSession).not.toHaveBeenCalled();
  });

  it("forces immediate warehouse validation even within a fresh read context", async () => {
    const token = {
      access: multiWarehouseAccess,
      humanSession,
      humanValidatedAt: Date.now(),
    };
    await withHumanReadPolicy("GET", () =>
      restoreJwt({
        token,
        trigger: "update",
        session: { currentWarehouseId: targetWarehouseId },
      }),
    );
    expect(validateHumanOperationalSession).toHaveBeenCalledTimes(2);
    expect(recordWarehouseContextChange).toHaveBeenCalledOnce();
  });
});
