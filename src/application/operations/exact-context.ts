import { isTaskDetail, type TaskDetail } from "./task-projection";
import { isLoadPage, type LoadItem } from "./load-projection";
import { isInventoryPage, type InventoryItem } from "./inventory-projection";
import { isLocationPage, type LocationItem } from "./location-projection";
import {
  isOperationsLiveView,
  type OperationsLiveView,
} from "./operations-live-view";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "./operations-details";

export const contextSurfaces = [
  "load",
  "inventory",
  "source",
  "destination",
  "live",
  "exception",
  "history",
] as const;
export type ContextSurface = (typeof contextSurfaces)[number];
export type ExactContext = Readonly<{
  detail: TaskDetail;
  load: LoadItem;
  inventory: InventoryItem | null;
  source: LocationItem;
  destination: LocationItem;
  alarm: OperationsDetails["alarms"][number] | null;
  live: OperationsLiveView | null;
  generatedAt: string;
}>;
export const isContextSurface = (v: unknown): v is ContextSurface =>
  typeof v === "string" && contextSurfaces.includes(v as ContextSurface);
export const contextPath = (
  taskId: string,
  surface: ContextSurface,
  alarmId?: string,
) =>
  `/operations/context/${encodeURIComponent(taskId)}/${surface}${
    alarmId ? `?${new URLSearchParams({ alarmId })}` : ""
  }`;
export function isExactContext(value: unknown): value is ExactContext {
  if (!value || typeof value !== "object") return false;
  const v = value as ExactContext;
  const page = (items: unknown[]) => ({
    items,
    nextCursor: null,
    generatedAt: v.generatedAt,
  });
  return (
    isTaskDetail(v.detail) &&
    v.load?.externalId === v.detail.load.externalId &&
    v.load?.location === v.detail.load.location &&
    v.source?.code === v.detail.task.source &&
    v.destination?.code === v.detail.task.destination &&
    (v.inventory === null ||
      v.inventory?.loadExternalId === v.load.externalId) &&
    (v.alarm === null || v.alarm?.taskId === v.detail.task.taskId) &&
    isLoadPage(page([v.load])) &&
    isInventoryPage(page(v.inventory ? [v.inventory] : [])) &&
    isLocationPage(page([v.source, v.destination])) &&
    (v.live === null || isOperationsLiveView(v.live)) &&
    isOperationsDetails({
      tasks: [],
      equipment: [],
      inventory: [],
      alarms: v.alarm ? [v.alarm] : [],
      locations: [],
      topology: null,
      generatedAt: v.generatedAt,
    })
  );
}
