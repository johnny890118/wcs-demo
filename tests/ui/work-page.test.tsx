// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import WorkPage from "../../pages/operations/work/[flow]/[workId]";
import type { WorkDetail } from "../../src/application/operations/work-projection";
import {
  taskStatuses,
  type TaskStatus,
} from "../../src/application/operations/task-projection";
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
const detail: WorkDetail = {
  work: {
    workId: "30000000-0000-4000-8000-000000000001",
    flow: "outbound",
    externalReference: "ORDER-READABLE",
    status: "allocated",
    createdAt: "2026-10-04T00:00:00Z",
    updatedAt: "2026-10-04T00:00:00Z",
    contents: [{ sku: "SKU-REQUEST", quantity: 20 }],
    contentsMayBeLimited: false,
    destination: "SHIPPING-READABLE",
  },
  execution: {
    referencedTaskCount: 1,
    qualifiedTaskCount: 0,
    counts: Object.fromEntries(
      taskStatuses.map((status) => [status, 0]),
    ) as Record<TaskStatus, number>,
    page: { tasks: [], nextCursor: null, generatedAt: "2026-10-04T00:00:00Z" },
  },
};
it("shows business request even with unresolved execution, without audit permissions or invented success", () => {
  render(<WorkPage detail={detail} canViewAudit={false} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "ORDER-READABLE",
  );
  expect(screen.getByText("SKU-REQUEST · 20")).toBeTruthy();
  expect(screen.getByText(/SHIPPING-READABLE/)).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(
    en.workIncompleteEvidence,
  );
  expect(screen.getByText(en.workNoTasks)).toBeTruthy();
  expect(
    screen.queryByRole("link", { name: en.viewOrderAuditEvidence }),
  ).toBeNull();
  expect(screen.queryByText(en.workStatus_completed)).toBeNull();
});
it("gates contextual audit separately and retains a visible root refresh link", () => {
  render(<WorkPage detail={detail} canViewAudit />);
  expect(
    screen
      .getByRole("link", { name: en.viewOrderAuditEvidence })
      .getAttribute("href"),
  ).toContain("resourceType=OutboundOrder&resourceId=30000000");
  expect(
    screen.getByRole("link", { name: en.workRefresh }).getAttribute("href"),
  ).toBe("/operations/work/outbound/30000000-0000-4000-8000-000000000001");
});
it("split outbound stays allocated with one completed task and offers only its queued sibling", () => {
  const completedId = "50000000-0000-4000-8000-000000000001";
  const queuedId = "50000000-0000-4000-8000-000000000002";
  const task = {
    source: "Storage",
    destination: "Shipping",
    equipmentId: null,
    flow: "outbound" as const,
    externalReference: "ORDER-READABLE",
    sku: "SKU-REQUEST",
    quantity: 10,
    createdAt: detail.work.createdAt,
    updatedAt: detail.work.updatedAt,
  };
  render(
    <WorkPage
      canViewAudit={false}
      canExecute
      detail={{
        ...detail,
        execution: {
          referencedTaskCount: 2,
          qualifiedTaskCount: 2,
          counts: { ...detail.execution.counts, completed: 1, queued: 1 },
          page: {
            ...detail.execution.page,
            tasks: [
              { ...task, taskId: completedId, status: "completed" },
              { ...task, taskId: queuedId, status: "queued" },
            ],
          },
        },
      }}
    />,
  );
  expect(screen.getByText(en.workAttention_waiting)).toBeTruthy();
  expect(screen.getByText(/Stock allocated/)).toBeTruthy();
  expect(screen.queryByText(en.workStatus_completed)).toBeNull();
  expect(screen.getAllByRole("link", { name: en.workResume })).toHaveLength(1);
  expect(
    screen.getByRole("link", { name: en.workResume }).getAttribute("href"),
  ).toContain(`/resume/${queuedId}`);
});
