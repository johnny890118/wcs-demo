// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import AuditHistoryPage from "../../pages/operations/audit";
import type { AuditEventPage } from "../../src/application/audit/audit-projection";
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
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const page = (
  actor: string,
  nextCursor: string | null = null,
): AuditEventPage => ({
  events: [
    {
      eventId: actor,
      correlationId: "correlation-test",
      occurredAt: "2026-10-09T00:00:00Z",
      actor: { type: "user", id: actor },
      action: "transport_task.complete",
      knownAction: true,
      knownResource: true,
      resource: { type: "TransportTask", id: "task-test" },
      evidence: {},
    },
  ],
  nextCursor,
});

it("prioritizes the readable resource context while keeping exact technical filters available", () => {
  render(
    <AuditHistoryPage
      warehouseId="one"
      filters={{ resourceType: "TransportTask", resourceId: "task-test" }}
      initialPage={page("current-actor")}
    />,
  );
  expect(
    screen.getByText(`${en.filteredAuditHistory} · Transport task`),
  ).toBeTruthy();
  const header = screen.getByRole("group", { name: en.filteredAuditHistory });
  const technical = within(header)
    .getByText(/"resourceId": "task-test"/)
    .closest("details");
  expect(technical).toBeTruthy();
  expect(technical?.open).toBe(false);
  fireEvent.click(technical!.querySelector("summary")!);
  expect(technical?.open).toBe(true);
  expect(
    within(header).getByText(/"resourceType": "TransportTask"/),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: en.clearAuditFilter })
      .getAttribute("href"),
  ).toBe("/operations/audit");
});

it("replaces filtered evidence when clearing the URL context without a reload", () => {
  const { rerender } = render(
    <AuditHistoryPage
      warehouseId="one"
      filters={{ resourceId: "missing" }}
      initialPage={{ events: [], nextCursor: null }}
    />,
  );
  expect(screen.getByText(en.noAuditEvents)).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: en.clearAuditFilter })
      .getAttribute("href"),
  ).toBe("/operations/audit");
  rerender(
    <AuditHistoryPage
      warehouseId="one"
      filters={{}}
      initialPage={page("current-actor")}
    />,
  );
  expect(screen.queryByText(en.noAuditEvents)).toBeNull();
  expect(screen.getByText("Actor: current-actor")).toBeTruthy();
});

it("retains every combined filter inside the disclosure without inventing a Work label", () => {
  const filters = {
    resourceType: "TransportTask",
    resourceId: "task-test",
    correlationId: "correlation-test",
  };
  render(
    <AuditHistoryPage
      warehouseId="one"
      filters={filters}
      initialPage={page("current-actor")}
    />,
  );
  const header = screen.getByRole("group", { name: en.filteredAuditHistory });
  const record = within(header).getByText(
    /"correlationId": "correlation-test"/,
  );
  for (const [key, value] of Object.entries(filters)) {
    expect(record.textContent).toContain(`"${key}": "${value}"`);
  }
  expect(record.closest("details")?.open).toBe(false);
});

it("retires old evidence and pagination on warehouse change or failed projection", () => {
  const { rerender } = render(
    <AuditHistoryPage
      warehouseId="one"
      filters={{}}
      initialPage={page("old-actor", "old-cursor")}
    />,
  );
  rerender(
    <AuditHistoryPage warehouseId="two" filters={{}} initialPage={null} />,
  );
  expect(screen.queryByText(/old-actor/)).toBeNull();
  expect(screen.queryByRole("button", { name: en.loadOlderAudit })).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe(en.auditUnavailable);
  rerender(
    <AuditHistoryPage
      warehouseId="two"
      filters={{}}
      initialPage={page("new-actor")}
    />,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Actor: new-actor")).toBeTruthy();
});

it("refreshes evidence for the same filters when a new server snapshot arrives", () => {
  const { rerender } = render(
    <AuditHistoryPage
      warehouseId="one"
      filters={{}}
      initialPage={page("before-refresh")}
    />,
  );
  rerender(
    <AuditHistoryPage
      warehouseId="one"
      filters={{}}
      initialPage={page("after-refresh")}
    />,
  );
  expect(screen.queryByText(/before-refresh/)).toBeNull();
  expect(screen.getByText("Actor: after-refresh")).toBeTruthy();
});

it("keeps pagination on identical snapshots but cannot append a late response across contexts", async () => {
  let resolve!: (response: Response) => void;
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const snapshot = page("original-actor", "cursor-test");
  const { rerender } = render(
    <AuditHistoryPage
      warehouseId="one"
      filters={{ resourceId: "task-test" }}
      initialPage={snapshot}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: en.loadOlderAudit }));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/operations/audit?resourceId=task-test&cursor=cursor-test",
  );
  rerender(
    <AuditHistoryPage
      warehouseId="one"
      filters={{ resourceId: "task-test" }}
      initialPage={{ ...snapshot }}
    />,
  );
  expect(
    (screen.getByRole("button", { name: en.loadingAudit }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  rerender(
    <AuditHistoryPage
      warehouseId="two"
      filters={{}}
      initialPage={page("new-scope-actor")}
    />,
  );
  await act(async () => {
    resolve(
      new Response(JSON.stringify(page("late-old-actor")), { status: 200 }),
    );
  });
  expect(screen.queryByText(/late-old-actor/)).toBeNull();
  expect(screen.queryByText(/original-actor/)).toBeNull();
  expect(screen.getByText("Actor: new-scope-actor")).toBeTruthy();
});
