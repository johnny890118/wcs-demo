import {
  isTaskQueuePage,
  taskStatuses,
  type TaskQueuePage,
  type TaskStatus,
} from "./task-projection";

export type WorkFlow = "inbound" | "outbound";
export type WorkDetail = Readonly<{
  work: Readonly<{
    workId: string;
    flow: WorkFlow;
    externalReference: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    contents: readonly Readonly<{ sku: string; quantity: number }>[];
    contentsMayBeLimited: boolean;
    destination: string | null;
  }>;
  execution: Readonly<{
    referencedTaskCount: number;
    qualifiedTaskCount: number;
    counts: Readonly<Record<TaskStatus, number>>;
    page: TaskQueuePage;
  }>;
}>;
export type WorkQuery = Readonly<{ cursor?: string; limit?: number }>;
export const workIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function workPath(flow: WorkFlow, workId: string): string {
  return `/operations/work/${flow}/${encodeURIComponent(workId.toLowerCase())}`;
}
export function isWorkDetail(value: unknown): value is WorkDetail {
  if (!value || typeof value !== "object") return false;
  const v = value as WorkDetail;
  const w = v.work;
  const e = v.execution;
  const count = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  return (
    !!w &&
    !!e &&
    !!e.counts &&
    workIdPattern.test(w.workId) &&
    ["inbound", "outbound"].includes(w.flow) &&
    typeof w.externalReference === "string" &&
    Array.isArray(w.contents) &&
    w.contents.length <= 50 &&
    w.contents.every(
      (item) =>
        !!item &&
        typeof item.sku === "string" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0,
    ) &&
    typeof w.contentsMayBeLimited === "boolean" &&
    (w.destination === null || typeof w.destination === "string") &&
    [
      "requested",
      "in_progress",
      "completed",
      "cancelled",
      ...(w.flow === "outbound" ? ["allocated"] : []),
    ].includes(w.status) &&
    [w.createdAt, w.updatedAt].every(
      (d) => typeof d === "string" && !Number.isNaN(Date.parse(d)),
    ) &&
    count(e.referencedTaskCount) &&
    count(e.qualifiedTaskCount) &&
    e.qualifiedTaskCount <= e.referencedTaskCount &&
    taskStatuses.every((s) => count(e.counts[s])) &&
    taskStatuses.reduce((sum, s) => sum + e.counts[s], 0) ===
      e.qualifiedTaskCount &&
    isTaskQueuePage(e.page) &&
    e.page.tasks.length <= e.qualifiedTaskCount &&
    e.page.tasks.every(
      (t) => t.flow === w.flow && t.externalReference === w.externalReference,
    )
  );
}
