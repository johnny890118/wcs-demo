import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  LoadItem,
  LoadPage,
} from "../../../../src/application/operations/load-projection";
import { DATABASE_POOL } from "../database/database.module";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function invalid(): never {
  throw new BadRequestException({
    code: "INVALID_LOAD_QUERY",
    message: "Invalid load query.",
  });
}
@Injectable()
export class LoadProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async list(
    warehouseId: string,
    query: Record<string, unknown> = {},
  ): Promise<LoadPage> {
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
    if (
      query.locationId !== undefined &&
      (typeof query.locationId !== "string" || !uuid.test(query.locationId))
    )
      invalid();
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
          cursor.surface !== "loads" ||
          cursor.warehouseId !== warehouseId ||
          cursor.search !== search ||
          (cursor.exactId ?? null) !== exactId ||
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
    type Row = Omit<LoadItem, "inventory" | "updatedAt"> & {
      inventoryQuantity: number | null;
      inventoryStatus: NonNullable<LoadItem["inventory"]>["status"] | null;
      inventoryLocation: string | null;
      updatedAt: Date;
    };
    const result = await this.pool.query<Row>(
      `
      SELECT load.id AS "loadId", load.external_id AS "externalId", load.sku,
        load.quantity AS "receivedQuantity", load.status, location.code AS location,
        receipt.id AS "receiptId", receipt.external_reference AS "receiptReference",
        CASE WHEN inventory.status = 'shipped' THEN 0 ELSE inventory.quantity END AS "inventoryQuantity", inventory.status AS "inventoryStatus",
        inventory_location.code AS "inventoryLocation", load.updated_at AS "updatedAt"
      FROM loads load
      JOIN locations location ON location.id = load.current_location_id AND location.warehouse_id = $1
      JOIN inbound_receipts receipt ON receipt.id = load.receipt_id AND receipt.warehouse_id = $1
      LEFT JOIN inventory_units inventory ON inventory.load_id = load.id
      LEFT JOIN locations inventory_location ON inventory_location.id = inventory.location_id AND inventory_location.warehouse_id = $1
      WHERE (inventory.id IS NULL OR inventory_location.id IS NOT NULL)
        AND ($5::uuid IS NULL OR load.id = $5::uuid)
        AND ($6::uuid IS NULL OR location.id = $6::uuid)
        AND ($2::uuid IS NULL OR load.id > $2::uuid)
        AND ($3::text = '' OR strpos(lower(load.sku),lower($3)) > 0 OR strpos(lower(load.external_id),lower($3)) > 0 OR strpos(lower(location.code),lower($3)) > 0)
      ORDER BY load.id LIMIT $4`,
      [warehouseId, after, search, limit + 1, exactId, locationId],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      items: rows.map((row) => ({
        loadId: row.loadId,
        externalId: row.externalId,
        sku: row.sku,
        receivedQuantity: row.receivedQuantity,
        status: row.status,
        location: row.location,
        receiptId: row.receiptId,
        receiptReference: row.receiptReference,
        inventory:
          row.inventoryQuantity === null
            ? null
            : {
                quantity: row.inventoryQuantity,
                status: row.inventoryStatus!,
                location: row.inventoryLocation!,
              },
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextCursor:
        result.rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                surface: "loads",
                warehouseId,
                search,
                exactId,
                locationId,
                id: last.loadId,
              }),
            ).toString("base64url")
          : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
