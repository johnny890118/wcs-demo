import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { LoadProjectionService } from "../../apps/api/src/operations/load-projection.service";
import { testWarehouseId } from "../fixtures/operational-access";
describe("load read query boundary", () => {
  it.each([
    { search: ["one"] },
    { search: "s".repeat(101) },
    { limit: "1e2" },
    { limit: 0 },
    { limit: 101 },
    { cursor: "!" },
    { cursor: Buffer.from("null").toString("base64url") },
    {
      cursor: Buffer.from(
        JSON.stringify({
          surface: "inventory",
          warehouseId: testWarehouseId,
          search: "",
          id: "41000000-0000-4000-8000-000000000001",
        }),
      ).toString("base64url"),
    },
  ])("rejects %j before SQL", async (query) => {
    const pool = { query: vi.fn() };
    await expect(
      new LoadProjectionService(pool as unknown as Pool).list(
        testWarehouseId,
        query,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("does not invent stock if inventory has not been recorded", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            loadId: "41000000-0000-4000-8000-000000000001",
            inventoryQuantity: null,
            updatedAt: new Date(),
          },
        ],
      }),
    };
    const page = await new LoadProjectionService(pool as unknown as Pool).list(
      testWarehouseId,
    );
    expect(page.items[0].inventory).toBeNull();
  });
});
