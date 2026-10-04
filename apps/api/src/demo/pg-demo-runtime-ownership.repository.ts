import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { OperationalRuntime } from "../../../../src/application/access/operational-access";
import {
  DemoRuntimeError,
  requireDemoRuntimeIdentity,
  requireDemoRuntimePolicy,
  type DemoRuntimeLease,
  type DemoRuntimePolicy,
  type DemoRuntimeOwnershipRepository,
} from "../../../../src/application/demo/demo-runtime-ownership";
import type {
  EquipmentObservationSink,
  EquipmentObservationWrite,
} from "../../../../src/application/equipment/equipment-observation-sink";
import { persistEquipmentObservation } from "../execution/pg-equipment-observation.sink";
import { equipmentObservationFreshAfterMs } from "../../../../src/application/equipment/observation-freshness";

type Owner = {
  session_id: string;
  warehouse_id: string;
  lease_token: string;
  generation: number;
  state: "initializing" | "active" | "unknown";
  lease_expires_at: Date;
};
function lease(row: Owner): DemoRuntimeLease {
  return {
    sessionId: row.session_id,
    warehouseId: row.warehouse_id,
    token: row.lease_token,
    generation: row.generation,
    state: row.state,
    expiresAt: row.lease_expires_at.toISOString(),
  };
}
/** Trusted persistence boundary only; no NestJS/HTTP/worker registration. */
export class PgDemoRuntimeOwnershipRepository
  implements DemoRuntimeOwnershipRepository
{
  private readonly policy: DemoRuntimePolicy;
  constructor(
    private readonly pool: Pool,
    runtime: OperationalRuntime,
    policy: DemoRuntimePolicy,
  ) {
    requireDemoRuntimePolicy(runtime, policy);
    this.policy = { ...policy };
  }
  private async transaction<T>(
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      await client.query("SELECT pg_advisory_xact_lock($1)", [870_041_003]);
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async claim(sessionId: string): Promise<DemoRuntimeLease> {
    requireDemoRuntimeIdentity(sessionId);
    sessionId = sessionId.toLowerCase();
    return this.transaction(async (client) => {
      const scope = await client.query<{
        workspace_warehouse_id: string;
        expires_at: Date;
      }>(
        `SELECT workspace.workspace_warehouse_id,reservation.expires_at
         FROM demo_session_reservations reservation JOIN demo_reference_workspaces workspace USING(session_id)
         WHERE reservation.session_id=$1 AND reservation.state='provisioning'
           AND reservation.expires_at>clock_timestamp() FOR UPDATE OF reservation,workspace`,
        [sessionId],
      );
      if (!scope.rowCount) throw new DemoRuntimeError("UNAVAILABLE");
      const previous = await client.query<Owner & { fresh: boolean }>(
        "SELECT *,lease_expires_at>clock_timestamp() AS fresh FROM demo_simulator_runtime_owners WHERE session_id=$1 FOR UPDATE",
        [sessionId],
      );
      if (previous.rows[0]?.fresh) throw new DemoRuntimeError("BUSY");
      const warehouseId = scope.rows[0].workspace_warehouse_id;
      if (!previous.rowCount) {
        const observations = await client.query(
          "SELECT equipment_id FROM equipment_observations WHERE equipment_id IN (SELECT equipment_id FROM equipment_descriptors WHERE warehouse_id=$1) LIMIT 1",
          [warehouseId],
        );
        if (observations.rowCount) throw new DemoRuntimeError("UNAVAILABLE");
      }
      const result = await client.query<Owner>(
        `INSERT INTO demo_simulator_runtime_owners(session_id,warehouse_id,lease_token,lease_expires_at,generation,state)
         VALUES($1,$2,$3,LEAST(clock_timestamp()+$4::integer*interval '1 second',$5),1,'initializing')
         ON CONFLICT(session_id) DO UPDATE SET lease_token=EXCLUDED.lease_token,
           lease_expires_at=EXCLUDED.lease_expires_at,generation=demo_simulator_runtime_owners.generation+1,state='unknown'
         RETURNING *`,
        [
          sessionId,
          warehouseId,
          randomUUID(),
          this.policy.leaseSeconds,
          scope.rows[0].expires_at,
        ],
      );
      const row = result.rows[0];
      await client.query(
        `INSERT INTO demo_simulator_owner_generations(session_id,generation,lease_token,initial_state,initial_lease_expires_at)
        VALUES($1,$2,$3,$4,$5)`,
        [
          sessionId,
          row.generation,
          row.lease_token,
          row.state,
          row.lease_expires_at,
        ],
      );
      if (!previous.rowCount)
        await client.query(
          "INSERT INTO demo_session_control_events(id,session_id,action,actor_type,actor_id) VALUES($1,$2,'demo_session.runtime_claimed','system','demo-simulator')",
          [randomUUID(), sessionId],
        );
      const stillFresh = await client.query(
        `SELECT owner.session_id FROM demo_simulator_runtime_owners owner
        JOIN demo_session_reservations reservation USING(session_id) WHERE owner.session_id=$1 AND owner.lease_token=$2
        AND owner.lease_expires_at>clock_timestamp() AND reservation.expires_at>clock_timestamp()
        AND reservation.state='provisioning'`,
        [sessionId, row.lease_token],
      );
      if (!stillFresh.rowCount) throw new DemoRuntimeError("FENCED");
      return lease(row);
    });
  }
  private identity(input: DemoRuntimeLease): DemoRuntimeLease {
    const value = { ...input };
    for (const id of [value.sessionId, value.warehouseId, value.token])
      requireDemoRuntimeIdentity(id);
    return {
      ...value,
      sessionId: value.sessionId.toLowerCase(),
      warehouseId: value.warehouseId.toLowerCase(),
      token: value.token.toLowerCase(),
    };
  }
  private async requireCurrent(
    client: PoolClient,
    value: DemoRuntimeLease,
  ): Promise<Owner> {
    const current = await client.query<Owner>(
      `SELECT owner.* FROM demo_simulator_runtime_owners owner JOIN demo_session_reservations reservation USING(session_id)
       WHERE owner.session_id=$1 AND owner.warehouse_id=$2 AND owner.lease_token=$3
         AND owner.state IN ('initializing','active') AND owner.lease_expires_at>clock_timestamp()
         AND reservation.state='provisioning' AND reservation.expires_at>clock_timestamp() FOR UPDATE OF owner,reservation`,
      [value.sessionId, value.warehouseId, value.token],
    );
    if (!current.rowCount) throw new DemoRuntimeError("FENCED");
    return current.rows[0];
  }
  async renew(input: DemoRuntimeLease): Promise<DemoRuntimeLease> {
    const value = this.identity(input);
    return this.transaction(async (client) => {
      await this.requireCurrent(client, value);
      const result = await client.query<Owner>(
        `UPDATE demo_simulator_runtime_owners owner SET lease_expires_at=LEAST(clock_timestamp()+$2::integer*interval '1 second',reservation.expires_at)
         FROM demo_session_reservations reservation WHERE owner.session_id=$1 AND reservation.session_id=owner.session_id RETURNING owner.*`,
        [value.sessionId, this.policy.leaseSeconds],
      );
      await this.requireCurrent(client, value);
      return lease(result.rows[0]);
    });
  }
  async activate(input: DemoRuntimeLease): Promise<DemoRuntimeLease> {
    const value = this.identity(input);
    return this.transaction(async (client) => {
      const owner = await this.requireCurrent(client, value);
      if (owner.state === "active") return lease(owner);
      await client.query("SELECT id FROM warehouses WHERE id=$1 FOR UPDATE", [
        value.warehouseId,
      ]);
      const metadata = await client.query<{
        reference_map: { equipment: Record<string, string> };
        workspace_topology_id: string;
        workspace_topology_revision: number;
      }>(
        "SELECT reference_map,workspace_topology_id,workspace_topology_revision FROM demo_reference_workspaces WHERE session_id=$1 FOR UPDATE",
        [value.sessionId],
      );
      const equipment = await client.query<{
        equipment_id: string;
        active: boolean;
        adapter_key: string;
        constraints: Record<string, unknown>;
      }>(
        "SELECT equipment_id,active,adapter_key,constraints FROM equipment_descriptors WHERE warehouse_id=$1 FOR UPDATE",
        [value.warehouseId],
      );
      const expected = Object.values(metadata.rows[0].reference_map.equipment);
      if (
        !equipment.rowCount ||
        equipment.rows.length !== expected.length ||
        new Set(expected).size !== expected.length ||
        equipment.rows.some(
          (row) =>
            !expected.includes(row.equipment_id) ||
            row.active ||
            row.adapter_key !== "simulator.mobile-transport" ||
            Object.keys(row.constraints).length,
        )
      )
        throw new DemoRuntimeError("UNAVAILABLE");
      const proof = await client.query<{ ready: boolean }>(
        `SELECT NOT EXISTS(SELECT 1 FROM equipment_descriptors equipment LEFT JOIN equipment_observations observation USING(equipment_id)
          WHERE equipment.warehouse_id=$1 AND (observation.equipment_id IS NULL OR observation.status<>'offline'
            OR observation.connection_status<>'connected' OR observation.quality<>'good'
            OR observation.node_id IS NOT NULL OR observation.task_id IS NOT NULL OR observation.load_id IS NOT NULL
            OR observation.fault_code IS NOT NULL OR observation.topology_id IS NOT NULL OR observation.topology_revision IS NOT NULL
            OR observation.observed_at>clock_timestamp() OR observation.received_at>clock_timestamp()
            OR observation.observed_at<=clock_timestamp()-$4::integer*interval '1 millisecond'
            OR observation.received_at<=clock_timestamp()-$4::integer*interval '1 millisecond'))
         AND NOT EXISTS(SELECT 1 FROM warehouse_access_assignments WHERE warehouse_id=$1)
         AND NOT EXISTS(SELECT 1 FROM inbound_receipts WHERE warehouse_id=$1)
         AND NOT EXISTS(SELECT 1 FROM outbound_orders WHERE warehouse_id=$1)
         AND NOT EXISTS(SELECT 1 FROM audit_events WHERE warehouse_id=$1)
         AND EXISTS(SELECT 1 FROM warehouse_topologies WHERE warehouse_id=$1 AND id=$2 AND revision=$3 AND status='active') AS ready`,
        [
          value.warehouseId,
          metadata.rows[0].workspace_topology_id,
          metadata.rows[0].workspace_topology_revision,
          equipmentObservationFreshAfterMs,
        ],
      );
      if (!proof.rows[0].ready) throw new DemoRuntimeError("UNAVAILABLE");
      await client.query(
        "UPDATE equipment_descriptors SET active=true WHERE warehouse_id=$1",
        [value.warehouseId],
      );
      const result = await client.query<Owner>(
        "UPDATE demo_simulator_runtime_owners SET state='active',activated_at=clock_timestamp() WHERE session_id=$1 RETURNING *",
        [value.sessionId],
      );
      await client.query(
        "INSERT INTO demo_session_control_events(id,session_id,action,actor_type,actor_id) VALUES($1,$2,'demo_session.runtime_activated','system','demo-simulator')",
        [randomUUID(), value.sessionId],
      );
      const stillReady = await client.query(
        `SELECT equipment.equipment_id FROM equipment_descriptors equipment JOIN equipment_observations observation USING(equipment_id)
         WHERE equipment.warehouse_id=$1 AND observation.observed_at<=clock_timestamp()
         AND observation.received_at<=clock_timestamp()
         AND observation.observed_at>clock_timestamp()-$2::integer*interval '1 millisecond'
         AND observation.received_at>clock_timestamp()-$2::integer*interval '1 millisecond'`,
        [value.warehouseId, equipmentObservationFreshAfterMs],
      );
      if (stillReady.rowCount !== expected.length)
        throw new DemoRuntimeError("UNAVAILABLE");
      await this.requireCurrent(client, value);
      return lease(result.rows[0]);
    });
  }
  observationSink(input: DemoRuntimeLease): EquipmentObservationSink {
    const value = this.identity(input);
    return { publish: (observation) => this.publish(value, observation) };
  }
  private async publish(
    value: DemoRuntimeLease,
    input: EquipmentObservationWrite,
  ): Promise<"applied" | "ignored"> {
    const observation = structuredClone(input);
    if (
      new TextEncoder().encode(JSON.stringify(observation)).length > 2048 ||
      !Number.isSafeInteger(observation.sequence) ||
      observation.sequence < 0 ||
      Number.isNaN(observation.observedAt.getTime())
    )
      throw new DemoRuntimeError("INVALID");
    return this.transaction(async (client) => {
      const owner = await this.requireCurrent(client, value);
      const fresh = await client.query<{ fresh: boolean }>(
        "SELECT $1::timestamptz<=clock_timestamp() AND $1::timestamptz>clock_timestamp()-$2::integer*interval '1 millisecond' AS fresh",
        [observation.observedAt, equipmentObservationFreshAfterMs],
      );
      if (!fresh.rows[0].fresh) throw new DemoRuntimeError("INVALID");
      const scope = await client.query(
        `SELECT equipment.equipment_id FROM equipment_descriptors equipment JOIN demo_reference_workspaces workspace
           ON workspace.workspace_warehouse_id=equipment.warehouse_id
         WHERE workspace.session_id=$1 AND equipment.equipment_id=$2 AND equipment.warehouse_id=$3
           AND (( $4::text IS NULL AND $5::uuid IS NULL AND $6::integer IS NULL)
             OR ($4::text IS NOT NULL AND $5::uuid=workspace.workspace_topology_id AND $6::integer=workspace.workspace_topology_revision
               AND EXISTS(SELECT 1 FROM topology_nodes WHERE topology_id=$5 AND topology_revision=$6 AND node_id=$4)))`,
        [
          value.sessionId,
          observation.equipmentId,
          value.warehouseId,
          observation.nodeId,
          observation.topologyId,
          observation.topologyRevision,
        ],
      );
      if (!scope.rowCount) throw new DemoRuntimeError("INVALID");
      if (
        owner.state === "initializing" &&
        (observation.status !== "offline" ||
          observation.nodeId !== null ||
          observation.taskId !== null ||
          observation.loadId !== null ||
          observation.faultCode !== null ||
          observation.connectionStatus !== "connected" ||
          observation.quality !== "good")
      )
        throw new DemoRuntimeError("UNAVAILABLE");
      if (observation.taskId !== null) {
        requireDemoRuntimeIdentity(observation.taskId);
        const task = await client.query(
          `SELECT task.id FROM transport_tasks task JOIN locations source ON source.id=task.source_location_id
          JOIN locations destination ON destination.id=task.destination_location_id
          LEFT JOIN inbound_receipts receipt ON receipt.id=task.receipt_id
          LEFT JOIN outbound_orders outbound ON outbound.id=task.outbound_order_id
          LEFT JOIN inventory_allocations allocation ON allocation.id=task.inventory_allocation_id AND allocation.outbound_order_id=outbound.id
          LEFT JOIN inventory_units inventory ON inventory.id=allocation.inventory_unit_id
          LEFT JOIN locations inventory_location ON inventory_location.id=inventory.location_id
          JOIN loads load ON load.id=COALESCE(task.load_id,inventory.load_id)
          JOIN inbound_receipts load_receipt ON load_receipt.id=load.receipt_id
          JOIN locations load_location ON load_location.id=load.current_location_id
          WHERE task.id=$1 AND source.warehouse_id=$2 AND destination.warehouse_id=$2
            AND ((task.receipt_id IS NOT NULL AND task.outbound_order_id IS NULL
              AND receipt.warehouse_id=$2 AND load.receipt_id=receipt.id
              AND ($3::uuid IS NULL OR load.id=$3))
              OR (task.receipt_id IS NULL AND task.load_id IS NULL AND task.outbound_order_id IS NOT NULL
              AND outbound.warehouse_id=$2 AND outbound.destination_location_id=task.destination_location_id
              AND inventory_location.warehouse_id=$2 AND load.id=inventory.load_id
              AND ($3::uuid IS NULL OR inventory.id=$3)))
            AND load_receipt.warehouse_id=$2 AND load_location.warehouse_id=$2
            `,
          [observation.taskId, value.warehouseId, observation.loadId],
        );
        if (!task.rowCount) throw new DemoRuntimeError("INVALID");
      }
      if (observation.loadId !== null) {
        requireDemoRuntimeIdentity(observation.loadId);
        const load = await client.query(
          `SELECT load.id FROM loads load JOIN locations location ON location.id=load.current_location_id
          JOIN inbound_receipts receipt ON receipt.id=load.receipt_id
          WHERE load.id=$1 AND location.warehouse_id=$2 AND receipt.warehouse_id=$2
          UNION ALL SELECT load.id FROM inventory_units inventory JOIN loads load ON load.id=inventory.load_id
          JOIN locations location ON location.id=load.current_location_id
          JOIN locations inventory_location ON inventory_location.id=inventory.location_id
          JOIN inbound_receipts receipt ON receipt.id=load.receipt_id
          JOIN inventory_allocations allocation ON allocation.inventory_unit_id=inventory.id
          JOIN transport_tasks task ON task.inventory_allocation_id=allocation.id AND task.outbound_order_id=allocation.outbound_order_id
          JOIN outbound_orders outbound ON outbound.id=task.outbound_order_id
          WHERE inventory.id=$1 AND task.id=$3 AND task.receipt_id IS NULL AND task.load_id IS NULL
          AND location.warehouse_id=$2 AND inventory_location.warehouse_id=$2 AND receipt.warehouse_id=$2 AND outbound.warehouse_id=$2`,
          [observation.loadId, value.warehouseId, observation.taskId],
        );
        if (!load.rowCount) throw new DemoRuntimeError("INVALID");
      }
      const result = await persistEquipmentObservation(client, observation);
      const stillFresh = await client.query<{ fresh: boolean }>(
        "SELECT $1::timestamptz<=clock_timestamp() AND $1::timestamptz>clock_timestamp()-$2::integer*interval '1 millisecond' AS fresh",
        [observation.observedAt, equipmentObservationFreshAfterMs],
      );
      if (!stillFresh.rows[0].fresh) throw new DemoRuntimeError("INVALID");
      await this.requireCurrent(client, value);
      return result;
    });
  }
}
