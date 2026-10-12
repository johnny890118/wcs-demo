// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import TaskPage from "../../pages/operations/tasks/[taskId]";
import type { TaskDetail } from "../../src/application/operations/task-projection";
import { en } from "../../src/ui/i18n/catalogs";

vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: keyof typeof en) => en[key] }),
}));
afterEach(cleanup);

const taskId = "50000000-0000-4000-8000-000000000001";
const workId = "30000000-0000-4000-8000-000000000001";
const detail: TaskDetail = {
  task: {
    taskId,
    flow: "inbound",
    status: "unknown",
    source: "Receiving",
    destination: "Storage",
    equipmentId: null,
    externalReference: "ASN-READABLE",
    sku: "SKU",
    quantity: 12,
    createdAt: "2026-10-11T00:00:00Z",
    updatedAt: "2026-10-11T00:00:00Z",
  },
  originResource: { type: "InboundReceipt", id: workId },
  load: { externalId: "PALLET", status: "unknown", location: "Receiving" },
  route: null,
  alarm: null,
  generatedAt: "2026-10-11T00:00:00Z",
};

it("names Live truthfully and retains exact context without inventing a map or safe route", () => {
  render(<TaskPage detail={detail} canViewAudit={false} />);
  const live = screen.getByRole("link", { name: en.liveView });
  expect(live.getAttribute("href")).toBe(`/operations/context/${taskId}/live`);
  expect(live.className).toContain("swp-action-secondary");
  expect(screen.queryByRole("link", { name: en.warehouseMap })).toBeNull();
  expect(screen.getByText(en.taskAssignmentNotice)).toBeTruthy();
  expect(screen.getByText(en.taskRoutePending)).toBeTruthy();
  expect(screen.getByText(en.homeReason_unknown_task)).toBeTruthy();
  expect(
    screen.queryByRole("link", { name: en.viewTaskAuditEvidence }),
  ).toBeNull();
  for (const [name, surface] of [
    [en.loads, "load"],
    [en.inventory, "inventory"],
    [en.source, "source"],
    [en.destination, "destination"],
  ]) {
    const action = screen.getByRole("link", { name });
    expect(action.getAttribute("href")).toBe(
      `/operations/context/${taskId}/${surface}`,
    );
    expect(action.className).toContain("swp-action-secondary");
  }
});

it("keeps audit separately gated and subordinate without changing evidence destinations", () => {
  render(<TaskPage detail={detail} canViewAudit />);
  const history = screen.getByRole("link", { name: en.viewTaskAuditEvidence });
  expect(history.getAttribute("href")).toBe(
    `/operations/context/${taskId}/history`,
  );
  expect(history.className).toContain("swp-action-ghost");
  const receipt = screen.getByRole("link", {
    name: en.viewReceiptAuditEvidence,
  });
  expect(receipt.getAttribute("href")).toBe(
    `/operations/audit?resourceType=InboundReceipt&resourceId=${workId}`,
  );
  expect(receipt.className).toContain("swp-action-ghost");
});

it("unavailable remains unavailable with an owned return action", () => {
  render(<TaskPage detail={null} canViewAudit={false} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    en.taskDataUnavailable,
  );
  const back = screen.getByRole("link", { name: en.returnToTaskQueue });
  expect(back.getAttribute("href")).toBe("/operations/tasks");
  expect(back.className).toContain("swp-action-secondary");
  expect(screen.queryByRole("link", { name: en.liveView })).toBeNull();
});
