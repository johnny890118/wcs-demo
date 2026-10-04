// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AlarmRecoveryPanel } from "../../components/platform/AlarmRecoveryPanel";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const alarm = {
  alarmId: "alarm-one",
  taskId: "task-one",
  equipmentId: "equipment-one",
  code: "FAULT",
  severity: "critical",
  message: "Recorded fault",
  status: "acknowledged",
  raisedAt: "2026-10-03T00:00:00Z",
  acknowledgedAt: "2026-10-03T00:00:01Z",
  clearedAt: null,
  resolution: null,
};
const details: OperationsDetails = {
  tasks: [],
  equipment: [],
  inventory: [],
  locations: [],
  topology: null,
  generatedAt: "2026-10-03T00:00:02Z",
  alarms: [alarm],
};
function show(value: OperationsDetails = details, allowed = true) {
  render(
    <AlarmRecoveryPanel
      details={value}
      canAcknowledge={allowed}
      canRecover={allowed}
      canViewAudit={false}
    />,
  );
}
it("keeps empty bounded evidence informational with a task investigation path", () => {
  show({ ...details, alarms: [] });
  expect(screen.getByText("noActionableAlarms")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "returnToTaskQueue" })
      .getAttribute("href"),
  ).toBe("/operations/tasks");
  expect(screen.queryByRole("button")).toBeNull();
});
it("qualifies missing bounded work context and preserves scoped investigation without granting recovery", () => {
  show(details, false);
  expect(screen.getByText("alarmTaskContextMissing")).toBeTruthy();
  const link = screen.getByRole("link", { name: /inspectCreatedTask/ });
  expect(link.getAttribute("href")).toBe("/operations/tasks/task-one");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(
    screen
      .getByRole("button", { name: "recoverAlarm" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(screen.queryByText("viewAlarmAuditEvidence")).toBeNull();
});
it("presents unknown alarm vocabulary without enabling a recovery action", () => {
  show({
    ...details,
    alarms: [{ ...alarm, status: "future_state", severity: "future_severity" }],
  });
  expect(screen.getAllByText(/alarmStateUnknown/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/alarmSeverityUnknown/).length).toBeGreaterThan(0);
  expect(
    screen
      .getByRole("button", { name: "recoverAlarm" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("does not misreport an unknown recovery result as resumed or completed", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        taskId: "task-one",
        equipmentId: "equipment-one",
        status: "unknown",
        blockingAlarmId: null,
        version: 2,
      }),
      { status: 200 },
    ),
  );
  vi.stubGlobal("fetch", fetch);
  show();
  fireEvent.change(screen.getByLabelText("recoveryStrategy"), {
    target: { value: "resume" },
  });
  expect(screen.getByText("alarmResumeImpact")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("recoveryResolution"), {
    target: { value: "Evidence reviewed" },
  });
  fireEvent.change(screen.getByLabelText("confirmationReason"), {
    target: { value: "Verified evidence" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "recoverAlarm" }));
  expect(await screen.findByText("alarmRecoveryUnknown")).toBeTruthy();
  expect(screen.getByText("alarmRecoveryUnknownHelp")).toBeTruthy();
  expect(screen.queryByText("taskResumed")).toBeNull();
  expect(screen.queryByText("recoveryCompleted")).toBeNull();
  expect(
    screen
      .getByRole("link", { name: "viewRecoveryOutcome" })
      .getAttribute("href"),
  ).toBe("/operations/tasks/task-one");
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("exact exception handoff retains identity while session withdrawal fails the existing mutation path", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ message: "Session revalidation denied" }), {
      status: 401,
    }),
  );
  vi.stubGlobal("fetch", fetch);
  show();
  expect(
    screen
      .getByRole("link", { name: "openExactException" })
      .getAttribute("href"),
  ).toBe("/operations/context/task-one/exception?alarmId=alarm-one");
  fireEvent.change(screen.getByLabelText("recoveryStrategy"), {
    target: { value: "release" },
  });
  fireEvent.change(screen.getByLabelText("recoveryResolution"), {
    target: { value: "Physical evidence reviewed" },
  });
  fireEvent.change(screen.getByLabelText("confirmationReason"), {
    target: { value: "Verified evidence" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "recoverAlarm" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    "Session revalidation denied",
  );
  expect(fetch).toHaveBeenCalledWith(
    "/api/operations/alarms/alarm-one/recover",
    expect.objectContaining({ method: "POST" }),
  );
  expect(screen.queryByText("taskReleased")).toBeNull();
});
