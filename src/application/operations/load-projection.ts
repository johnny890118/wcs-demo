export type LoadItem = Readonly<{
  loadId: string;
  externalId: string;
  sku: string;
  receivedQuantity: number;
  status: "received" | "in_transit" | "stored";
  location: string;
  receiptId: string;
  receiptReference: string;
  inventory: Readonly<{
    quantity: number;
    status: "available" | "reserved" | "quarantined" | "shipped";
    location: string;
  }> | null;
  updatedAt: string;
}>;
export type LoadPage = Readonly<{
  items: readonly LoadItem[];
  nextCursor: string | null;
  generatedAt: string;
}>;

export function isLoadPage(value: unknown): value is LoadPage {
  if (!value || typeof value !== "object") return false;
  const page = value as LoadPage;
  const uuid = (v: unknown) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    );
  return (
    Array.isArray(page.items) &&
    page.items.every(
      (item) =>
        item &&
        uuid(item.loadId) &&
        uuid(item.receiptId) &&
        [item.externalId, item.sku, item.location, item.receiptReference].every(
          (v) => typeof v === "string",
        ) &&
        Number.isSafeInteger(item.receivedQuantity) &&
        item.receivedQuantity > 0 &&
        ["received", "in_transit", "stored"].includes(item.status) &&
        typeof item.updatedAt === "string" &&
        !Number.isNaN(Date.parse(item.updatedAt)) &&
        (item.inventory === null ||
          (item.inventory &&
            Number.isSafeInteger(item.inventory.quantity) &&
            item.inventory.quantity >= 0 &&
            ["available", "reserved", "quarantined", "shipped"].includes(
              item.inventory.status,
            ) &&
            typeof item.inventory.location === "string" &&
            (item.inventory.status === "shipped"
              ? item.inventory.quantity === 0
              : item.inventory.quantity > 0))),
    ) &&
    (page.nextCursor === null || typeof page.nextCursor === "string") &&
    typeof page.generatedAt === "string" &&
    !Number.isNaN(Date.parse(page.generatedAt))
  );
}
