import { beforeEach, describe, expect, it, vi } from "vitest";
import { testOperationalAccess } from "../fixtures/operational-access";

vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  recordWarehouseContextChange: vi.fn(),
  resolveHumanOperationalAccess: vi.fn(),
}));

import { authOptions, authorize } from "../../pages/api/auth/[...nextauth]";
import {
  recordWarehouseContextChange,
  resolveHumanOperationalAccess,
} from "../../src/infrastructure/http/wcs-api-client";

const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
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

describe("NextAuth warehouse context updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recordWarehouseContextChange).mockResolvedValue({
      currentWarehouseId: targetWarehouseId,
    });
    vi.mocked(resolveHumanOperationalAccess).mockResolvedValue(
      testOperationalAccess,
    );
  });

  it("uses credentials only as identity proof and resolves grants from persistence", async () => {
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
    });
    expect(resolveHumanOperationalAccess).toHaveBeenCalledWith(
      "demo-credentials",
      "legacy-demo-admin",
    );

    delete process.env.DEMO_ADMIN_USERNAME;
    delete process.env.DEMO_ADMIN_PASSWORD;
  });

  it("records evidence before changing only the signed current warehouse claim", async () => {
    const token = { access: multiWarehouseAccess };
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
    expect(result.access).toEqual({
      ...multiWarehouseAccess,
      principal: {
        ...multiWarehouseAccess.principal,
        permissions: ["operations.view", "audit.view"],
      },
      currentWarehouseId: targetWarehouseId,
    });
  });

  it("rejects a client-proposed warehouse outside the signed scope", async () => {
    await expect(
      authOptions.callbacks.jwt({
        token: { access: multiWarehouseAccess },
        user: undefined,
        trigger: "update",
        session: {
          currentWarehouseId: "30000000-0000-4000-8000-000000000001",
        },
      }),
    ).rejects.toThrow(/outside the principal scope/);
    expect(recordWarehouseContextChange).not.toHaveBeenCalled();
  });
});
