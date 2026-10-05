// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ExceptionAttention } from "../../components/platform/ExceptionAttention";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => key }),
}));
afterEach(cleanup);
const base: OperationsDetails = {
  tasks: [],
  alarms: [],
  equipment: [],
  inventory: [],
  locations: [],
  topology: null,
  generatedAt: "2026-10-05T00:00:00Z",
};
it("preserves exact alarm identity even when codes repeat and exposes unknown tasks without fake recovery", () => {
  const alarm = {
    alarmId: "alarm-one",
    taskId: "task-one",
    equipmentId: "equipment-one",
    code: "DUPLICATE",
    severity: "critical",
    message: "Recorded",
    status: "active",
    raisedAt: base.generatedAt,
    acknowledgedAt: null,
    clearedAt: null,
    resolution: null,
  };
  render(
    <ExceptionAttention
      details={{
        ...base,
        alarms: [alarm, { ...alarm, alarmId: "alarm-two", taskId: "task-two" }],
        tasks: [
          {
            taskId: "task-unknown",
            status: "unknown",
            source: "Receiving",
            destination: "Storage",
            equipmentId: null,
            updatedAt: base.generatedAt,
          },
        ],
      }}
    />,
  );
  expect(
    screen.getAllByRole("link").map((link) => link.getAttribute("href")),
  ).toEqual([
    "/operations/context/task-one/exception?alarmId=alarm-one",
    "/operations/context/task-two/exception?alarmId=alarm-two",
    "/operations/context/task-unknown/exception",
  ]);
  expect(screen.getByText("homeReason_unknown_task")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});
it("links an unassociated equipment observation exactly and qualifies empty bounded evidence", () => {
  const view = render(
    <ExceptionAttention
      details={{
        ...base,
        equipment: [
          {
            equipmentId: "device with space",
            adapterKey: "simulation",
            active: true,
            capabilities: [],
            telemetry: null,
          },
        ],
      }}
    />,
  );
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "/operations/warehouse?equipmentId=device+with+space",
  );
  expect(screen.getByText("exceptionSnapshotNotice")).toBeTruthy();
  view.rerender(<ExceptionAttention details={base} />);
  expect(screen.getByText("noAttentionRequired")).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
});
it("keeps each equipment target when two old observations point at a task reassigned elsewhere", () => {
  const telemetry: NonNullable<
    OperationsDetails["equipment"][number]["telemetry"]
  > = {
    status: "unknown",
    taskId: "task-now-on-B",
    loadId: null,
    faultCode: null,
    topologyId: null,
    topologyRevision: null,
    nodeId: null,
    connectionStatus: "disconnected",
    quality: "good",
    freshness: "stale",
    ageMs: 60000,
    sequence: 1,
    observedAt: base.generatedAt,
    receivedAt: base.generatedAt,
    source: "simulation",
  };
  render(
    <ExceptionAttention
      details={{
        ...base,
        tasks: [
          {
            taskId: "task-now-on-B",
            equipmentId: "B",
            status: "assigned",
            source: "Receiving",
            destination: "Storage",
            updatedAt: base.generatedAt,
          },
        ],
        equipment: ["A", "C"].map((equipmentId) => ({
          equipmentId,
          adapterKey: "simulation",
          active: true,
          capabilities: [],
          telemetry,
        })),
      }}
    />,
  );
  expect(
    screen.getAllByRole("link").map((link) => link.getAttribute("href")),
  ).toEqual([
    "/operations/warehouse?equipmentId=A",
    "/operations/warehouse?equipmentId=C",
  ]);
});
