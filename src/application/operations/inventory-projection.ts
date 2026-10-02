export type InventoryItem = Readonly<{
  inventoryUnitId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  unreservedQuantity: number;
  status: "available" | "reserved" | "quarantined" | "shipped";
  location: string;
  locationStatus: "available" | "blocked" | "disabled";
  loadExternalId: string;
  loadLocation: string;
  receiptId: string;
  receiptReference: string;
  updatedAt: string;
}>;
export type InventoryPage = Readonly<{
  items: readonly InventoryItem[];
  nextCursor: string | null;
  generatedAt: string;
}>;
export type InventoryQuery = Readonly<{
  search?: string;
  cursor?: string;
  limit?: number;
}>;
export function isInventoryPage(value: unknown): value is InventoryPage {
  if (!value || typeof value !== "object") return false;
  const v = value as InventoryPage;
  const uuid = (id: unknown) =>
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  return (
    Array.isArray(v.items) &&
    v.items.every(
      (item: InventoryItem) =>
        item &&
        uuid(item.inventoryUnitId) &&
        uuid(item.receiptId) &&
        [
          item.sku,
          item.location,
          item.loadExternalId,
          item.loadLocation,
          item.receiptReference,
        ].every((x) => typeof x === "string") &&
        [item.quantity, item.reservedQuantity, item.unreservedQuantity].every(
          (x) => Number.isSafeInteger(x) && x >= 0,
        ) &&
        (item.status === "shipped" ? item.quantity === 0 : item.quantity > 0) &&
        ["available", "reserved", "quarantined", "shipped"].includes(
          item.status,
        ) &&
        ["available", "blocked", "disabled"].includes(item.locationStatus) &&
        typeof item.updatedAt === "string" &&
        !Number.isNaN(Date.parse(item.updatedAt)),
    ) &&
    (v.nextCursor === null || typeof v.nextCursor === "string") &&
    typeof v.generatedAt === "string" &&
    !Number.isNaN(Date.parse(v.generatedAt))
  );
}
