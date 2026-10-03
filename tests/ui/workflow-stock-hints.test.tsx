// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OutboundWorkflowPanel } from "../../components/platform/OutboundWorkflowPanel";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
vi.mock("../../src/ui/i18n/locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);
const details: OperationsDetails = {
  generatedAt: "2026-10-03T00:00:00Z",
  equipment: [],
  locations: [],
  alarms: [],
  tasks: [],
  topology: null,
  inventory: [
    {
      inventoryUnitId: "one",
      sku: "SKU-A",
      quantity: 999,
      location: "Stock",
      status: "available",
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      inventoryUnitId: "two",
      sku: "SKU-A",
      quantity: 10,
      location: "Stock",
      status: "available",
      updatedAt: "2026-10-03T00:00:00Z",
    },
    {
      inventoryUnitId: "three",
      sku: "SKU-SHIPPED",
      quantity: 5,
      location: "Shipping",
      status: "shipped",
      updatedAt: "2026-10-03T00:00:00Z",
    },
  ],
};
it("deduplicates recorded SKU hints without asserting raw quantities or a false availability ceiling", () => {
  render(
    <OutboundWorkflowPanel
      details={details}
      canCreate
      canExecute={false}
      canViewAudit={false}
    />,
  );
  expect(screen.getAllByRole("option", { name: "SKU-A" })).toHaveLength(1);
  expect(
    screen.queryByRole("option", { name: /999|1009|SKU-SHIPPED/ }),
  ).toBeNull();
  expect(screen.getByLabelText("quantity").getAttribute("max")).toBeNull();
  expect(screen.getByText("outboundStockHintNotice")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: /inspectRecordedStock/ })
      .getAttribute("href"),
  ).toBe("/operations/inventory?search=SKU-A");
  expect(
    screen
      .getByRole("button", { name: "createOutbound" })
      .getAttribute("disabled"),
  ).not.toBeNull();
});
