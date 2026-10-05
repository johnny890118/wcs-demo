import type { TaskDetail, TaskQueueItem } from "./task-projection";
import { workPath, type WorkDetail, type WorkFlow } from "./work-projection";

/** Presentation selection only. Backend execution remains authoritative. */
export function canOfferWorkExecution(task: TaskQueueItem): boolean {
  return task.status === "queued";
}

export function belongsToWork(
  detail: TaskDetail,
  flow: WorkFlow,
  workId: string,
): boolean {
  return (
    detail.task.flow === flow &&
    detail.originResource.type ===
      (flow === "inbound" ? "InboundReceipt" : "OutboundOrder") &&
    detail.originResource.id.toLowerCase() === workId.toLowerCase()
  );
}

export function workResumePath(flow: WorkFlow, workId: string, taskId: string) {
  return `${workPath(flow, workId)}/resume/${encodeURIComponent(
    taskId.toLowerCase(),
  )}`;
}

export type WorkAttention =
  | "incomplete"
  | "unknown"
  | "blocked"
  | "waiting"
  | "running"
  | "finished"
  | "empty";

/** Counts cover the qualified root, never just the current page. */
export function workAttention(detail: WorkDetail): WorkAttention {
  const e = detail.execution;
  if (e.qualifiedTaskCount !== e.referencedTaskCount) return "incomplete";
  if (e.counts.unknown) return "unknown";
  if (e.counts.blocked) return "blocked";
  if (e.counts.queued) return "waiting";
  if (e.counts.assigned || e.counts.in_progress) return "running";
  if (!e.qualifiedTaskCount) return "empty";
  return "finished"; // terminal task evidence, not a synthetic business status
}
