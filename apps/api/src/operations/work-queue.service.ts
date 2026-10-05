import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import { DATABASE_POOL } from "../database/database.module";
import { taskReadSelect } from "./task-projection.service";
import {
  taskStatuses,
  type TaskStatus,
} from "../../../../src/application/operations/task-projection";
import {
  workIdPattern,
  type WorkFlow,
} from "../../../../src/application/operations/work-projection";
import type { WorkQueuePage } from "../../../../src/application/operations/work-queue";

function invalid(): never {
  throw new BadRequestException({ code: "INVALID_WORK_QUEUE_QUERY" });
}
@Injectable()
export class WorkQueueService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async getQueue(
    warehouseId: string,
    query: Record<string, unknown> = {},
  ): Promise<WorkQueuePage> {
    const view = query.view ?? "active";
    const limit =
      query.limit === undefined
        ? 50
        : typeof query.limit === "string" && /^\d+$/.test(query.limit)
          ? Number(query.limit)
          : query.limit;
    if (
      Object.keys(query).some(
        (key) => !["view", "limit", "cursor"].includes(key),
      ) ||
      !["active", "all"].includes(view as string) ||
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      invalid();
    let cursor: { createdAt: string; workId: string; flow: WorkFlow } | null =
      null;
    if (query.cursor !== undefined) {
      if (
        typeof query.cursor !== "string" ||
        query.cursor.length > 1000 ||
        !/^[A-Za-z0-9_-]+$/.test(query.cursor)
      )
        invalid();
      try {
        const c = JSON.parse(
          Buffer.from(query.cursor, "base64url").toString("utf8"),
        );
        if (
          c.warehouseId !== warehouseId ||
          c.view !== view ||
          typeof c.createdAt !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(c.createdAt) ||
          Number.isNaN(Date.parse(c.createdAt)) ||
          new Date(c.createdAt).toISOString().slice(0, 23) !==
            c.createdAt.slice(0, 23) ||
          typeof c.workId !== "string" ||
          !workIdPattern.test(c.workId) ||
          !["inbound", "outbound"].includes(c.flow)
        )
          invalid();
        cursor = c;
      } catch {
        invalid();
      }
    }
    // One SQL statement is one MVCC snapshot. Root UUID and flow are identity,
    // never external-reference grouping or a client deduplication of task pages.
    const result = await this.pool.query<{
      id: string;
      flow: WorkFlow;
      external_reference: string;
      status: string;
      created_at: string;
      updated_at: Date;
      referenced: number;
      counts: Partial<Record<TaskStatus, number>>;
    }>(
      `WITH roots AS (
      SELECT id, 'inbound'::text AS flow, external_reference, status, created_at, updated_at
      FROM inbound_receipts WHERE warehouse_id=$1
      UNION ALL
      SELECT id, 'outbound'::text AS flow, external_reference, status, created_at, updated_at
      FROM outbound_orders WHERE warehouse_id=$1
    ), qualified AS (${taskReadSelect}), observed AS (
      SELECT root.*,
        (SELECT count(*)::integer FROM transport_tasks task WHERE
          (root.flow='inbound' AND task.receipt_id=root.id) OR
          (root.flow='outbound' AND task.outbound_order_id=root.id)) AS referenced,
        COALESCE((SELECT jsonb_object_agg(status, n) FROM (
          SELECT status, count(*)::integer AS n FROM qualified q
          WHERE q.origin_id=root.id AND q.flow=root.flow GROUP BY status
        ) stats), '{}'::jsonb) AS counts
      FROM roots root
    ) SELECT id, flow, external_reference, status,
      to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at,
      updated_at, referenced, counts FROM observed
    WHERE ($2::text='all' OR status NOT IN ('completed','cancelled')
      OR EXISTS (SELECT 1 FROM jsonb_each_text(counts) s WHERE s.key IN ('queued','assigned','in_progress','blocked','unknown') AND s.value::integer>0)
      OR referenced > (SELECT COALESCE(sum(value::integer),0) FROM jsonb_each_text(counts)))
      AND ($3::timestamptz IS NULL OR (created_at,id,flow) < ($3::timestamptz,$4::uuid,$5::text))
    ORDER BY created_at DESC,id DESC,flow DESC LIMIT $6`,
      [
        warehouseId,
        view,
        cursor?.createdAt ?? null,
        cursor?.workId ?? null,
        cursor?.flow ?? null,
        limit + 1,
      ],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      works: rows.map((r) => {
        const counts = Object.fromEntries(
          taskStatuses.map((s) => [s, r.counts[s] ?? 0]),
        ) as Record<TaskStatus, number>;
        return {
          workId: r.id,
          flow: r.flow,
          externalReference: r.external_reference,
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at.toISOString(),
          execution: {
            referencedTaskCount: r.referenced,
            qualifiedTaskCount: taskStatuses.reduce((n, s) => n + counts[s], 0),
            counts,
          },
        };
      }),
      nextCursor:
        result.rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                warehouseId,
                view,
                createdAt: last.created_at,
                workId: last.id,
                flow: last.flow,
              }),
            ).toString("base64url")
          : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
