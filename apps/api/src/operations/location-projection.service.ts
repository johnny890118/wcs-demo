import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  LocationItem,
  LocationPage,
} from "../../../../src/application/operations/location-projection";
import { DATABASE_POOL } from "../database/database.module";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function invalid(): never {
  throw new BadRequestException({
    code: "INVALID_LOCATION_QUERY",
    message: "Invalid location query.",
  });
}
@Injectable()
export class LocationProjectionService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async list(
    warehouseId: string,
    query: Record<string, unknown> = {},
  ): Promise<LocationPage> {
    if (
      query.search !== undefined &&
      (typeof query.search !== "string" || query.search.length > 100)
    )
      invalid();
    const search = ((query.search ?? "") as string).trim();
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
          cursor.surface !== "locations" ||
          cursor.warehouseId !== warehouseId ||
          cursor.search !== search ||
          typeof cursor.id !== "string" ||
          !uuid.test(cursor.id)
        )
          invalid();
        after = cursor.id;
      } catch {
        invalid();
      }
    }
    type Row = Omit<LocationItem, "binding"> & {
      topologyId: string | null;
      revision: number | null;
      nodeId: string | null;
    };
    const result = await this.pool.query<Row>(
      `
      SELECT location.id AS "locationId", location.code, location.kind, location.status, location.capabilities,
        (SELECT count(*)::integer FROM loads load JOIN inbound_receipts receipt ON receipt.id = load.receipt_id AND receipt.warehouse_id = $1 WHERE load.current_location_id = location.id) AS "recordedLoads",
        (SELECT count(*)::integer FROM inventory_units inventory JOIN loads load ON load.id = inventory.load_id JOIN locations load_location ON load_location.id = load.current_location_id AND load_location.warehouse_id = $1 JOIN inbound_receipts receipt ON receipt.id = load.receipt_id AND receipt.warehouse_id = $1 WHERE inventory.location_id = location.id AND inventory.status <> 'shipped') AS "stockRecords",
        topology.id AS "topologyId", topology.revision, binding.node_id AS "nodeId"
      FROM locations location
      LEFT JOIN warehouse_topologies topology ON topology.warehouse_id = location.warehouse_id AND topology.status = 'active'
      LEFT JOIN location_topology_bindings binding ON binding.location_id = location.id AND binding.warehouse_id = $1 AND binding.topology_id = topology.id AND binding.topology_revision = topology.revision
      WHERE location.warehouse_id = $1 AND ($2::uuid IS NULL OR location.id > $2::uuid) AND ($3::text = '' OR strpos(lower(location.code),lower($3)) > 0 OR strpos(lower(location.kind),lower($3)) > 0)
      ORDER BY location.id LIMIT $4`,
      [warehouseId, after, search, limit + 1],
    );
    const rows = result.rows.slice(0, limit);
    const last = rows.at(-1);
    return {
      items: rows.map((row) => ({
        locationId: row.locationId,
        code: row.code,
        kind: row.kind,
        status: row.status,
        capabilities: row.capabilities,
        recordedLoads: row.recordedLoads,
        stockRecords: row.stockRecords,
        binding:
          row.topologyId !== null &&
          row.revision !== null &&
          row.nodeId !== null
            ? {
                topologyId: row.topologyId,
                revision: row.revision,
                nodeId: row.nodeId,
              }
            : null,
      })),
      nextCursor:
        result.rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                surface: "locations",
                warehouseId,
                search,
                id: last.locationId,
              }),
            ).toString("base64url")
          : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
