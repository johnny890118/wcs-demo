import { describe, expect, it } from "vitest";
import {
  currentWarehouse,
  hasUserPermission,
  isOperationalAccess,
} from "../../src/application/access/operational-access";
import {
  testOperationalAccess,
  testWarehouseId,
} from "../fixtures/operational-access";

describe("operational access contract", () => {
  it("accepts a unique permission set with an explicit in-scope warehouse", () => {
    expect(isOperationalAccess(testOperationalAccess)).toBe(true);
    expect(hasUserPermission(testOperationalAccess, "operations.view")).toBe(
      true,
    );
    expect(currentWarehouse(testOperationalAccess)).toMatchObject({
      warehouseId: testWarehouseId,
      code: "TEST",
    });
  });

  it("fails closed for unknown permissions, duplicate scopes, and out-of-scope context", () => {
    expect(
      isOperationalAccess({
        ...testOperationalAccess,
        principal: {
          ...testOperationalAccess.principal,
          permissions: ["operations.view", "admin.everything"],
        },
      }),
    ).toBe(false);
    expect(
      isOperationalAccess({
        ...testOperationalAccess,
        principal: {
          ...testOperationalAccess.principal,
          warehouseScopes: [
            ...testOperationalAccess.principal.warehouseScopes,
            ...testOperationalAccess.principal.warehouseScopes,
          ],
        },
      }),
    ).toBe(false);
    expect(
      isOperationalAccess({
        ...testOperationalAccess,
        currentWarehouseId: "20000000-0000-4000-8000-000000000001",
      }),
    ).toBe(false);
  });
});
