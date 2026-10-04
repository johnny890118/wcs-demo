import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  InventoryItem,
  InventoryPage,
} from "../../../../src/application/operations/inventory-projection";
import { DATABASE_POOL } from "../database/database.module";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function invalid(): never {
  throw new BadRequestException({
    code: "INVALID_INVENTORY_QUERY",
    message: "Invalid inventory query.",
  });
}
@Injectable()
export class InventoryProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async list(
    warehouseId: string,
    query: Record<string, unknown> = {},
  ): Promise<InventoryPage> {
    if (
      query.search !== undefined &&
      (typeof query.search !== "string" || query.search.length > 100)
    )
      invalid();
    const search = ((query.search ?? "") as string).trim();
    if (
      query.id !== undefined &&
      (typeof query.id !== "string" || !uuid.test(query.id))
    )
      invalid();
    const exactId =
      typeof query.id === "string" ? query.id.toLowerCase() : null;
    for (const key of ["loadId", "locationId"])
      if (
        query[key] !== undefined &&
        (typeof query[key] !== "string" || !uuid.test(query[key] as string))
      )
        invalid();
    const loadId =
      typeof query.loadId === "string" ? query.loadId.toLowerCase() : null;
    const locationId =
      typeof query.locationId === "string"
        ? query.locationId.toLowerCase()
        : null;
    const limit =
      query.limit === undefined
        ? 50
        : typeof query.limit === "string" && /^\d+$/.test(query.limit)
          ? Number(query.limit)
          : query.limit;
    if (
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      invalid();
    let after: string | null = null;
    if (query.cursor !== undefined) {
      if (
        typeof query.cursor !== "string" ||
        query.cursor.length > 1000 ||
        !/^[A-Za-z0-9_-]+$/.test(query.cursor)
      )
        invalid();
      try {
        const cursor = JSON.parse(
          Buffer.from(query.cursor, "base64url").toString("utf8"),
        );
        if (
          cursor.warehouseId !== warehouseId ||
          cursor.search !== search ||
          (cursor.exactId ?? null) !== exactId ||
          (cursor.loadId ?? null) !== loadId ||
          (cursor.locationId ?? null) !== locationId ||
          typeof cursor.id !== "string" ||
          !uuid.test(cursor.id)
        )
          invalid();
        after = cursor.id;
      } catch {
        invalid();
      }
    }
    const result = await this.pool.query<
      Omit<InventoryItem, "updatedAt"> & { updatedAt: Date }
    >(
      `
      SELECT inventory.id AS "inventoryUnitId", inventory.sku,
        CASE WHEN inventory.status = 'shipped' THEN 0 ELSE inventory.quantity END AS quantity,
        COALESCE(reservation.quantity, 0)::integer AS "reservedQuantity",
        CASE WHEN inventory.status = 'available' THEN GREATEST(0, inventory.quantity - COALESCE(reservation.quantity, 0)) ELSE 0 END::integer AS "unreservedQuantity",
        inventory.status, location.code AS location, location.status AS "locationStatus",
        load.external_id AS "loadExternalId", load_location.code AS "loadLocation",
        receipt.id AS "receiptId", receipt.external_reference AS "receiptReference", inventory.updated_at AS "updatedAt"
      FROM inventory_units inventory
      JOIN locations location ON location.id = inventory.location_id AND location.warehouse_id = $1
      JOIN loads load ON load.id = inventory.load_id
      JOIN locations load_location ON load_location.id = load.current_location_id AND load_location.warehouse_id = $1
      JOIN inbound_receipts receipt ON receipt.id = load.receipt_id AND receipt.warehouse_id = $1
      LEFT JOIN LATERAL (SELECT sum(allocation.quantity) AS quantity FROM inventory_allocations allocation WHERE allocation.inventory_unit_id = inventory.id AND allocation.status = 'reserved') reservation ON true
      WHERE ($2::uuid IS NULL OR inventory.id > $2::uuid)
        AND ($5::uuid IS NULL OR inventory.id = $5::uuid)
        AND ($6::uuid IS NULL OR load.id = $6::uuid)
        AND ($7::uuid IS NULL OR location.id = $7::uuid)
        AND ($3::text = '' OR strpos(lower(inventory.sku), lower($3)) > 0 OR strpos(lower(load.external_id), lower($3)) > 0 OR strpos(lower(location.code), lower($3)) > 0)
      ORDER BY inventory.id LIMIT $4`,
      [warehouseId, after, search, limit + 1, exactId, loadId, locationId],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      items: rows.map((row) => ({
        ...row,
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextCursor:
        result.rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                warehouseId,
                search,
                exactId,
                loadId,
                locationId,
                id: last.inventoryUnitId,
              }),
            ).toString("base64url")
          : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
