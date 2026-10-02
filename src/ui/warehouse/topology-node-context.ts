import type { OperationsDetails } from "../../application/operations/operations-details";

/** Display-only correlation through the backend's active-version location binding.
 * Readable codes are projection labels, never routing or physical-position truth.
 */
export function topologyNodeContext(
  details: OperationsDetails,
  nodeId: string,
) {
  if (!details.topology?.nodes.some((node) => node.nodeId === nodeId)) {
    return { locations: [], tasks: [], stockRecords: 0 };
  }
  const locations = details.locations.filter(
    (location) => location.activeNodeId === nodeId,
  );
  const codes = new Set(locations.map((location) => location.code));
  const terminal = new Set(["completed", "cancelled", "failed"]);
  return {
    locations,
    tasks: details.tasks.filter(
      (task) =>
        !terminal.has(task.status) &&
        (codes.has(task.source) || codes.has(task.destination)),
    ),
    stockRecords: details.inventory.filter(
      (item) => item.status !== "shipped" && codes.has(item.location),
    ).length,
  };
}
