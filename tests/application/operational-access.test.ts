import { describe, expect, it } from "vitest";
import {
  currentWarehouse,
  hasUserPermission,
  isOperationalAccess,
  selectCurrentWarehouse,
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

  it("changes only the current warehouse within the existing principal scope", () => {
    const secondWarehouseId = "20000000-0000-4000-8000-000000000001";
    const access = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        warehouseScopes: [
          ...testOperationalAccess.principal.warehouseScopes,
          {
            warehouseId: secondWarehouseId,
            code: "SECOND",
            name: "Second Warehouse",
          },
        ],
      },
    };
    expect(selectCurrentWarehouse(access, secondWarehouseId)).toEqual({
      ...access,
      currentWarehouseId: secondWarehouseId,
    });
    expect(selectCurrentWarehouse(access, access.currentWarehouseId)).toBe(
      access,
    );
    expect(() =>
      selectCurrentWarehouse(access, "30000000-0000-4000-8000-000000000001"),
    ).toThrow(/outside the principal scope/);
  });
});
