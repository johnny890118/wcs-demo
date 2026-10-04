import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Pool } from "pg";
import type {
  TaskDetail,
  TaskQueueItem,
  TaskQueuePage,
} from "../../../../src/application/operations/task-projection";
import { DATABASE_POOL } from "../database/database.module";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type TaskReadRow = {
  id: string;
  status: TaskQueueItem["status"];
  source: string;
  destination: string;
  equipment_id: string | null;
  flow: "inbound" | "outbound";
  external_reference: string;
  sku: string;
  quantity: number;
  created_at: string;
  updated_at: Date;
  origin_id: string;
  external_load_id: string;
  load_status: string;
  load_location: string;
};
export const taskReadSelect = `SELECT task.id, task.status, source.code AS source, destination.code AS destination,
  descriptor.equipment_id, CASE WHEN task.receipt_id IS NOT NULL THEN 'inbound' ELSE 'outbound' END AS flow,
  COALESCE(receipt.external_reference, orders.external_reference) AS external_reference,
  COALESCE(orders.sku, load.sku) AS sku, COALESCE(allocation.quantity, load.quantity) AS quantity,
  to_char(task.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at,
  task.updated_at, COALESCE(task.receipt_id, task.outbound_order_id) AS origin_id,
  load.external_id AS external_load_id, load.status AS load_status, load_location.code AS load_location
  FROM transport_tasks task
  JOIN locations source ON source.id = task.source_location_id AND source.warehouse_id = $1
  JOIN locations destination ON destination.id = task.destination_location_id AND destination.warehouse_id = $1
  LEFT JOIN equipment_descriptors descriptor ON descriptor.equipment_id = task.equipment_id AND descriptor.warehouse_id = $1
  LEFT JOIN inbound_receipts receipt ON receipt.id = task.receipt_id
  LEFT JOIN inventory_allocations allocation ON allocation.id = task.inventory_allocation_id
  LEFT JOIN inventory_units inventory ON inventory.id = allocation.inventory_unit_id
  LEFT JOIN locations inventory_location ON inventory_location.id = inventory.location_id AND inventory_location.warehouse_id = $1
  LEFT JOIN outbound_orders orders ON orders.id = task.outbound_order_id AND orders.destination_location_id = destination.id
  JOIN loads load ON load.id = COALESCE(task.load_id, inventory.load_id)
  JOIN locations load_location ON load_location.id = load.current_location_id AND load_location.warehouse_id = $1
  WHERE (task.equipment_id IS NULL OR descriptor.equipment_id IS NOT NULL)
    AND ((receipt.id IS NOT NULL AND receipt.warehouse_id = $1 AND load.receipt_id = receipt.id)
      OR (task.receipt_id IS NULL AND orders.id IS NOT NULL AND orders.warehouse_id = $1 AND inventory_location.id IS NOT NULL AND allocation.outbound_order_id = orders.id AND allocation.source_location_id = task.source_location_id))
    AND EXISTS (SELECT 1 FROM inbound_receipts load_receipt WHERE load_receipt.id = load.receipt_id AND load_receipt.warehouse_id = $1)`;

export function taskReadItem(row: TaskReadRow): TaskQueueItem {
  return {
    taskId: row.id,
    status: row.status,
    source: row.source,
    destination: row.destination,
    equipmentId: row.equipment_id,
    flow: row.flow,
    externalReference: row.external_reference,
    sku: row.sku,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at.toISOString(),
  };
}
const select = taskReadSelect;
const item = taskReadItem;
type Row = TaskReadRow;
function invalid(): never {
  throw new BadRequestException({
    code: "INVALID_TASK_QUERY",
    message: "Invalid task query.",
  });
}

