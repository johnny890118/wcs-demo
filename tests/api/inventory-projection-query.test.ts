import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { InventoryProjectionService } from "../../apps/api/src/operations/inventory-projection.service";
import { testWarehouseId } from "../fixtures/operational-access";
describe("inventory query boundary", () => {
  it.each([
    { search: ["sku"] },
    { search: "s".repeat(101) },
    { limit: 0 },
    { limit: 101 },
    { limit: "1e2" },
    { cursor: "!" },
    { cursor: Buffer.from("null").toString("base64url") },
    {
      cursor: Buffer.from(
        JSON.stringify({
          warehouseId: "foreign",
          search: "",
          id: "81000000-0000-4000-8000-000000000001",
        }),
      ).toString("base64url"),
    },
  ])("rejects %j before SQL", async (query) => {
    const pool = { query: vi.fn() };
    const service = new InventoryProjectionService(pool as unknown as Pool);
    await expect(service.list(testWarehouseId, query)).rejects.toMatchObject({
      status: 400,
    });
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("binds pagination to the warehouse and literal search", async () => {
    const row = {
      inventoryUnitId: "81000000-0000-4000-8000-000000000001",
      updatedAt: new Date(),
    };
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          row,
          { ...row, inventoryUnitId: "81000000-0000-4000-8000-000000000002" },
        ],
      }),
    };
    const service = new InventoryProjectionService(pool as unknown as Pool);
    const first = await service.list(testWarehouseId, {
      search: " SKU ",
      limit: 1,
    });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();
    await expect(
      service.list(testWarehouseId, {
        search: "different",
        cursor: first.nextCursor,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await service.list(testWarehouseId, {
      search: "SKU",
      cursor: first.nextCursor,
    });
    expect(pool.query.mock.calls.at(-1)?.[1]).toEqual([
      testWarehouseId,
      row.inventoryUnitId,
      "SKU",
      51,
    ]);
  });
});
