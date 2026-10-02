export const taskStatuses = [
  "queued",
  "assigned",
  "in_progress",
  "blocked",
  "unknown",
  "completed",
  "cancelled",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskQueueItem = Readonly<{
  taskId: string;
  status: TaskStatus;
  source: string;
  destination: string;
  equipmentId: string | null;
  flow: "inbound" | "outbound";
  externalReference: string;
  sku: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}>;
export type TaskQueuePage = Readonly<{
  tasks: readonly TaskQueueItem[];
  nextCursor: string | null;
  generatedAt: string;
}>;
export type TaskQueueQuery = Readonly<{
  cursor?: string;
  view?: "active" | "all";
  limit?: number;
}>;
export type TaskDetail = Readonly<{
  task: TaskQueueItem;
  originResource: Readonly<{
    type: "InboundReceipt" | "OutboundOrder";
    id: string;
  }>;
  load: Readonly<{ externalId: string; status: string; location: string }>;
  route: Readonly<{
    topologyId: string;
    revision: number;
    edges: readonly string[];
  }> | null;
  alarm: Readonly<{
    alarmId: string;
    code: string;
    message: string;
    status: "active" | "acknowledged";
    severity: "info" | "warning" | "critical";
  }> | null;
  generatedAt: string;
}>;

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const date = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));
const uuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
export function isTaskQueueItem(v: unknown): v is TaskQueueItem {
  return (
    record(v) &&
    uuid(v.taskId) &&
    taskStatuses.includes(v.status as TaskStatus) &&
    typeof v.source === "string" &&
    typeof v.destination === "string" &&
    (v.equipmentId === null || typeof v.equipmentId === "string") &&
    ["inbound", "outbound"].includes(v.flow as string) &&
    typeof v.externalReference === "string" &&
    typeof v.sku === "string" &&
    typeof v.quantity === "number" &&
    Number.isSafeInteger(v.quantity) &&
    v.quantity > 0 &&
    date(v.createdAt) &&
    date(v.updatedAt)
  );
}
export function isTaskQueuePage(v: unknown): v is TaskQueuePage {
  return (
    record(v) &&
    Array.isArray(v.tasks) &&
    v.tasks.every(isTaskQueueItem) &&
    (v.nextCursor === null || typeof v.nextCursor === "string") &&
    date(v.generatedAt)
  );
}
export function isTaskDetail(v: unknown): v is TaskDetail {
  if (
    !record(v) ||
    !isTaskQueueItem(v.task) ||
    !record(v.originResource) ||
    !record(v.load)
  )
    return false;
  const r = v.route;
  const a = v.alarm;
  return (
    ["InboundReceipt", "OutboundOrder"].includes(
      v.originResource.type as string,
    ) &&
    uuid(v.originResource.id) &&
    typeof v.load.externalId === "string" &&
    typeof v.load.status === "string" &&
    typeof v.load.location === "string" &&
    (r === null ||
      (record(r) &&
        uuid(r.topologyId) &&
        typeof r.revision === "number" &&
        Number.isSafeInteger(r.revision) &&
        r.revision > 0 &&
        Array.isArray(r.edges) &&
        r.edges.every((e) => typeof e === "string"))) &&
    (a === null ||
      (record(a) &&
        uuid(a.alarmId) &&
        typeof a.code === "string" &&
        typeof a.message === "string" &&
        ["active", "acknowledged"].includes(a.status as string) &&
        ["info", "warning", "critical"].includes(a.severity as string))) &&
    date(v.generatedAt)
  );
}
