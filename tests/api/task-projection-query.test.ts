import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { TaskProjectionService } from "../../apps/api/src/operations/task-projection.service";
import { testWarehouseId } from "../fixtures/operational-access";

describe("task projection untrusted query", () => {
  it.each([
    { view: "any" },
    { view: ["all"] },
    { limit: 0 },
    { limit: 101 },
    { limit: "1e2" },
    { cursor: "%" },
    { cursor: Buffer.from("null").toString("base64url") },
    {
      cursor: Buffer.from(
        JSON.stringify({
          warehouseId: "foreign",
          view: "active",
          taskId: "50000000-0000-4000-8000-000000000001",
          createdAt: "2026-10-03T00:00:00.000001Z",
        }),
      ).toString("base64url"),
    },
  ])("rejects invalid queries before SQL: %j", async (query) => {
    const pool = { query: vi.fn() };
    const service = new TaskProjectionService(pool as unknown as Pool);
    await expect(
      service.getQueue(testWarehouseId, query),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("rejects malformed detail identity before SQL", async () => {
    const pool = { query: vi.fn() };
    const service = new TaskProjectionService(pool as unknown as Pool);
    await expect(
      service.getDetail(testWarehouseId, "../other"),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("uses the same not-found result for absent and inaccessible records", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const service = new TaskProjectionService(pool as unknown as Pool);
    await expect(
      service.getDetail(
        testWarehouseId,
        "50000000-0000-4000-8000-000000000001",
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
