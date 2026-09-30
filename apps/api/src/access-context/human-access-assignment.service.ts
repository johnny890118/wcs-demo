import { randomUUID } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import {
  loadHumanSessionTtlSeconds,
  type HumanSessionReference,
} from "../../../../src/application/access/human-session";
import {
  isOperationalAccess,
  isUserPermission,
  type OperationalAccess,
  type UserPermission,
} from "../../../../src/application/access/operational-access";
import { DATABASE_POOL } from "../database/database.module";
import { auditCorrelationId } from "../logging/request-context";

type AssignmentRow = Readonly<{
  principal_id: string;
  subject: string;
  display_name: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  permissions: string[];
  is_default: boolean;
  session_expires_at?: Date;
}>;

type SessionOwnerRow = Readonly<{
  subject: string;
  current_warehouse_id: string;
  revoked_at: Date | null;
}>;

export type HumanSessionResolution = Readonly<{
  access: OperationalAccess;
  session: HumanSessionReference;
}>;

export type HumanSessionRevocationReason = "sign_out" | "administrative";

@Injectable()
export class HumanAccessAssignmentService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async issue(
    identityProvider: string,
    subject: string,
  ): Promise<HumanSessionResolution> {
    const client = await this.pool.connect();
    const sessionId = randomUUID();
    const auditId = randomUUID();
    try {
      await client.query("BEGIN");
      const rows = await this.loadAssignments(
        client,
        identityProvider,
        subject,
      );
      const access = accessFromRows(rows, identityProvider);
      const issued = await client.query<{ expires_at: Date }>(
        `INSERT INTO human_access_sessions
          (id, principal_id, current_warehouse_id, expires_at)
         VALUES ($1, $2, $3, now() + make_interval(secs => $4))
         RETURNING expires_at`,
        [
          sessionId,
          rows[0].principal_id,
          access.currentWarehouseId,
          loadHumanSessionTtlSeconds(),
        ],
      );
      const expiresAt = issued.rows[0]?.expires_at;
      if (!(expiresAt instanceof Date)) throw unavailable();
      await client.query(
        `INSERT INTO audit_events
          (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES ($1, $2, 'user', $3, 'access.login_succeeded', 'Session', $4, '{}'::jsonb, $5)`,
        [
          auditId,
          access.currentWarehouseId,
          access.principal.subject,
          sessionId,
          auditCorrelationId(auditId),
        ],
      );
      await client.query("COMMIT");
      return {
        access,
        session: { sessionId, expiresAt: expiresAt.toISOString() },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async validate(
    sessionId: string,
    identityProvider: string,
    subject: string,
    currentWarehouseId: string,
  ): Promise<HumanSessionResolution> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<AssignmentRow>(
        `SELECT principal.id AS principal_id, principal.subject,
          principal.display_name, warehouse.id AS warehouse_id,
          warehouse.code AS warehouse_code, warehouse.name AS warehouse_name,
          assignment.permissions, assignment.is_default,
          session.expires_at AS session_expires_at
         FROM human_access_sessions session
         JOIN access_principals principal ON principal.id = session.principal_id
         JOIN warehouse_access_assignments assignment
           ON assignment.principal_id = principal.id
         JOIN warehouses warehouse ON warehouse.id = assignment.warehouse_id
         WHERE session.id = $1
           AND principal.identity_provider = $2
           AND principal.subject = $3
           AND principal.status = 'active'
           AND session.revoked_at IS NULL
           AND session.expires_at > now()
           AND assignment.status = 'active'
           AND assignment.valid_from <= now()
           AND (assignment.valid_until IS NULL OR assignment.valid_until > now())
         ORDER BY warehouse.code, warehouse.id
         FOR SHARE OF session, principal, assignment, warehouse`,
        [sessionId, identityProvider, subject],
      );
      const access = accessFromRows(
        result.rows,
        identityProvider,
        currentWarehouseId,
      );
      const expiresAt = result.rows[0]?.session_expires_at;
      if (!(expiresAt instanceof Date)) throw unavailable();
      await client.query(
        `UPDATE human_access_sessions
         SET current_warehouse_id = $2
         WHERE id = $1 AND current_warehouse_id <> $2`,
        [sessionId, currentWarehouseId],
      );
      await client.query("COMMIT");
      return {
        access,
        session: { sessionId, expiresAt: expiresAt.toISOString() },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async revoke(
    sessionId: string,
    reason: HumanSessionRevocationReason,
    serviceActor: string,
  ): Promise<{ revoked: boolean }> {
    const client = await this.pool.connect();
    const auditId = randomUUID();
    try {
      await client.query("BEGIN");
      const result = await client.query<SessionOwnerRow>(
        `SELECT principal.subject, session.current_warehouse_id,
          session.revoked_at
         FROM human_access_sessions session
         JOIN access_principals principal ON principal.id = session.principal_id
         WHERE session.id = $1
         FOR UPDATE OF session`,
        [sessionId],
      );
      const owner = result.rows[0];
      if (!owner) throw unavailable();
      if (owner.revoked_at) {
        await client.query("COMMIT");
        return { revoked: false };
      }
      await client.query(
        `UPDATE human_access_sessions
         SET revoked_at = now(), revocation_reason = $2
         WHERE id = $1`,
        [sessionId, reason],
      );
      await client.query(
        `INSERT INTO audit_events
          (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES ($1, $2, $3, $4, $5, 'Session', $6, '{}'::jsonb, $7)`,
        [
          auditId,
          owner.current_warehouse_id,
          reason === "sign_out" ? "user" : "service",
          reason === "sign_out" ? owner.subject : serviceActor,
          reason === "sign_out" ? "access.logout" : "access.session_revoked",
          sessionId,
          auditCorrelationId(auditId),
        ],
      );
      await client.query("COMMIT");
      return { revoked: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadAssignments(
    client: PoolClient,
    identityProvider: string,
    subject: string,
  ): Promise<AssignmentRow[]> {
    const result = await client.query<AssignmentRow>(
      `SELECT principal.id AS principal_id, principal.subject,
        principal.display_name, warehouse.id AS warehouse_id,
        warehouse.code AS warehouse_code, warehouse.name AS warehouse_name,
        assignment.permissions, assignment.is_default
       FROM access_principals principal
       JOIN warehouse_access_assignments assignment
         ON assignment.principal_id = principal.id
       JOIN warehouses warehouse ON warehouse.id = assignment.warehouse_id
       WHERE principal.identity_provider = $1
         AND principal.subject = $2
         AND principal.status = 'active'
         AND assignment.status = 'active'
         AND assignment.valid_from <= now()
         AND (assignment.valid_until IS NULL OR assignment.valid_until > now())
       ORDER BY warehouse.code, warehouse.id
       FOR SHARE OF principal, assignment, warehouse`,
      [identityProvider, subject],
    );
    return result.rows;
  }
}

function accessFromRows(
  rows: AssignmentRow[],
  identityProvider: string,
  requestedWarehouseId?: string,
): OperationalAccess {
  const defaults = rows.filter((row) => row.is_default);
  const defaultAssignment =
    rows.length === 1
      ? rows[0]
      : defaults.length === 1
        ? defaults[0]
        : undefined;
  const current = requestedWarehouseId
    ? rows.find((row) => row.warehouse_id === requestedWarehouseId)
    : defaultAssignment;
  if (
    !defaultAssignment ||
    !current ||
    rows.some((row) => !validPermissions(row.permissions))
  ) {
    throw unavailable();
  }
  const access: OperationalAccess = {
    principal: {
      kind: "human",
      subject: current.subject,
      displayName: current.display_name,
      identityProvider,
      permissions: current.permissions as UserPermission[],
      warehouseScopes: rows.map((row) => ({
        warehouseId: row.warehouse_id,
        code: row.warehouse_code,
        name: row.warehouse_name,
        permissions: row.permissions as UserPermission[],
      })),
    },
    currentWarehouseId: current.warehouse_id,
  };
  if (!isOperationalAccess(access)) throw unavailable();
  return access;
}

function validPermissions(permissions: string[]): boolean {
  return (
    permissions.length > 0 &&
    new Set(permissions).size === permissions.length &&
    permissions.every(isUserPermission)
  );
}

function unavailable(): UnauthorizedException {
  return new UnauthorizedException({
    code: "ACCESS_SESSION_UNAVAILABLE",
    message: "No valid operational access session is available.",
  });
}
