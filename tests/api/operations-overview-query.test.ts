import type { Pool } from "pg";
import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { OperationsSummaryService } from "../../apps/api/src/operations/operations-summary.service";
import { isOperationsOverview } from "../../src/application/operations/operations-overview";
import { testWarehouseId } from "../fixtures/operational-access";
describe("overview read budget and partial evidence", () => {
  it("does not merge location bindings from a concurrently replaced topology revision", async () => {
    const pool = {
      query: vi.fn().mockImplementation(async (sql: string) => ({
        rows: sql.includes("FROM locations location")
          ? [
              {
                id: "location",
                code: "Storage",
                kind: "storage",
                status: "available",
                capabilities: [],
                active_node_id: "same-node",
                active_topology_id: "topology",
                active_topology_revision: 1,
              },
            ]
          : sql.includes("FROM warehouse_topologies")
            ? [{ id: "topology", revision: 2 }]
            : sql.includes("FROM topology_nodes")
              ? [
                  {
                    node_id: "same-node",
                    kind: "storage",
                    capabilities: [],
                    position: null,
                  },
                ]
              : [],
      })),
    };
    const live = await new OperationsSummaryService(
      pool as unknown as Pool,
    ).getLiveView(testWarehouseId);
    expect(live.locations[0].activeNodeId).toBeNull();
  });
  it("live view prioritizes active work and skips inventory without skipping versioned topology", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const live = await new OperationsSummaryService(
      pool as unknown as Pool,
    ).getLiveView(testWarehouseId);
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(
      pool.query.mock.calls.some(([sql]) =>
        sql.includes("FROM inventory_units"),
      ),
    ).toBe(false);
    expect(
      pool.query.mock.calls.find(([sql]) =>
        sql.includes("FROM transport_tasks t"),
      )?.[1],
    ).toEqual([testWarehouseId, true, null, null]);
    expect(
      pool.query.mock.calls.some(([sql]) =>
        sql.includes("FROM warehouse_topologies"),
      ),
    ).toBe(true);
    expect(live.work).toEqual([]);
  });
  it("reads only four Home collections and no unused topology", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const home = await new OperationsSummaryService(
      pool as unknown as Pool,
    ).getHome(testWarehouseId);
    expect(pool.query).toHaveBeenCalledTimes(4);
    for (const [sql, params] of pool.query.mock.calls) {
      expect(sql).not.toMatch(
        /FROM (warehouse_topologies|topology_nodes|topology_edges|locations location)/,
      );
      expect(params[0]).toBe(testWarehouseId);
    }
    expect(home).toMatchObject({
      attention: [],
      work: [],
      coverage: { tasksMayBeLimited: false },
    });
  });
  it("does not skip topology for full warehouse details", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    await new OperationsSummaryService(pool as unknown as Pool).getDetails(
      testWarehouseId,
    );
    expect(pool.query).toHaveBeenCalledTimes(6);
    expect(
      pool.query.mock.calls.some(([sql]) =>
        sql.includes("FROM warehouse_topologies"),
      ),
    ).toBe(true);
  });
  it("keeps partial failures independent and sanitizes diagnostic errors", async () => {
    const warning = vi
      .spyOn(Logger.prototype, "warn")
      .mockImplementation(() => {});
    const service = new OperationsSummaryService({} as Pool);
    const summary = {
      counts: {
        activeTasks: 0,
        storedInventory: 0,
        openReceipts: 0,
        configuredEquipment: 0,
      },
      topology: null,
      recentTasks: [],
      generatedAt: new Date().toISOString(),
    };
    vi.spyOn(service, "getHome").mockRejectedValue(
      new Error("private diagnostic"),
    );
    vi.spyOn(service, "getSummary").mockResolvedValue(summary);
    expect(await service.getOverview(testWarehouseId)).toEqual({
      home: null,
      summary,
    });
    expect(
      isOperationsOverview(await service.getOverview(testWarehouseId)),
    ).toBe(true);
    expect(service.getHome).toHaveBeenCalledWith(testWarehouseId);
    expect(service.getSummary).toHaveBeenCalledWith(testWarehouseId);
    expect(warning).toHaveBeenCalledWith({
      event: "operations.overview.partial",
      homeAvailable: false,
      summaryAvailable: true,
    });
    expect(JSON.stringify(warning.mock.calls)).not.toContain(
      "private diagnostic",
    );
    warning.mockRestore();
  });
  it.each([
    undefined,
    {},
    { home: {}, summary: null },
    { home: null, summary: {} },
    { home: [], summary: null },
  ])("rejects malformed combined payload %j", (value) =>
    expect(isOperationsOverview(value)).toBe(false),
  );
});
