import { randomUUID } from "node:crypto";
import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Pool } from "pg";
import { interactiveAuditActorType } from "../../../../src/application/audit/audit-actor";
import { DATABASE_POOL } from "../database/database.module";
import { auditCorrelationId } from "../logging/request-context";
import type { ForwardedUserAccess } from "../auth/user-access";

@Injectable()
export class AccessContextService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async changeWarehouse(
    access: ForwardedUserAccess,
    targetWarehouseId: string,
  ): Promise<{ currentWarehouseId: string }> {
    const client = await this.pool.connect();
    const sourceEventId = randomUUID();
    const targetEventId = randomUUID();
    const correlationId = auditCorrelationId(sourceEventId);
    try {
      await client.query("BEGIN");
      const warehouses = await client.query<{ id: string }>(
        `SELECT id FROM warehouses WHERE id = ANY($1::uuid[])`,
        [[access.currentWarehouseId, targetWarehouseId]],
      );
      if (warehouses.rows.length !== 2) {
        throw new UnprocessableEntityException({
          code: "WAREHOUSE_CONTEXT_UNAVAILABLE",
          message: "The selected warehouse context is not available.",
        });
      }
      const actorType = interactiveAuditActorType(access.principalKind);
      await client.query(
        `INSERT INTO audit_events
          (id, warehouse_id, actor_type, actor_id, action, aggregate_type, aggregate_id, details, correlation_id)
         VALUES
          ($1, $2, $3, $4, 'access_context.warehouse_left', 'Warehouse', $2, '{}'::jsonb, $5),
          ($6, $7, $3, $4, 'access_context.warehouse_entered', 'Warehouse', $7, '{}'::jsonb, $5)`,
        [
          sourceEventId,
          access.currentWarehouseId,
          actorType,
          access.principal,
          correlationId,
          targetEventId,
          targetWarehouseId,
        ],
      );
      await client.query("COMMIT");
      return { currentWarehouseId: targetWarehouseId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
