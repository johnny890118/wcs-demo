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
