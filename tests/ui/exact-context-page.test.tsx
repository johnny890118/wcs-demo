// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import Page, {
  getServerSideProps,
} from "../../pages/operations/context/[taskId]/[surface]";
import {
  fetchExactContext,
  fetchAuditEvents,
} from "../../src/infrastructure/http/wcs-api-client";
import { testOperationalSession } from "../fixtures/operational-access";
import type { ExactContext } from "../../src/application/operations/exact-context";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  fetchExactContext: vi.fn(),
  fetchAuditEvents: vi.fn(),
  WcsProjectionError: class extends Error {},
}));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => key }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "50000000-0000-4000-8000-000000000001";
const generatedAt = "2026-10-12T00:00:00Z";
const workId = "30000000-0000-4000-8000-000000000001";
const reference = "ASN-" + "LONGREFERENCE".repeat(15);
const location = {
  locationId: "20000000-0000-4000-8000-000000000001",
  code: "Receiving",
  kind: "receiving",
  status: "available" as const,
  capabilities: [],
  recordedLoads: 0,
  stockRecords: 0,
  binding: null,
};
const context: ExactContext = {
  detail: {
    task: {
      taskId: id,
      status: "unknown",
      flow: "inbound",
      source: "Receiving",
      destination: "Storage",
      equipmentId: null,
      externalReference: reference,
      sku: "SKU",
      quantity: 1,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    },
    originResource: { type: "InboundReceipt", id: workId },
    load: { externalId: "PALLET", status: "received", location: "Receiving" },
    route: null,
    alarm: null,
    generatedAt,
  },
  load: {
    loadId: "40000000-0000-4000-8000-000000000001",
    externalId: "PALLET",
    sku: "SKU",
    receivedQuantity: 1,
    status: "received",
    location: "Receiving",
    receiptId: workId,
    receiptReference: reference,
    inventory: null,
    updatedAt: generatedAt,
  },
  inventory: null,
  source: location,
  destination: {
    ...location,
    locationId: "20000000-0000-4000-8000-000000000002",
    code: "Storage",
    kind: "storage",
  },
  alarm: null,
  live: null,
  generatedAt,
};
const contextProps = {
  context,
  events: null,
  cursor: null,
  alarmId: null,
  canViewAudit: false,
  canAcknowledge: false,
  canRecover: false,
};

it("gives the exact surface one selected navigation and a readable full reference before handoffs", () => {
  render(<Page {...contextProps} surface="inventory" />);
  const heading = screen.getByRole("heading", { level: 1 });
  expect(heading.textContent).toBe("inventory");
  expect(screen.getByText(reference)).toBeTruthy();
  const navigation = screen.getByRole("navigation", {
    name: "exactContextSurfaces",
  });
  const selected = navigation.querySelectorAll("a[aria-current='page']");
  expect(selected).toHaveLength(1);
  expect(selected[0].getAttribute("href")).toBe(
    `/operations/context/${id}/inventory`,
  );
  expect(selected[0].className).toContain("swp-context-link is-current");
  expect(screen.queryByRole("link", { name: "auditHistory" })).toBeNull();
  expect(screen.getByText("exactContextNoStock")).toBeTruthy();
  const work = screen.getByRole("link", {
    name: `openWorkContext · ${reference}`,
  });
  expect(work.textContent).toBe("openWorkContext");
  expect(work.getAttribute("href")).toBe(`/operations/work/inbound/${workId}`);
  expect(work.className).toContain("swp-action-secondary");
  expect(
    heading.compareDocumentPosition(work) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

it("keeps history permission and alarm identity on every exact surface", () => {
  const alarmId = "80000000-0000-4000-8000-000000000001";
  render(
    <Page
      {...contextProps}
      context={{
        ...context,
        alarm: {
          alarmId,
          taskId: id,
          equipmentId: "EQ",
          code: "RECORDED",
          message: "Recorded clearing",
          severity: "warning",
          status: "cleared",
          raisedAt: generatedAt,
          acknowledgedAt: generatedAt,
          clearedAt: generatedAt,
          resolution: "Recorded clearing",
        },
      }}
      surface="history"
      canViewAudit
      alarmId={alarmId}
    />,
  );
  const navigation = screen.getByRole("navigation", {
    name: "exactContextSurfaces",
  });
  for (const link of navigation.querySelectorAll("a")) {
    expect(link.getAttribute("href")).toContain(`?alarmId=${alarmId}`);
  }
  expect(
    screen
      .getByRole("link", { name: "auditHistory" })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(screen.getByRole("alert").textContent).toBe("auditUnavailable");
});

it("does not invent equipment or alarm safety evidence for an unknown unassigned task", () => {
  const view = render(<Page {...contextProps} surface="live" />);
  expect(screen.getByRole("status").textContent).toBe("exactContextUnresolved");
  expect(screen.queryByText("liveEquipment")).toBeNull();
  view.rerender(<Page {...contextProps} surface="exception" />);
  expect(screen.getByRole("status").textContent).toBe(
    "homeReason_unknown_task",
  );
  expect(screen.queryByRole("button", { name: "recoverAlarm" })).toBeNull();
});
const request = (surface: string, query = {}) => ({
  params: { taskId: id, surface },
  query,
  req: {},
  res: { setHeader: vi.fn(), headersSent: false },
});
it("does not fetch context or history without independent audit permission", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    ...testOperationalSession,
    access: {
      ...testOperationalSession.access,
      principal: {
        ...testOperationalSession.access.principal,
        permissions: ["operations.view"],
        warehouseScopes:
          testOperationalSession.access.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["operations.view"] }),
          ),
      },
    },
  });
  expect(await getServerSideProps(request("history") as never)).toHaveProperty(
    "redirect",
  );
  expect(fetchExactContext).not.toHaveBeenCalled();
  expect(fetchAuditEvents).not.toHaveBeenCalled();
});
it("history permission alone cannot read operational context", async () => {
  vi.mocked(getServerSession).mockResolvedValue({
    ...testOperationalSession,
    access: {
      ...testOperationalSession.access,
      principal: {
        ...testOperationalSession.access.principal,
        permissions: ["audit.view"],
        warehouseScopes:
          testOperationalSession.access.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["audit.view"] }),
          ),
      },
    },
  });
  expect(await getServerSideProps(request("history") as never)).toEqual({
    notFound: true,
  });
  expect(fetchExactContext).not.toHaveBeenCalled();
  expect(fetchAuditEvents).not.toHaveBeenCalled();
});
it("rejects ambiguous alarm and pagination on non-history surfaces before reads", async () => {
  expect(
    await getServerSideProps(request("load", { alarmId: [id, id] }) as never),
  ).toEqual({ notFound: true });
  expect(
    await getServerSideProps(request("live", { cursor: "a" }) as never),
  ).toEqual({ notFound: true });
  expect(fetchExactContext).not.toHaveBeenCalled();
});
it("does not invent an alternative context on unavailable projection", () => {
  render(
    <Page
      context={null}
      surface="load"
      events={null}
      cursor={null}
      alarmId={null}
      canViewAudit={false}
      canAcknowledge={false}
      canRecover={false}
    />,
  );
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "taskDataUnavailable",
  );
  expect(screen.queryByRole("link")).toBeNull();
});
