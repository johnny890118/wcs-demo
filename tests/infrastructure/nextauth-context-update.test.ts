import { beforeEach, describe, expect, it, vi } from "vitest";
import { testOperationalAccess } from "../fixtures/operational-access";

vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  issueHumanOperationalSession: vi.fn(),
  recordWarehouseContextChange: vi.fn(),
  revokeHumanOperationalSession: vi.fn(),
  validateHumanOperationalSession: vi.fn(),
}));

import { authOptions, authorize } from "../../pages/api/auth/[...nextauth]";
import {
  issueHumanOperationalSession,
  recordWarehouseContextChange,
  revokeHumanOperationalSession,
  validateHumanOperationalSession,
} from "../../src/infrastructure/http/wcs-api-client";

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

    delete process.env.DEMO_ADMIN_USERNAME;
    delete process.env.DEMO_ADMIN_PASSWORD;
  });

  it("revalidates assignments before restoring a signed human session", async () => {
    await authOptions.callbacks.jwt({
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
    const result = await authOptions.callbacks.jwt({
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
    const result = await authOptions.callbacks.jwt({
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
      authOptions.callbacks.jwt({
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
});
