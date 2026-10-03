import { expect, it } from "vitest";
import { homeInvestigationDestination } from "../../src/ui/operations/home-investigation";
import type { OperationsHome } from "../../src/application/operations/operations-home";

const item: OperationsHome["attention"][number] = {
  kind: "task",
  reason: "unknown_task",
  severity: "critical",
  reference: "A → B",
  taskId: "recorded-task",
  equipmentId: null,
};
it("investigates contextual work rather than generic diagnostics", () => {
  expect(homeInvestigationDestination(item)).toBe(
    "/operations/tasks/recorded-task",
  );
  expect(
    homeInvestigationDestination({
      ...item,
      kind: "alarm",
      reason: "active_alarm",
    }),
  ).toBe("/operations/tasks/recorded-task");
  expect(
    homeInvestigationDestination({
      ...item,
      kind: "equipment",
      reason: "stale_telemetry",
    }),
  ).toBe("/operations/warehouse");
});
it("keeps missing context explicit and identifiers inside internal route segments", () => {
  expect(homeInvestigationDestination({ ...item, taskId: null })).toBe(
    "/operations/tasks",
  );
  expect(
    homeInvestigationDestination({
      ...item,
      kind: "alarm",
      reason: "active_alarm",
      taskId: null,
    }),
  ).toBe("/operations/alarms");
  expect(
    homeInvestigationDestination({
      ...item,
      taskId: "//external.invalid/?x=y",
    }),
  ).toBe("/operations/tasks/%2F%2Fexternal.invalid%2F%3Fx%3Dy");
});
