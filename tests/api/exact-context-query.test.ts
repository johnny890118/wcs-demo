import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { ExactContextService } from "../../apps/api/src/operations/exact-context.service";
import { InventoryProjectionService } from "../../apps/api/src/operations/inventory-projection.service";
import { LoadProjectionService } from "../../apps/api/src/operations/load-projection.service";
import { LocationProjectionService } from "../../apps/api/src/operations/location-projection.service";
import { testWarehouseId } from "../fixtures/operational-access";
const id = "50000000-0000-4000-8000-000000000001";
describe("exact context trust boundary", () => {
  it.each([
    ["../x", "load", undefined],
    [id, "unknown", undefined],
    [id, "exception", [id]],
    [id, "load", "not-an-id"],
  ])(
    "rejects malformed or ambiguous identities before connection",
    async (task, surface, alarm) => {
      const pool = { connect: vi.fn() };
      await expect(
        new ExactContextService(pool as unknown as Pool).resolve(
          testWarehouseId,
          task as string,
          surface,
          alarm,
        ),
      ).rejects.toMatchObject({ status: 400 });
      expect(pool.connect).not.toHaveBeenCalled();
    },
  );
  it("rolls back and releases the single read-only client when exact root is unavailable", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    const pool = { connect: vi.fn().mockResolvedValue(client), query: vi.fn() };
    await expect(
      new ExactContextService(pool as unknown as Pool).resolve(
        testWarehouseId,
        id,
        "load",
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(client.query).toHaveBeenNthCalledWith(
      1,
      "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalledOnce();
    expect(pool.query).not.toHaveBeenCalled();
  });
  it.each([
    InventoryProjectionService,
    LoadProjectionService,
    LocationProjectionService,
  ])(
    "exact entity query cannot degrade malformed ID to fuzzy search",
    async (Service) => {
      const pool = { query: vi.fn() };
      await expect(
        new Service(pool as unknown as Pool).list(testWarehouseId, {
          id: [id],
        }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        new Service(pool as unknown as Pool).list(testWarehouseId, {
          id: "not-an-id",
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(pool.query).not.toHaveBeenCalled();
    },
  );
});
