import { taskStatuses, type TaskStatus } from "./task-projection";
import { workIdPattern, type WorkFlow } from "./work-projection";

export type WorkQueueItem = Readonly<{
  workId: string;
  flow: WorkFlow;
  externalReference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  execution: Readonly<{
    referencedTaskCount: number;
    qualifiedTaskCount: number;
    counts: Readonly<Record<TaskStatus, number>>;
  }>;
}>;
export type WorkQueuePage = Readonly<{
  works: readonly WorkQueueItem[];
  nextCursor: string | null;
  generatedAt: string;
}>;
export type WorkQueueQuery = Readonly<{
  view?: "active" | "all";
  cursor?: string;
  limit?: number;
}>;
export function parseWorkQueueQuery(
  query: Record<string, unknown>,
): WorkQueueQuery | null {
  if (Object.keys(query).some((k) => !["view", "cursor", "limit"].includes(k)))
    return null;
  const view = query.view ?? "active";
  const cursor = query.cursor;
  const limit =
    query.limit === undefined
      ? undefined
      : typeof query.limit === "string" && /^\d+$/.test(query.limit)
        ? Number(query.limit)
        : NaN;
  if (
    (view !== "active" && view !== "all") ||
    (cursor !== undefined &&
      (typeof cursor !== "string" ||
        cursor.length > 1000 ||
        !/^[A-Za-z0-9_-]+$/.test(cursor))) ||
    (limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 100))
  )
    return null;
  return {
    view,
    ...(cursor === undefined ? {} : { cursor: cursor as string }),
    ...(limit === undefined ? {} : { limit }),
  };
}
export function isWorkQueuePage(value: unknown): value is WorkQueuePage {
  if (!value || typeof value !== "object") return false;
  const v = value as WorkQueuePage;
  const date = (s: unknown) =>
    typeof s === "string" && !Number.isNaN(Date.parse(s));
  const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  return (
    Array.isArray(v.works) &&
    v.works.length <= 100 &&
    date(v.generatedAt) &&
    (v.nextCursor === null ||
      (typeof v.nextCursor === "string" && v.nextCursor.length <= 1000)) &&
    v.works.every((w) => {
      const e = w?.execution;
      return (
        !!w &&
        workIdPattern.test(w.workId) &&
        ["inbound", "outbound"].includes(w.flow) &&
        typeof w.externalReference === "string" &&
        [
          "requested",
          "in_progress",
          "completed",
          "cancelled",
          ...(w.flow === "outbound" ? ["allocated"] : []),
        ].includes(w.status) &&
        date(w.createdAt) &&
        date(w.updatedAt) &&
        !!e &&
        !!e.counts &&
        count(e.referencedTaskCount) &&
        count(e.qualifiedTaskCount) &&
        e.qualifiedTaskCount <= e.referencedTaskCount &&
        taskStatuses.every((s) => count(e.counts[s])) &&
        taskStatuses.reduce((sum, s) => sum + e.counts[s], 0) ===
          e.qualifiedTaskCount
      );
    })
  );
}
