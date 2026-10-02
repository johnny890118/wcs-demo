import { describe, expect, it } from "vitest";
import { isInventoryPage } from "../../src/application/operations/inventory-projection";
const shipped = {
  inventoryUnitId: "81000000-0000-4000-8000-000000000001",
  sku: "SKU",
  quantity: 0,
  reservedQuantity: 0,
  unreservedQuantity: 0,
  status: "shipped",
  location: "STORAGE",
  locationStatus: "available",
  loadExternalId: "PALLET",
  loadLocation: "STORAGE",
  receiptId: "30000000-0000-4000-8000-000000000001",
  receiptReference: "ASN",
  updatedAt: "2026-10-03T00:00:00.000Z",
};
const page = {
  items: [shipped],
  nextCursor: null,
  generatedAt: shipped.updatedAt,
};
describe("inventory shipped historical rows", () => {
  it("accepts shipped zero-balance evidence", () =>
    expect(isInventoryPage(page)).toBe(true));
  it("rejects shipped rows presented as current stock", () =>
    expect(
      isInventoryPage({ ...page, items: [{ ...shipped, quantity: 5 }] }),
    ).toBe(false));
  it("rejects zero balance for live nonterminal stock", () =>
    expect(
      isInventoryPage({
        ...page,
        items: [{ ...shipped, status: "available" }],
      }),
    ).toBe(false));
});
