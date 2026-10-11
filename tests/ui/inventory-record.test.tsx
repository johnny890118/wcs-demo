// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import Inventory from "../../pages/operations/inventory";
import type { InventoryPage } from "../../src/application/operations/inventory-projection";
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../components/platform/OperationsShell", () => ({
  OperationsShell: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);
const page: InventoryPage = {
  generatedAt: "2026-10-11T00:00:00Z",
  nextCursor: "owned-cursor",
  items: [
    {
      inventoryUnitId: "10000000-0000-4000-8000-000000000001",
      sku: "SKU-A",
      quantity: 24,
      reservedQuantity: 10,
      unreservedQuantity: 14,
      status: "available",
      location: "Stock",
      locationStatus: "blocked",
      loadExternalId: "PALLET-A",
      loadLocation: "Receiving",
      receiptId: "30000000-0000-4000-8000-000000000001",
      receiptReference: "RECEIPT-A",
      updatedAt: "2026-10-11T00:00:00Z",
    },
  ],
};
it("preserves qualified quantities, discrepancy warning and exact Work/history destinations", () => {
  render(
    <Inventory initialPage={page} search="" warehouseId="scope" canViewAudit />,
  );
  for (const text of [
    "24",
    "10",
    "14",
    "inventoryStateAvailable",
    "inventoryReviewRequired",
    "inventoryQuantityNotice",
  ])
    expect(screen.getByText(text)).toBeTruthy();
  const work = screen.getByRole("link", { name: /openWorkContext/ });
  expect(work.getAttribute("href")).toBe(
    "/operations/work/inbound/30000000-0000-4000-8000-000000000001",
  );
  expect(work.classList.contains("swp-action-secondary")).toBe(true);
  const history = screen.getByRole("link", {
    name: "viewReceiptAuditEvidence",
  });
  expect(history.getAttribute("href")).toBe(
    "/operations/audit?resourceType=InboundReceipt&resourceId=30000000-0000-4000-8000-000000000001",
  );
  expect(history.classList.contains("swp-action-ghost")).toBe(true);
  expect(
    screen
      .getByRole("button", { name: "inventoryLoadMore" })
      .classList.contains("ui-link"),
  ).toBe(false);
});
it("does not expose audit navigation without dedicated permission", () => {
  render(
    <Inventory
      initialPage={page}
      search=""
      warehouseId="scope"
      canViewAudit={false}
    />,
  );
  expect(
    screen.queryByRole("link", { name: "viewReceiptAuditEvidence" }),
  ).toBeNull();
  expect(screen.getByRole("link", { name: /openWorkContext/ })).toBeTruthy();
});
it("retains exact location return and filters across refresh without widening search", () => {
  const locationId = "20000000-0000-4000-8000-000000000001";
  render(
    <Inventory
      initialPage={page}
      search="SKU-A"
      warehouseId="scope"
      canViewAudit={false}
      exactFilters={{ locationId }}
    />,
  );
  expect(
    screen
      .getByRole("link", { name: "exactContextReturnRecord" })
      .getAttribute("href"),
  ).toBe(`/operations/locations?id=${locationId}`);
  expect(
    screen.getByRole("link", { name: "inventoryRefresh" }).getAttribute("href"),
  ).toBe(`/operations/inventory?search=SKU-A&locationId=${locationId}`);
});
it("does not present an unavailable projection as empty inventory", () => {
  render(
    <Inventory
      initialPage={null}
      search=""
      warehouseId="scope"
      canViewAudit={false}
    />,
  );
  expect(screen.getByRole("alert").textContent).toBe("inventoryUnavailable");
  expect(screen.queryByText("inventoryEmpty")).toBeNull();
});
