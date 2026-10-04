import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { WorkProjectionService } from "../../apps/api/src/operations/work-projection.service";
import { isWorkDetail } from "../../src/application/operations/work-projection";
import { testWarehouseId } from "../fixtures/operational-access";
const id = "30000000-0000-4000-8000-000000000001";
describe("Work projection snapshot and untrusted query", () => {
  it.each([
    { limit: 0 },
    { limit: 101 },
    { limit: "1e2" },
    { cursor: "%" },
    { cursor: ["ambiguous"] },
    { cursor: Buffer.from("null").toString("base64url") },
    {
      cursor: Buffer.from(JSON.stringify({ warehouseId: "foreign" })).toString(
        "base64url",
      ),
    },
  ])("rejects invalid %j before acquisition", async (query) => {
    const pool = { connect: vi.fn() };
    await expect(
      new WorkProjectionService(pool as unknown as Pool).getDetail(
        testWarehouseId,
        "inbound",
        id,
        query,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.connect).not.toHaveBeenCalled();
  });
  it.each(["missing", "query-failure"])(
    "rolls back/releases on %s",
    async (state) => {
      const client = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
        release: vi.fn(),
      };
      if (state === "query-failure")
        client.query
          .mockResolvedValueOnce({ rows: [] })
          .mockRejectedValueOnce(new Error("database failure"));
      const pool = { connect: vi.fn().mockResolvedValue(client) };
      await expect(
        new WorkProjectionService(pool as unknown as Pool).getDetail(
          testWarehouseId,
          "inbound",
          id,
        ),
      ).rejects.toBeDefined();
      expect(client.query).toHaveBeenNthCalledWith(
        1,
        "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
      );
      expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
      expect(client.release).toHaveBeenCalledOnce();
    },
  );
  it("commits a single-client empty snapshot without inventing completion", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    client.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
      rows: [
        {
          id,
          external_reference: "ASN-READ",
          status: "requested",
          created_at: new Date(),
          updated_at: new Date(),
          referenced: 0,
          destination: null,
        },
      ],
    });
    const pool = { connect: vi.fn().mockResolvedValue(client), query: vi.fn() };
    const result = await new WorkProjectionService(
      pool as unknown as Pool,
    ).getDetail(testWarehouseId, "inbound", id);
    expect(result.work.status).toBe("requested");
    expect(result.execution.qualifiedTaskCount).toBe(0);
    expect(isWorkDetail(result)).toBe(true);
    expect(
      isWorkDetail({
        ...result,
        execution: { ...result.execution, qualifiedTaskCount: 1 },
      }),
    ).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenLastCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalledOnce();
  });
});
