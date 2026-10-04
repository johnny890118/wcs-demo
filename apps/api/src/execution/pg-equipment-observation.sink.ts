import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type {
  EquipmentObservationSink,
  EquipmentObservationWrite,
} from "../../../../src/application/equipment/equipment-observation-sink";
import { DATABASE_POOL } from "../database/database.module";

@Injectable()
export class PgEquipmentObservationSink implements EquipmentObservationSink {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async publish(
    observation: EquipmentObservationWrite,
  ): Promise<"applied" | "ignored"> {
    return persistEquipmentObservation(this.pool, observation);
  }
}

/** Reusable on a leased owner's transaction connection; preserves sequence semantics. */
export async function persistEquipmentObservation(
  database: Pick<Pool, "query">,
  observation: EquipmentObservationWrite,
): Promise<"applied" | "ignored"> {
  const result = await database.query(
    `INSERT INTO equipment_observations
        (equipment_id, topology_id, topology_revision, node_id, status,
         task_id, load_id, fault_code, connection_status, quality, sequence,
         observed_at, received_at, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), $13)
       ON CONFLICT (equipment_id) DO UPDATE
       SET topology_id = EXCLUDED.topology_id,
         topology_revision = EXCLUDED.topology_revision,
         node_id = EXCLUDED.node_id,
         status = EXCLUDED.status,
         task_id = EXCLUDED.task_id,
         load_id = EXCLUDED.load_id,
         fault_code = EXCLUDED.fault_code,
         connection_status = EXCLUDED.connection_status,
         quality = EXCLUDED.quality,
         sequence = EXCLUDED.sequence,
         observed_at = EXCLUDED.observed_at,
         received_at = EXCLUDED.received_at,
         source = EXCLUDED.source
       WHERE equipment_observations.sequence < EXCLUDED.sequence
       RETURNING equipment_id`,
    [
      observation.equipmentId,
      observation.topologyId,
      observation.topologyRevision,
      observation.nodeId,
      observation.status,
      observation.taskId,
      observation.loadId,
      observation.faultCode,
      observation.connectionStatus,
      observation.quality,
      observation.sequence,
      observation.observedAt,
      observation.source,
    ],
  );
  return result.rowCount === 1 ? "applied" : "ignored";
}
