import type { Pool } from "pg";
import { expect, it, vi } from "vitest";
import { WorkQueueService } from "../../apps/api/src/operations/work-queue.service";
import {
  isWorkQueuePage,
  parseWorkQueueQuery,
} from "../../src/application/operations/work-queue";
import { testWarehouseId } from "../fixtures/operational-access";
it.each([
  { view: "unknown" },
  { view: ["all"] },
  { limit: "1e2" },
  { limit: 0 },
  { limit: 101 },
  { cursor: "%" },
  { cursor: ["one"] },
  { warehouseId: "foreign" },
  { cursor: Buffer.from("null").toString("base64url") },
])("rejects Work queue query %j before SQL", async (query) => {
  const pool = { query: vi.fn() };
  await expect(
    new WorkQueueService(pool as unknown as Pool).getQueue(
      testWarehouseId,
      query,
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(pool.query).not.toHaveBeenCalled();
});
it("uses one scoped statement and preserves same-reference roots without task-page deduplication", async () => {
  const row = {
    id: "30000000-0000-4000-8000-000000000001",
    flow: "inbound",
    external_reference: "SAME-REFERENCE",
    status: "requested",
    created_at: "2026-10-05T00:00:00.123456Z",
    updated_at: new Date(),
    referenced: 3,
    counts: { queued: 1, completed: 1 },
  };
  const pool = {
    query: vi.fn().mockResolvedValue({
      rows: [row, { ...row, flow: "outbound", status: "allocated" }],
    }),
  };
  const page = await new WorkQueueService(pool as unknown as Pool).getQueue(
    testWarehouseId,
    { limit: 1 },
  );
  expect(isWorkQueuePage(page)).toBe(true);
  expect(page.works[0]?.execution).toMatchObject({
    referencedTaskCount: 3,
    qualifiedTaskCount: 2,
  });
  expect(pool.query).toHaveBeenCalledOnce();
  expect(pool.query.mock.calls[0]?.[1]).toEqual([
    testWarehouseId,
    "active",
    null,
    null,
    null,
    2,
  ]);
  expect(page.nextCursor).not.toBeNull();
  const cursor = JSON.parse(
    Buffer.from(page.nextCursor!, "base64url").toString(),
  );
  expect(cursor).toMatchObject({
    warehouseId: testWarehouseId,
    view: "active",
    flow: "inbound",
    createdAt: row.created_at,
  });
  for (const change of [
    { warehouseId: "foreign" },
    { view: "all" },
    { createdAt: "2026-02-30T00:00:00.000000Z" },
  ]) {
    pool.query.mockClear();
    await expect(
      new WorkQueueService(pool as unknown as Pool).getQueue(testWarehouseId, {
        cursor: Buffer.from(JSON.stringify({ ...cursor, ...change })).toString(
          "base64url",
        ),
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  }
  expect(
    isWorkQueuePage({
      ...page,
      works: [
        {
          ...page.works[0],
          execution: { ...page.works[0]!.execution, qualifiedTaskCount: 4 },
        },
      ],
    }),
  ).toBe(false);
});
it("parses only scalar owned queue selection, not warehouse or permission input", () => {
  expect(parseWorkQueueQuery({})).toEqual({ view: "active" });
  expect(parseWorkQueueQuery({ view: "all", limit: "100" })).toEqual({
    view: "all",
    limit: 100,
  });
  for (const q of [
    { warehouse: "other" },
    { view: ["all"] },
    { limit: "1e2" },
    { limit: "101" },
    { cursor: "%" },
  ])
    expect(parseWorkQueueQuery(q)).toBeNull();
});
