import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type { OperationsSummary } from "../../../../src/application/operations/operations-summary";
import { DATABASE_POOL } from "../database/database.module";

type CountRow = {
  active_tasks: number;
  stored_inventory: number;
  open_receipts: number;
  configured_equipment: number;
};

type TopologyRow = { id: string; revision: number };

type TaskRow = {
  id: string;
  status: string;
  source_location_id: string;
  destination_location_id: string;
  equipment_id: string | null;
  updated_at: Date;
};

@Injectable()
export class OperationsSummaryService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getSummary(): Promise<OperationsSummary> {
    const [counts, topology, tasks] = await Promise.all([
      this.pool.query<CountRow>(
        `SELECT
          (SELECT count(*)::integer FROM transport_tasks WHERE status IN ('assigned', 'in_progress', 'blocked', 'unknown')) AS active_tasks,
          (SELECT count(*)::integer FROM inventory_units WHERE status = 'available') AS stored_inventory,
          (SELECT count(*)::integer FROM inbound_receipts WHERE status IN ('requested', 'in_progress')) AS open_receipts,
          (SELECT count(*)::integer FROM equipment_descriptors WHERE active = true) AS configured_equipment`,
      ),
      this.pool.query<TopologyRow>(
        `SELECT id, revision
         FROM warehouse_topologies
         WHERE status = 'active'
         ORDER BY activated_at DESC NULLS LAST, revision DESC
         LIMIT 1`,
      ),
      this.pool.query<TaskRow>(
        `SELECT id, status, source_location_id, destination_location_id,
          equipment_id, updated_at
         FROM transport_tasks
         ORDER BY updated_at DESC, id
         LIMIT 5`,
      ),
    ]);

    const count = counts.rows[0];
    if (!count) throw new Error("Operations count projection returned no row.");
    const activeTopology = topology.rows[0];

    return {
      counts: {
        activeTasks: count.active_tasks,
        storedInventory: count.stored_inventory,
        openReceipts: count.open_receipts,
        configuredEquipment: count.configured_equipment,
      },
      topology: activeTopology
        ? { topologyId: activeTopology.id, revision: activeTopology.revision }
        : null,
      recentTasks: tasks.rows.map((task) => ({
        taskId: task.id,
        status: task.status,
        sourceLocationId: task.source_location_id,
        destinationLocationId: task.destination_location_id,
        equipmentId: task.equipment_id,
        updatedAt: task.updated_at.toISOString(),
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}
