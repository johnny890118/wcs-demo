import { describe, expect, it, vi } from "vitest";
import {
  AuditProjectionService,
  decodeAuditCursor,
} from "../../apps/api/src/audit/audit-projection.service";

const resourceId = "50000000-0000-4000-8000-000000000001";
const warehouseId = "10000000-0000-4000-8000-000000000001";

describe("audit projection", () => {
  it("returns a stable page while omitting raw and free-form details", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "70000000-0000-4000-8000-000000000003",
          correlation_id: "request:recover-001",
          actor_type: "service",
          actor_id: "operations-console",
          action: "transport_task.recover_release",
          aggregate_type: "TransportTask",
          aggregate_id: resourceId,
          details: {
            alarmId: "80000000-0000-4000-8000-000000000001",
            equipmentId: "AMR-01",
            strategy: "release",
            resolution: "free-form internal explanation",
            confirmationReason: "private supervisor note",
            accessToken: "must-never-be-returned",
          },
          occurred_at: new Date("2026-09-20T03:00:00.000Z"),
        },
        {
          id: "70000000-0000-4000-8000-000000000002",
          correlation_id: "request:future-001",
          actor_type: "system",
          actor_id: "reconciler",
          action: "future_action.not_yet_known",
          aggregate_type: "TransportTask",
          aggregate_id: resourceId,
          details: { futurePrivatePayload: "not part of the contract" },
          occurred_at: new Date("2026-09-20T02:00:00.000Z"),
        },
        {
          id: "70000000-0000-4000-8000-000000000001",
          correlation_id: "request:older-001",
          actor_type: "service",
          actor_id: "older-event",
          action: "transport_task.assigned",
          aggregate_type: "TransportTask",
          aggregate_id: resourceId,
          details: {},
          occurred_at: new Date("2026-09-20T01:00:00.000Z"),
        },
      ],
    });
    const service = new AuditProjectionService({ query } as never);

    const page = await service.list(warehouseId, {
      limit: 2,
      resourceType: "TransportTask",
      resourceId,
    });

    expect(page.events).toEqual([
      expect.objectContaining({
        eventId: "70000000-0000-4000-8000-000000000003",
        correlationId: "request:recover-001",
        knownAction: true,
        knownResource: true,
        evidence: {
          alarmId: "80000000-0000-4000-8000-000000000001",
          equipmentId: "AMR-01",
          strategy: "release",
        },
      }),
      expect.objectContaining({
        action: "future_action.not_yet_known",
        knownAction: false,
        evidence: {},
      }),
    ]);
    expect(JSON.stringify(page)).not.toMatch(
      /accessToken|must-never|confirmationReason|private supervisor|resolution/,
    );
    expect(page.nextCursor).not.toBeNull();
    expect(decodeAuditCursor(page.nextCursor!)).toEqual({
      occurredAt: "2026-09-20T02:00:00.000Z",
      eventId: "70000000-0000-4000-8000-000000000002",
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY occurred_at DESC, id DESC"),
      [warehouseId, "TransportTask", resourceId, 3],
    );
  });

  it("uses the opaque cursor tuple and rejects malformed queries", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const service = new AuditProjectionService({ query } as never);
    const cursor = Buffer.from(
      JSON.stringify({
        occurredAt: "2026-09-20T02:00:00.000Z",
        eventId: "70000000-0000-4000-8000-000000000002",
      }),
    ).toString("base64url");

    await expect(
      service.list(warehouseId, { cursor, limit: 25 }),
    ).resolves.toEqual({
      events: [],
      nextCursor: null,
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("(occurred_at, id) < ($2, $3)"),
      [
        warehouseId,
        new Date("2026-09-20T02:00:00.000Z"),
        "70000000-0000-4000-8000-000000000002",
        26,
      ],
    );
    await expect(
      service.list(warehouseId, { cursor: "not-a-cursor" }),
    ).rejects.toMatchObject({
      response: { code: "INVALID_AUDIT_QUERY" },
    });
    await expect(
      service.list(warehouseId, { limit: 101 }),
    ).rejects.toMatchObject({
      response: { code: "INVALID_AUDIT_QUERY" },
    });
  });
});
