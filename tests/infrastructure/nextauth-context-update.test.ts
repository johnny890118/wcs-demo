import { beforeEach, describe, expect, it, vi } from "vitest";
import { testOperationalAccess } from "../fixtures/operational-access";

vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  recordWarehouseContextChange: vi.fn(),
}));

import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { recordWarehouseContextChange } from "../../src/infrastructure/http/wcs-api-client";

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
      currentWarehouseId: targetWarehouseId,
    });
    expect(result.access.principal).toBe(multiWarehouseAccess.principal);
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
