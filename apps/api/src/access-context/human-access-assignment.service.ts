import { randomUUID } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Pool } from "pg";
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
}>;

@Injectable()
export class HumanAccessAssignmentService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async resolve(
    identityProvider: string,
    subject: string,
  ): Promise<OperationalAccess> {
    const client = await this.pool.connect();
    const auditId = randomUUID();
    try {
      await client.query("BEGIN");
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
      const rows = result.rows;
      const defaults = rows.filter((row) => row.is_default);
      const current =
        rows.length === 1
          ? rows[0]
          : defaults.length === 1
            ? defaults[0]
            : undefined;
      if (!current || rows.some((row) => !validPermissions(row.permissions))) {
        throw new UnauthorizedException({
          code: "ACCESS_ASSIGNMENT_UNAVAILABLE",
          message: "No valid operational access assignment is available.",
        });
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
      if (!isOperationalAccess(access)) {
        throw new UnauthorizedException({
          code: "ACCESS_ASSIGNMENT_INVALID",
          message: "The persisted operational access assignment is invalid.",
        });
      }
      await client.query(
        `INSERT INTO audit_events
          (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES ($1, $2, 'user', $3, 'access.login_succeeded', 'Principal', $4, '{}'::jsonb, $5)`,
        [
          auditId,
          current.warehouse_id,
          current.subject,
          current.principal_id,
          auditCorrelationId(auditId),
        ],
      );
      await client.query("COMMIT");
      return access;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function validPermissions(permissions: string[]): boolean {
  return (
    permissions.length > 0 &&
    new Set(permissions).size === permissions.length &&
    permissions.every(isUserPermission)
  );
}
