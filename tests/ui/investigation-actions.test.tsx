// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import Home from "../../pages/operations";
import Loads from "../../pages/operations/loads";
import Locations from "../../pages/operations/locations";
import type { OperationsHome } from "../../src/application/operations/operations-home";
import type { LoadPage } from "../../src/application/operations/load-projection";
import type { LocationPage } from "../../src/application/operations/location-projection";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ locale: "en", t: (key: string) => key }),
}));
afterEach(cleanup);
const time = "2026-10-11T00:00:00Z";
const receiptId = "30000000-0000-4000-8000-000000000001";
const loadId = "41000000-0000-4000-8000-000000000001";
const locationId = "20000000-0000-4000-8000-000000000001";
const home: OperationsHome = {
  attention: [
    {
      kind: "task",
      severity: "critical",
      reference: "Receiving → Stock",
      reason: "unknown_task",
      taskId: "task / unknown",
      equipmentId: null,
    },
  ],
  work: [
    {
      taskId: "task / unknown",
      status: "unknown",
      source: "Receiving",
      destination: "Stock",
      equipmentId: null,
      needsAttention: true,
      nextStep: "review_exception",
      updatedAt: time,
    },
  ],
  inventory: { visibleUnits: 0, visibleQuantity: 0, occupiedLocations: 0 },
  generatedAt: time,
  coverage: {
    tasksMayBeLimited: true,
    alarmsMayBeLimited: false,
    equipmentMayBeLimited: false,
    inventoryMayBeLimited: false,
  },
};
const loads: LoadPage = {
  generatedAt: time,
  nextCursor: "owned",
  items: [
    {
      loadId,
      externalId: "PALLET-A",
      sku: "SKU-A",
      receivedQuantity: 24,
      status: "received",
      location: "Receiving",
      receiptId,
      receiptReference: "ASN-A",
      inventory: null,
      updatedAt: time,
    },
  ],
};
const locations: LocationPage = {
  generatedAt: time,
  nextCursor: "owned",
  items: [
    {
      locationId,
      code: "STORAGE-A",
      kind: "storage",
      status: "blocked",
      capabilities: [],
      recordedLoads: 2,
      stockRecords: 1,
      binding: null,
    },
  ],
};
it("keeps unknown and incomplete Home evidence ahead of safe exact investigation", () => {
  render(<Home home={home} summary={null} warehouseId="scope" />);
  for (const text of [
    "homeReason_unknown_task",
    "homeNext_review_exception",
    "homeCoverageNotice",
    "serviceUnavailable",
  ])
    expect(screen.getByText(text)).toBeTruthy();
  expect(screen.getByText("homeTask_unknown · unassigned")).toBeTruthy();
  for (const name of ["reviewOperationalEvidence", "openTaskDetail"]) {
    const link = screen.getByRole("link", { name });
    expect(link.getAttribute("href")).toBe(
      "/operations/tasks/task%20%2F%20unknown",
    );
    expect(link.classList.contains("swp-action-secondary")).toBe(true);
  }
  expect(screen.queryByText("noAttentionRequired")).toBeNull();
});
it("does not turn unavailable Home evidence into healthy or empty claims", () => {
  render(<Home home={null} summary={null} warehouseId="scope" />);
  expect(screen.getByText("homeStaleDescription")).toBeTruthy();
  expect(screen.queryByText("noAttentionRequired")).toBeNull();
  expect(screen.queryByText("noCurrentWork")).toBeNull();
  expect(screen.queryByText("liveData")).toBeNull();
});
it("retains unknown load balance and permission-gated exact destinations", () => {
  render(
    <Loads initialPage={loads} search="" warehouseId="scope" canViewAudit />,
  );
  expect(screen.getByText("loadInventoryUnknown")).toBeTruthy();
  expect(screen.getByText("loadsEvidenceNotice")).toBeTruthy();
  const stock = screen.getByRole("link", { name: "loadViewInventory" });
  expect(stock.getAttribute("href")).toBe(
    `/operations/inventory?loadId=${loadId}`,
  );
  expect(stock.classList.contains("swp-action-secondary")).toBe(true);
  expect(
    screen.getByRole("link", { name: /openWorkContext/ }).getAttribute("href"),
  ).toBe(`/operations/work/inbound/${receiptId}`);
  expect(
    screen
      .getByRole("link", { name: "viewReceiptAuditEvidence" })
      .getAttribute("href"),
  ).toBe(
    `/operations/audit?resourceType=InboundReceipt&resourceId=${receiptId}`,
  );
  expect(
    screen
      .getByRole("button", { name: "loadMoreLoads" })
      .classList.contains("ui-link"),
  ).toBe(false);
});
it("does not expose load history without dedicated permission", () => {
  render(
    <Loads
      initialPage={loads}
      search=""
      warehouseId="scope"
      canViewAudit={false}
    />,
  );
  expect(
    screen.queryByRole("link", { name: "viewReceiptAuditEvidence" }),
  ).toBeNull();
});
it("keeps blocked/unbound location evidence and exact stock/load investigation", () => {
  render(
    <Locations
      initialPage={locations}
      search=""
      warehouseId="scope"
      exactId={locationId}
    />,
  );
  for (const text of [
    "locationBlocked",
    "locationUnbound",
    "locationsNotice",
    "2",
    "1",
  ])
    expect(screen.getByText(text)).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "locationSearchStock" })
      .getAttribute("href"),
  ).toBe(`/operations/inventory?locationId=${locationId}`);
  expect(
    screen
      .getByRole("link", { name: "locationSearchLoads" })
      .getAttribute("href"),
  ).toBe(`/operations/loads?locationId=${locationId}`);
  expect(
    screen.getByRole("link", { name: "locationsRefresh" }).getAttribute("href"),
  ).toBe(`/operations/locations?search=&id=${locationId}`);
  expect(
    screen
      .getByRole("button", { name: "locationsMore" })
      .classList.contains("ui-link"),
  ).toBe(false);
});
