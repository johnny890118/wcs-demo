import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { LocationProjectionService } from "../../apps/api/src/operations/location-projection.service";
import { isLocationPage } from "../../src/application/operations/location-projection";
import { testWarehouseId } from "../fixtures/operational-access";
describe("location read contract", () => {
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
          surface: "loads",
          warehouseId: testWarehouseId,
          search: "",
          id: "41000000-0000-4000-8000-000000000001",
        }),
      ).toString("base64url"),
    },
  ])("rejects %j before SQL", async (query) => {
    const pool = { query: vi.fn() };
    await expect(
      new LocationProjectionService(pool as unknown as Pool).list(
        testWarehouseId,
        query,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });
  const item = {
    locationId: "20000000-0000-4000-8000-000000000001",
    code: "Receiving",
    kind: "receiving",
    status: "available",
    capabilities: ["receive"],
    recordedLoads: 1,
    stockRecords: 0,
    binding: null,
  };
  it("accepts unbound configuration without inventing topology identity", () => {
    expect(
      isLocationPage({
        items: [item],
        nextCursor: null,
        generatedAt: new Date().toISOString(),
      }),
    ).toBe(true);
  });
  it.each([
    { recordedLoads: -1 },
    { stockRecords: 1.5 },
    { status: "safe" },
    { binding: { topologyId: "not-uuid", revision: 1, nodeId: "Receiving" } },
    {
      binding: {
        topologyId: testWarehouseId,
        revision: 0,
        nodeId: "Receiving",
      },
    },
    { capabilities: [null] },
  ])("rejects malformed evidence %j", (changes) => {
    expect(
      isLocationPage({
        items: [{ ...item, ...changes }],
        nextCursor: null,
        generatedAt: new Date().toISOString(),
      }),
    ).toBe(false);
  });
});
