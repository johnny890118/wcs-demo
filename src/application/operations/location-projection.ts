export type LocationItem = Readonly<{
  locationId: string;
  code: string;
  kind: string;
  status: "available" | "blocked" | "disabled";
  capabilities: readonly string[];
  recordedLoads: number;
  stockRecords: number;
  binding: Readonly<{
    topologyId: string;
    revision: number;
    nodeId: string;
  }> | null;
}>;
export type LocationPage = Readonly<{
  items: readonly LocationItem[];
  nextCursor: string | null;
  generatedAt: string;
}>;
export function isLocationPage(value: unknown): value is LocationPage {
  if (!value || typeof value !== "object") return false;
  const page = value as LocationPage;
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
        uuid(item.locationId) &&
        typeof item.code === "string" &&
        typeof item.kind === "string" &&
        ["available", "blocked", "disabled"].includes(item.status) &&
        Array.isArray(item.capabilities) &&
        item.capabilities.every((v: unknown) => typeof v === "string") &&
        [item.recordedLoads, item.stockRecords].every(
          (v) => Number.isSafeInteger(v) && v >= 0,
        ) &&
        (item.binding === null ||
          (item.binding &&
            uuid(item.binding.topologyId) &&
            Number.isSafeInteger(item.binding.revision) &&
            item.binding.revision > 0 &&
            typeof item.binding.nodeId === "string")),
    ) &&
    (page.nextCursor === null || typeof page.nextCursor === "string") &&
    typeof page.generatedAt === "string" &&
    !Number.isNaN(Date.parse(page.generatedAt))
  );
}
