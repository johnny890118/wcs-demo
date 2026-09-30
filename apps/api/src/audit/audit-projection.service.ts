import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  AuditActorType,
  AuditEventPage,
  AuditEventQuery,
  AuditEvidenceValue,
} from "../../../../src/application/audit/audit-projection";
import {
  isKnownAuditAction,
  isKnownAuditResource,
  type AuditAction,
} from "../../../../src/application/audit/audit-vocabulary";
import { DATABASE_POOL } from "../database/database.module";

type AuditRow = {
  id: string;
  correlation_id: string;
  actor_type: AuditActorType;
  actor_id: string;
  action: string;
  aggregate_type: string;
  aggregate_id: string;
  details: unknown;
  occurred_at: Date;
};

type AuditCursor = { occurredAt: string; eventId: string };

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESOURCE_TYPE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const CORRELATION_ID = /^[A-Za-z0-9._:-]{8,200}$/;
const evidenceKeys: Record<AuditAction, ReadonlySet<string>> = {
  "access.login_succeeded": new Set([]),
  "access.logout": new Set([]),
  "access.session_revoked": new Set([]),
  "access_context.warehouse_entered": new Set([]),
  "access_context.warehouse_left": new Set([]),
  "alarm.acknowledge": new Set(["taskId", "equipmentId"]),
  "inbound_receipt.create": new Set(["transportTaskId"]),
  "outbound_order.allocate": new Set([
    "outboundOrderId",
    "quantity",
    "allocationIds",
    "transportTaskIds",
  ]),
  "transport_task.assigned": new Set(["equipmentId", "status"]),
  "transport_task.block_for_fault": new Set([
    "alarmId",
    "equipmentId",
    "faultCode",
    "severity",
  ]),
  "transport_task.complete": new Set([
    "allocationId",
    "destinationLocationId",
    "inventoryUnitId",
    "loadId",
    "outboundOrderId",
    "quantity",
    "receiptId",
  ]),
  "transport_task.in_progress": new Set(["equipmentId", "status"]),
  "transport_task.mark_unknown": new Set([]),
  "transport_task.recover_release": new Set([
    "alarmId",
    "equipmentId",
    "strategy",
  ]),
  "transport_task.recover_resume": new Set([
    "alarmId",
    "equipmentId",
    "strategy",
  ]),
};

function badQuery(message: string): never {
  throw new BadRequestException({ code: "INVALID_AUDIT_QUERY", message });
}

export function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAuditCursor(value: string): AuditCursor {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<AuditCursor>;
    if (
      typeof decoded.occurredAt !== "string" ||
      Number.isNaN(Date.parse(decoded.occurredAt)) ||
      typeof decoded.eventId !== "string" ||
      !UUID.test(decoded.eventId)
    ) {
      return badQuery("The audit cursor is invalid.");
    }
    return { occurredAt: decoded.occurredAt, eventId: decoded.eventId };
  } catch {
    return badQuery("The audit cursor is invalid.");
  }
}

function redactEvidence(
  action: string,
  details: unknown,
): Record<string, AuditEvidenceValue> {
  if (
    !isKnownAuditAction(action) ||
    !details ||
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    return {};
  }
  const allowed = evidenceKeys[action];
  return Object.fromEntries(
    Object.entries(details).filter(([key, value]) => {
      if (!allowed.has(key)) return false;
      if (["string", "number", "boolean"].includes(typeof value)) return true;
      return (
        Array.isArray(value) &&
        value.length <= 100 &&
        value.every((item) => typeof item === "string")
      );
    }),
  ) as Record<string, AuditEvidenceValue>;
}

@Injectable()
export class AuditProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(
    warehouseId: string,
    query: AuditEventQuery,
  ): Promise<AuditEventPage> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      badQuery(`limit must be an integer from 1 to ${MAX_LIMIT}.`);
    }
    if (query.resourceType && !RESOURCE_TYPE.test(query.resourceType)) {
      badQuery("resourceType is invalid.");
    }
    if (query.resourceId && !UUID.test(query.resourceId)) {
      badQuery("resourceId must be a UUID.");
    }
    if (query.correlationId && !CORRELATION_ID.test(query.correlationId)) {
      badQuery("correlationId is invalid.");
    }

    const parameters: unknown[] = [warehouseId];
    const conditions: string[] = ["warehouse_id = $1"];
    if (query.cursor) {
      const cursor = decodeAuditCursor(query.cursor);
      parameters.push(new Date(cursor.occurredAt), cursor.eventId);
      conditions.push(
        `(occurred_at, id) < ($${parameters.length - 1}, $${
          parameters.length
        })`,
      );
    }
    if (query.resourceType) {
      parameters.push(query.resourceType);
      conditions.push(`aggregate_type = $${parameters.length}`);
    }
    if (query.resourceId) {
      parameters.push(query.resourceId);
      conditions.push(`aggregate_id = $${parameters.length}`);
    }
    if (query.correlationId) {
      parameters.push(query.correlationId);
      conditions.push(`correlation_id = $${parameters.length}`);
    }
    parameters.push(limit + 1);

    const result = await this.pool.query<AuditRow>(
      `SELECT id, correlation_id, actor_type, actor_id, action, aggregate_type, aggregate_id,
        details, occurred_at
       FROM audit_events
       ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
       ORDER BY occurred_at DESC, id DESC
       LIMIT $${parameters.length}`,
      parameters,
    );
    const hasMore = result.rows.length > limit;
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);

    return {
      events: rows.map((row) => ({
        eventId: row.id,
        correlationId: row.correlation_id,
        occurredAt: row.occurred_at.toISOString(),
        actor: { type: row.actor_type, id: row.actor_id },
        action: row.action,
        knownAction: isKnownAuditAction(row.action),
        resource: { type: row.aggregate_type, id: row.aggregate_id },
        knownResource: isKnownAuditResource(row.aggregate_type),
        evidence: redactEvidence(row.action, row.details),
      })),
      nextCursor:
        hasMore && last
          ? encodeAuditCursor({
              occurredAt: last.occurred_at.toISOString(),
              eventId: last.id,
            })
          : null,
    };
  }
}
