import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Pool } from "pg";
import {
  taskStatuses,
  type TaskStatus,
} from "../../../../src/application/operations/task-projection";
import {
  workIdPattern,
  type WorkDetail,
  type WorkFlow,
} from "../../../../src/application/operations/work-projection";
import { DATABASE_POOL } from "../database/database.module";
import {
  taskReadSelect,
  taskReadItem,
  type TaskReadRow,
} from "./task-projection.service";

function invalid(): never {
  throw new BadRequestException({
    code: "INVALID_WORK_QUERY",
    message: "Invalid work query.",
  });
}
@Injectable()
export class WorkProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async getDetail(
    warehouseId: string,
    flow: string,
    workId: string,
    query: Record<string, unknown> = {},
  ): Promise<WorkDetail> {
    const limit =
      query.limit === undefined
        ? 50
        : typeof query.limit === "string" && /^\d+$/.test(query.limit)
          ? Number(query.limit)
          : query.limit;
    if (
      !["inbound", "outbound"].includes(flow) ||
      !workIdPattern.test(workId) ||
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      invalid();
    workId = workId.toLowerCase();
    let cursor: { createdAt: string; taskId: string } | null = null;
    if (query.cursor !== undefined) {
      if (
        typeof query.cursor !== "string" ||
        query.cursor.length > 1000 ||
        !/^[A-Za-z0-9_-]+$/.test(query.cursor)
      )
        invalid();
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, "base64url").toString("utf8"),
        );
        if (
          decoded.warehouseId !== warehouseId ||
          decoded.flow !== flow ||
          decoded.workId !== workId ||
          typeof decoded.createdAt !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(
            decoded.createdAt,
          ) ||
          Number.isNaN(Date.parse(decoded.createdAt)) ||
          new Date(decoded.createdAt).toISOString().slice(0, 23) !==
            decoded.createdAt.slice(0, 23) ||
          typeof decoded.taskId !== "string" ||
          !workIdPattern.test(decoded.taskId)
        )
          invalid();
        cursor = decoded;
      } catch {
        invalid();
      }
    }
    // These identifiers are selected only from the validated flow, never URL SQL.
    const table = flow === "inbound" ? "inbound_receipts" : "outbound_orders";
    const owner = flow === "inbound" ? "receipt_id" : "outbound_order_id";
    const qualified = `${taskReadSelect} AND task.${owner} = $2::uuid`;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const roots = await client.query<{
        id: string;
        external_reference: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        referenced: number;
        sku: string | null;
        quantity: number | null;
        destination: string | null;
        receipt_load_count: number | null;
      }>(
        `SELECT root.id, root.external_reference, root.status, root.created_at, root.updated_at,
          ${
            flow === "inbound"
              ? "(SELECT count(*)::integer FROM loads WHERE receipt_id=root.id)"
              : "NULL::integer"
          } AS receipt_load_count,
          ${
            flow === "outbound"
              ? "root.sku, root.quantity, (SELECT code FROM locations WHERE id=root.destination_location_id AND warehouse_id=$1)"
              : "NULL::text AS sku, NULL::integer AS quantity, NULL::text"
          } AS destination,
          (SELECT count(*)::integer FROM transport_tasks task WHERE task.${owner} = root.id) AS referenced
        FROM ${table} root WHERE root.id = $2 AND root.warehouse_id = $1`,
        [warehouseId, workId],
      );
      const root = roots.rows[0];
      if (!root)
        throw new NotFoundException({
          code: "WORK_NOT_FOUND",
          message: "Work not found in the current warehouse.",
        });
      const contents =
        flow === "outbound"
          ? [{ sku: root.sku!, quantity: root.quantity! }]
          : (
              await client.query<{
                sku: string;
                quantity: string;
                resolved_load_count: number;
              }>(
                `SELECT load.sku, sum(load.quantity)::text AS quantity, count(*)::integer AS resolved_load_count FROM loads load
          JOIN locations location ON location.id=load.current_location_id AND location.warehouse_id=$1
          WHERE load.receipt_id=$2 GROUP BY load.sku ORDER BY load.sku LIMIT 51`,
                [warehouseId, workId],
              )
            ).rows;
      const requestContents = contents
        .slice(0, 50)
        .map((item) => ({ sku: item.sku, quantity: Number(item.quantity) }));
      if (
        requestContents.some(
          (item) => !Number.isSafeInteger(item.quantity) || item.quantity <= 0,
        )
      )
        throw new Error("Work contents exceed supported quantity precision.");
      const stats = await client.query<{ status: TaskStatus; count: number }>(
        `SELECT status, count(*)::integer AS count FROM (${qualified}) qualified GROUP BY status`,
        [warehouseId, workId],
      );
      const result = await client.query<TaskReadRow>(
        `${qualified}
        AND ($3::timestamptz IS NULL OR (task.created_at, task.id) < ($3::timestamptz, $4::uuid))
        ORDER BY task.created_at DESC, task.id DESC LIMIT $5`,
        [
          warehouseId,
          workId,
          cursor?.createdAt ?? null,
          cursor?.taskId ?? null,
          limit + 1,
        ],
      );
      const counts = Object.fromEntries(
        taskStatuses.map((status) => [status, 0]),
      ) as Record<TaskStatus, number>;
      for (const row of stats.rows) counts[row.status] = row.count;
      const rows = result.rows.slice(0, limit);
      const last = rows.at(-1);
      const detail: WorkDetail = {
        work: {
          workId: root.id,
          flow: flow as WorkFlow,
          externalReference: root.external_reference,
          status: root.status,
          createdAt: root.created_at.toISOString(),
          updatedAt: root.updated_at.toISOString(),
          contents: requestContents,
          contentsMayBeLimited:
            contents.length > 50 ||
            (flow === "outbound"
              ? root.destination === null
              : contents.reduce(
                  (sum, item) =>
                    sum +
                    ("resolved_load_count" in item
                      ? (item.resolved_load_count as number)
                      : 0),
                  0,
                ) < (root.receipt_load_count ?? 0)),
          destination: root.destination,
        },
        execution: {
          referencedTaskCount: root.referenced,
          qualifiedTaskCount: stats.rows.reduce(
            (sum, row) => sum + row.count,
            0,
          ),
          counts,
          page: {
            tasks: rows.map(taskReadItem),
            nextCursor:
              result.rows.length > limit && last
                ? Buffer.from(
                    JSON.stringify({
                      warehouseId,
                      flow,
                      workId,
                      createdAt: last.created_at,
                      taskId: last.id,
                    }),
                  ).toString("base64url")
                : null,
            generatedAt: new Date().toISOString(),
          },
        },
      };
      await client.query("COMMIT");
      return detail;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
