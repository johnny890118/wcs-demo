import { describe, expect, it, vi } from "vitest";
import { AccessContextService } from "../../apps/api/src/access-context/access-context.service";
import type { ForwardedUserAccess } from "../../apps/api/src/auth/user-access";

const sourceWarehouseId = "10000000-0000-4000-8000-000000000001";
const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
const access: ForwardedUserAccess = {
  principalKind: "human",
  principal: "test-operator",
  permissions: ["operations.view"],
  warehouseScopes: [sourceWarehouseId, targetWarehouseId],
  currentWarehouseId: sourceWarehouseId,
};

function harness(warehouseRows: { id: string }[]) {
  const query = vi
    .fn()
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ rows: warehouseRows })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({});
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }) };
  return {
    service: new AccessContextService(pool as never),
    query,
    release,
  };
}

describe("warehouse context audit evidence", () => {
  it("atomically records source and destination evidence without cross-scope details", async () => {
    const { service, query, release } = harness([
      { id: sourceWarehouseId },
      { id: targetWarehouseId },
    ]);

    await expect(
      service.changeWarehouse(access, targetWarehouseId),
    ).resolves.toEqual({ currentWarehouseId: targetWarehouseId });
    expect(query.mock.calls[2][0]).toContain("access_context.warehouse_left");
    expect(query.mock.calls[2][0]).toContain(
      "access_context.warehouse_entered",
    );
    expect(query.mock.calls[2][0]).toContain("'{}'::jsonb");
    expect(query.mock.calls[2][1]).toEqual([
      expect.any(String),
      sourceWarehouseId,
      "user",
      "test-operator",
      expect.any(String),
      expect.any(String),
      targetWarehouseId,
    ]);
    expect(query.mock.calls[3][0]).toBe("COMMIT");
    expect(release).toHaveBeenCalled();
  });

  it("rolls back when either configured warehouse is unavailable", async () => {
    const { service, query, release } = harness([{ id: sourceWarehouseId }]);

    await expect(
      service.changeWarehouse(access, targetWarehouseId),
    ).rejects.toMatchObject({ status: 422 });
    expect(query.mock.calls[2][0]).toBe("ROLLBACK");
    expect(release).toHaveBeenCalled();
  });
});
