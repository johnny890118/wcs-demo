import type { OperationsHome } from "../../application/operations/operations-home";

// Destinations still authorize independently. Telemetry identifiers are not authority.
export function homeInvestigationDestination(
  item: OperationsHome["attention"][number],
): string {
  if (item.kind === "equipment") return "/operations/warehouse";
  if (item.taskId)
    return `/operations/tasks/${encodeURIComponent(item.taskId)}`;
  return item.kind === "alarm" ? "/operations/alarms" : "/operations/tasks";
}
