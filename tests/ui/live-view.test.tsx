// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WarehouseLiveView } from "../../components/platform/WarehouseLiveView";
import type { OperationsLiveView } from "../../src/application/operations/operations-live-view";
import { projectSpatialReadContext } from "../../src/application/operations/spatial-read-context";
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => key }),
}));
afterEach(cleanup);
const view: OperationsLiveView = {
  spatialContext: projectSpatialReadContext(null),
  generatedAt: "2026-10-03T00:00:00Z",
  topology: null,
  locations: [],
  work: [],
  alarms: [],
  coverage: {
    workMayBeLimited: false,
    equipmentMayBeLimited: false,
    locationsMayBeLimited: false,
    alarmsMayBeLimited: false,
  },
  equipment: ["one", "two"].map((equipmentId) => ({
    equipmentId,
    active: true,
    capabilities: [],
    status: null,
    observation: null,
    position: {
      state: "unknown",
      reason: "missing_telemetry",
      nodeId: null,
      reference: null,
      locations: [],
      validUntil: null,
    },
    observedTaskId: null,
    observedTaskContext: "unresolved",
    assignedTaskIds: [],
  })),
};
it("selects unknown equipment without inventing position, idle state or foreign work links", () => {
  render(
    <WarehouseLiveView
      view={view}
      projectionCurrent
      now={Date.parse(view.generatedAt)}
    />,
  );
  const second = screen.getByRole("button", { name: /two/ });
  fireEvent.click(second);
  expect(second.getAttribute("aria-pressed")).toBe("true");
  expect(
    screen.getByRole("button", { name: /one/ }).getAttribute("aria-pressed"),
  ).toBe("false");
  expect(screen.getByText("liveObservedUnresolved")).toBeTruthy();
  expect(screen.getByText("liveReason_missing_telemetry")).toBeTruthy();
  expect(document.querySelector('a[href^="/operations/tasks/"]')).toBeNull();
});
it("does not assert absence of work when the retained empty projection is noncurrent", () => {
  render(
    <WarehouseLiveView
      view={view}
      projectionCurrent={false}
      now={Date.parse(view.generatedAt)}
    />,
  );
  expect(screen.getByText("liveWorkUnavailable")).toBeTruthy();
  expect(screen.queryByText("noCurrentWork")).toBeNull();
});
