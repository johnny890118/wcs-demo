import { describe, expect, it } from "vitest";
import { isLoadPage } from "../../src/application/operations/load-projection";
const item = {
  loadId: "41000000-0000-4000-8000-000000000001",
  externalId: "PALLET",
  sku: "SKU",
  receivedQuantity: 24,
  status: "received",
  location: "RECEIVING",
  receiptId: "30000000-0000-4000-8000-000000000001",
  receiptReference: "ASN",
  inventory: null,
  updatedAt: "2026-10-03T00:00:00.000Z",
};
const page = { items: [item], nextCursor: null, generatedAt: item.updatedAt };
describe("load browser projection contract", () => {
  it("allows unrecorded stock without inventing a zero", () =>
    expect(isLoadPage(page)).toBe(true));
  it("allows shipped zero stock independently of received quantity", () =>
    expect(
      isLoadPage({
        ...page,
        items: [
          {
            ...item,
            inventory: { quantity: 0, status: "shipped", location: "STORAGE" },
          },
        ],
      }),
    ).toBe(true));
  it.each([
    {},
    { quantity: 0, status: "available", location: "STORAGE" },
    { quantity: 24, status: "shipped", location: "STORAGE" },
  ])("rejects malformed stock %j", (inventory) =>
    expect(isLoadPage({ ...page, items: [{ ...item, inventory }] })).toBe(
      false,
    ),
  );
});
