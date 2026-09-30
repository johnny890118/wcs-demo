import { describe, expect, it, vi } from "vitest";
import { HumanAccessAssignmentService } from "../../apps/api/src/access-context/human-access-assignment.service";
import { requestContext } from "../../apps/api/src/logging/request-context";

const principalId = "a0000000-0000-4000-8000-000000000001";
const warehouseId = "10000000-0000-4000-8000-000000000001";
const secondWarehouseId = "20000000-0000-4000-8000-000000000010";
const sessionId = "90000000-0000-4000-8000-000000000099";

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

function harness(results: object[]) {
  const query = vi.fn();
  for (const result of results) query.mockResolvedValueOnce(result);
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }) };
  return {
    service: new HumanAccessAssignmentService(pool as never),
    query,
    release,
  };
}

describe("persisted human access sessions", () => {
  it("issues effective access, a bounded session, and login evidence atomically", async () => {
    const permissions = ["operations.view", "audit.view"];
    const expiresAt = new Date("2099-01-01T00:00:00.000Z");
    const { service, query, release } = harness([
      {},
      { rows: [assignment({ permissions })] },
      { rows: [{ expires_at: expiresAt }] },
      {},
      {},
    ]);

    const resolution = await requestContext.run(
      { requestId: "request:login-001" },
      () => service.issue("oidc:customer", "operator-1"),
    );

    expect(resolution).toMatchObject({
      access: {
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
      },
      session: {
        sessionId: expect.any(String),
        expiresAt: expiresAt.toISOString(),
      },
    });
    expect(query.mock.calls[2][0]).toContain("human_access_sessions");
    expect(query.mock.calls[3][0]).toContain("access.login_succeeded");
    expect(query.mock.calls[3][1]).toEqual([
      expect.any(String),
      warehouseId,
      "operator-1",
      resolution.session.sessionId,
      "request:login-001",
    ]);
    expect(query.mock.calls[4][0]).toBe("COMMIT");
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
  ])("fails closed when issuing from %s assignments", async (_label, rows) => {
    const { service, query, release } = harness([{}, { rows }, {}]);

    await expect(
      service.issue("oidc:customer", "operator-1"),
    ).rejects.toMatchObject({ status: 401 });
    expect(query.mock.calls[1][0]).toContain("principal.status = 'active'");
    expect(query.mock.calls[1][0]).toContain("assignment.valid_until > now()");
    expect(query.mock.calls[2][0]).toBe("ROLLBACK");
    expect(release).toHaveBeenCalled();
  });

  it("revalidates a live session against current assignments and context", async () => {
    const expiresAt = new Date("2099-01-01T00:00:00.000Z");
    const { service, query } = harness([
      {},
      { rows: [assignment({ session_expires_at: expiresAt })] },
      {},
      {},
    ]);

    await expect(
      service.validate(sessionId, "oidc:customer", "operator-1", warehouseId),
    ).resolves.toMatchObject({
      access: { currentWarehouseId: warehouseId },
      session: { sessionId, expiresAt: expiresAt.toISOString() },
    });
    expect(query.mock.calls[1][0]).toContain("session.revoked_at IS NULL");
    expect(query.mock.calls[1][0]).toContain("session.expires_at > now()");
    expect(query.mock.calls[2][0]).toContain("current_warehouse_id = $2");
    expect(query.mock.calls[3][0]).toBe("COMMIT");
  });

  it("revokes a session idempotently and records attributable evidence", async () => {
    const { service, query } = harness([
      {},
      {
        rows: [
          {
            subject: "operator-1",
            current_warehouse_id: warehouseId,
            revoked_at: null,
          },
        ],
      },
      {},
      {},
      {},
    ]);

    await expect(
      requestContext.run({ requestId: "request:logout-001" }, () =>
        service.revoke(sessionId, "sign_out", "test-bff"),
      ),
    ).resolves.toEqual({ revoked: true });
    expect(query.mock.calls[3][0]).toContain("INSERT INTO audit_events");
    expect(query.mock.calls[3][1]).toEqual([
      expect.any(String),
      warehouseId,
      "user",
      "operator-1",
      "access.logout",
      sessionId,
      "request:logout-001",
    ]);
  });
});
