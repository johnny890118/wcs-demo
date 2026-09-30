import { describe, expect, it, vi } from "vitest";
import { HumanAccessAssignmentService } from "../../apps/api/src/access-context/human-access-assignment.service";
import { requestContext } from "../../apps/api/src/logging/request-context";

const principalId = "a0000000-0000-4000-8000-000000000001";
const warehouseId = "10000000-0000-4000-8000-000000000001";
const secondWarehouseId = "20000000-0000-4000-8000-000000000010";

function assignment(overrides: Record<string, unknown> = {}) {
  return {
    principal_id: principalId,
    subject: "operator-1",
    display_name: "Operator One",
    warehouse_id: warehouseId,
    warehouse_code: "WH-1",
    warehouse_name: "Warehouse One",
    permissions: ["operations.view", "audit.view"],
    is_default: true,
    ...overrides,
  };
}

function harness(rows: object[]) {
  const query = vi
    .fn()
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ rows })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({});
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }) };
  return {
    service: new HumanAccessAssignmentService(pool as never),
    query,
    release,
  };
}

describe("persisted human access assignments", () => {
  it("derives effective access and records successful login evidence atomically", async () => {
    const permissions = ["operations.view", "audit.view"];
    const { service, query, release } = harness([assignment({ permissions })]);

    await expect(
      requestContext.run({ requestId: "request:login-001" }, () =>
        service.resolve("oidc:customer", "operator-1"),
      ),
    ).resolves.toEqual({
      principal: {
        kind: "human",
        subject: "operator-1",
        displayName: "Operator One",
        identityProvider: "oidc:customer",
        permissions,
        warehouseScopes: [
          {
            warehouseId,
            code: "WH-1",
            name: "Warehouse One",
            permissions,
          },
        ],
      },
      currentWarehouseId: warehouseId,
    });
    expect(query.mock.calls[2][0]).toContain("access.login_succeeded");
    expect(query.mock.calls[2][1]).toEqual([
      expect.any(String),
      warehouseId,
      "operator-1",
      principalId,
      "request:login-001",
    ]);
    expect(query.mock.calls[3][0]).toBe("COMMIT");
    expect(release).toHaveBeenCalled();
  });

  it.each([
    ["missing", []],
    ["unknown permission", [assignment({ permissions: ["admin.all"] })]],
    [
      "ambiguous defaults",
      [
        assignment(),
        assignment({
          warehouse_id: secondWarehouseId,
          warehouse_code: "WH-2",
          warehouse_name: "Warehouse Two",
        }),
      ],
    ],
    [
      "missing default",
      [
        assignment({ is_default: false }),
        assignment({
          warehouse_id: secondWarehouseId,
          warehouse_code: "WH-2",
          warehouse_name: "Warehouse Two",
          is_default: false,
        }),
      ],
    ],
  ])("fails closed for %s assignments", async (_label, rows) => {
    const { service, query, release } = harness(rows);

    await expect(
      service.resolve("oidc:customer", "operator-1"),
    ).rejects.toMatchObject({ status: 401 });
    expect(query.mock.calls[1][0]).toContain("principal.status = 'active'");
    expect(query.mock.calls[1][0]).toContain("assignment.valid_until > now()");
    expect(query.mock.calls[2][0]).toBe("ROLLBACK");
    expect(release).toHaveBeenCalled();
  });
});