@Injectable()
export class TaskProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getQueue(
    warehouseId: string,
    query: { view?: unknown; cursor?: unknown; limit?: unknown } = {},
  ): Promise<TaskQueuePage> {
    const view = query.view ?? "active";
    const limit =
      query.limit === undefined
        ? 50
        : typeof query.limit === "string" && /^\d+$/.test(query.limit)
          ? Number(query.limit)
          : query.limit;
    if (
      !["active", "all"].includes(view as string) ||
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      invalid();
    let cursor: { createdAt: string; taskId: string } | null = null;
    if (query.cursor !== undefined) {
      if (
        typeof query.cursor !== "string" ||
        query.cursor.length > 600 ||
        !/^[A-Za-z0-9_-]+$/.test(query.cursor)
      )
        invalid();
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, "base64url").toString("utf8"),
        );
        if (
          decoded.warehouseId !== warehouseId ||
          decoded.view !== view ||
          typeof decoded.createdAt !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(
            decoded.createdAt,
          ) ||
          Number.isNaN(Date.parse(decoded.createdAt)) ||
          new Date(decoded.createdAt).toISOString().slice(0, 23) !==
            decoded.createdAt.slice(0, 23) ||
          typeof decoded.taskId !== "string" ||
          !uuid.test(decoded.taskId)
        )
          invalid();
        cursor = decoded;
      } catch {
        invalid();
      }
    }
    const result = await this.pool.query<Row>(
      `${select}
      AND ($2::text = 'all' OR task.status IN ('queued','assigned','in_progress','blocked','unknown'))
      AND ($3::timestamptz IS NULL OR (task.created_at, task.id) < ($3::timestamptz, $4::uuid))
      ORDER BY task.created_at DESC, task.id DESC LIMIT $5`,
      [
        warehouseId,
        view,
        cursor?.createdAt ?? null,
        cursor?.taskId ?? null,
        limit + 1,
      ],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      tasks: rows.map(item),
      nextCursor:
        result.rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                warehouseId,
                view,
                createdAt: last.created_at,
                taskId: last.id,
              }),
            ).toString("base64url")
          : null,
      generatedAt: new Date().toISOString(),
    };
  }

  async getDetail(warehouseId: string, taskId: string): Promise<TaskDetail> {
    if (!uuid.test(taskId)) invalid();
    const result = await this.pool.query<Row>(`${select} AND task.id = $2`, [
      warehouseId,
      taskId,
    ]);
    const row = result.rows[0];
    if (!row)
      throw new NotFoundException({
        code: "TASK_NOT_FOUND",
        message: "Task not found in the current warehouse.",
      });
    const [routes, alarms] = await Promise.all([
      this.pool.query<{
        topology_id: string;
        topology_revision: number;
        edges: string[];
      }>(
        `SELECT plan.topology_id, plan.topology_revision,
        ARRAY(SELECT edge.edge_id FROM route_plan_edges edge WHERE edge.route_plan_id = plan.id ORDER BY edge.sequence) AS edges
        FROM route_plans plan JOIN warehouse_topologies topology ON topology.id = plan.topology_id AND topology.revision = plan.topology_revision
        WHERE plan.task_id = $1 AND topology.warehouse_id = $2`,
        [taskId, warehouseId],
      ),
      this.pool.query<{
        id: string;
        code: string;
        message: string;
        status: "active" | "acknowledged";
        severity: "info" | "warning" | "critical";
      }>(
        `SELECT id, code, message, status, severity FROM alarms WHERE transport_task_id = $1 AND status IN ('active','acknowledged') ORDER BY raised_at DESC, id DESC LIMIT 1`,
        [taskId],
      ),
    ]);
    const route = routes.rows[0];
    const alarm = alarms.rows[0];
    return {
      task: item(row),
      originResource: {
        type: row.flow === "inbound" ? "InboundReceipt" : "OutboundOrder",
        id: row.origin_id,
      },
      load: {
        externalId: row.external_load_id,
        status: row.load_status,
        location: row.load_location,
      },
      route: route
        ? {
            topologyId: route.topology_id,
            revision: route.topology_revision,
            edges: route.edges,
          }
        : null,
      alarm: alarm
        ? {
            alarmId: alarm.id,
            code: alarm.code,
            message: alarm.message,
            status: alarm.status,
            severity: alarm.severity,
          }
        : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
