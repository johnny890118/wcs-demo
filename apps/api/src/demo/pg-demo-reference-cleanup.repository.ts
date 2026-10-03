import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { OperationalRuntime } from "../../../../src/application/access/operational-access";
import {
  DemoCleanupError,
  requireDemoCleanupIdentity,
  requireDemoCleanupPolicy,
  type DemoCleanupLease,
  type DemoCleanupPolicy,
  type DemoReferenceCleanupRepository,
} from "../../../../src/application/demo/demo-reference-cleanup";

type Job = {
  session_id: string;
  lease_token: string;
  attempt: number;
  lease_expires_at: Date;
};
type Workspace = {
  workspace_warehouse_id: string;
  workspace_topology_id: string;
  workspace_topology_revision: number;
  template_warehouse_id: string;
  reference_map: {
    locations: Record<string, string>;
    equipment: Record<string, string>;
  };
};
function sameIds(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(expected).size === expected.length &&
    actual.every((id) => expected.includes(id))
  );
}

/** Inactive references only. Not registered as an HTTP or managed worker service. */
export class PgDemoReferenceCleanupRepository
  implements DemoReferenceCleanupRepository
{
  private readonly policy: DemoCleanupPolicy;
  constructor(
    private readonly pool: Pool,
    runtime: OperationalRuntime,
    policy: DemoCleanupPolicy,
  ) {
    requireDemoCleanupPolicy(runtime, policy);
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

  async claim(sessionId: string): Promise<DemoCleanupLease> {
    requireDemoCleanupIdentity(sessionId);
    sessionId = sessionId.toLowerCase();
    return this.transaction(async (client) => {
      const eligible = await client.query(
        `SELECT session_id FROM demo_session_reservations
         WHERE session_id=$1 AND state IN ('provisioning','expired')
           AND expires_at<=clock_timestamp() FOR UPDATE`,
        [sessionId],
      );
      if (!eligible.rowCount) throw new DemoCleanupError("UNAVAILABLE");
      const result = await client.query<Job>(
        `INSERT INTO demo_reference_cleanup_jobs
          (session_id,lease_token,lease_expires_at,attempt,state)
         VALUES ($1,$2,clock_timestamp()+$3::integer*interval '1 second',1,'running')
         ON CONFLICT (session_id) DO UPDATE SET lease_token=EXCLUDED.lease_token,
           lease_expires_at=EXCLUDED.lease_expires_at,
           attempt=demo_reference_cleanup_jobs.attempt+1
         WHERE demo_reference_cleanup_jobs.state='running'
           AND demo_reference_cleanup_jobs.lease_expires_at<=clock_timestamp()
         RETURNING *`,
        [sessionId, randomUUID(), this.policy.leaseSeconds],
      );
      if (!result.rowCount) throw new DemoCleanupError("BUSY");
      const row = result.rows[0];
      return {
        sessionId: row.session_id,
        token: row.lease_token,
        attempt: row.attempt,
        expiresAt: row.lease_expires_at.toISOString(),
      };
    });
  }

  private async requireLease(
    client: PoolClient,
    sessionId: string,
    token: string,
  ): Promise<void> {
    const current = await client.query(
      `SELECT session_id FROM demo_reference_cleanup_jobs WHERE session_id=$1
       AND lease_token=$2 AND state='running' AND lease_expires_at>clock_timestamp() FOR UPDATE`,
      [sessionId, token],
    );
    if (!current.rowCount) throw new DemoCleanupError("FENCED");
  }

  async complete(lease: DemoCleanupLease): Promise<void> {
    requireDemoCleanupIdentity(lease.sessionId);
    requireDemoCleanupIdentity(lease.token);
    const sessionId = lease.sessionId.toLowerCase();
    const token = lease.token.toLowerCase();
    await this.transaction(async (client) => {
      // A completed matching attempt is an idempotent retry, never a new lease.
      const done = await client.query(
        `SELECT job.session_id FROM demo_reference_cleanup_jobs job
         JOIN demo_session_reservations reservation USING (session_id)
         JOIN demo_reference_cleanup_archives archive USING (session_id)
         WHERE job.session_id=$1 AND job.lease_token=$2 AND archive.lease_token=$2
           AND job.state='completed' AND reservation.state='closed'`,
        [sessionId, token],
      );
      if (done.rowCount) return;
      await this.requireLease(client, sessionId, token);
      const expired = await client.query(
        `SELECT session_id FROM demo_session_reservations WHERE session_id=$1
         AND state IN ('provisioning','expired') AND expires_at<=clock_timestamp() FOR UPDATE`,
        [sessionId],
      );
      if (!expired.rowCount) throw new DemoCleanupError("UNAVAILABLE");
      const metadata = await client.query<Workspace>(
        "SELECT * FROM demo_reference_workspaces WHERE session_id=$1 FOR UPDATE",
        [sessionId],
      );
      const workspace = metadata.rows[0];
      if (workspace) {
        await this.removeInactiveReferences(client, sessionId, workspace);
      } else {
        // Snapshot writes are atomic; an unexplained namespace is never deleted by code.
        const orphan = await client.query(
          "SELECT id FROM warehouses WHERE code=$1",
          [`DEMO-${sessionId}`],
        );
        if (orphan.rowCount) throw new DemoCleanupError("BUSY");
      }
      await client.query(
        `INSERT INTO demo_reference_cleanup_archives (session_id,lease_token,reference_snapshot)
         VALUES ($1,$2,$3::jsonb)`,
        [sessionId, token, workspace ? JSON.stringify(workspace) : null],
      );
      // Check the real database deadline after all deletion/archive work, not caller timestamps.
      await this.requireLease(client, sessionId, token);
      await client.query(
        `INSERT INTO demo_session_control_events (id,session_id,action,actor_type,actor_id)
         VALUES ($1,$2,'demo_session.references_cleaned','system','demo-lifecycle')`,
        [randomUUID(), sessionId],
      );
      // Evidence insertion can itself take time; fence again before releasing capacity.
      await this.requireLease(client, sessionId, token);
      await client.query(
        "UPDATE demo_session_reservations SET state='closed' WHERE session_id=$1",
        [sessionId],
      );
      await client.query(
        "UPDATE demo_reference_cleanup_jobs SET state='completed',completed_at=clock_timestamp() WHERE session_id=$1",
        [sessionId],
      );
    });
  }

  private async removeInactiveReferences(
    client: PoolClient,
    sessionId: string,
    workspace: Workspace,
  ): Promise<void> {
    const warehouseId = workspace.workspace_warehouse_id;
    if (warehouseId === workspace.template_warehouse_id)
      throw new DemoCleanupError("BUSY");
    // Lock parent rows before inspecting children: blocks new FK references,
    // descriptor activation and observation insertion during absence checks/deletion.
    const warehouse = await client.query(
      "SELECT code FROM warehouses WHERE id=$1 FOR UPDATE",
      [warehouseId],
    );
    const topologies = await client.query(
      "SELECT id,revision FROM warehouse_topologies WHERE warehouse_id=$1 FOR UPDATE",
      [warehouseId],
    );
    const locations = await client.query<{ id: string }>(
      "SELECT id FROM locations WHERE warehouse_id=$1 FOR UPDATE",
      [warehouseId],
    );
    const equipment = await client.query<{
      equipment_id: string;
      active: boolean;
    }>(
      "SELECT equipment_id,active FROM equipment_descriptors WHERE warehouse_id=$1 FOR UPDATE",
      [warehouseId],
    );
    if (
      warehouse.rows[0]?.code !== `DEMO-${sessionId}` ||
      topologies.rowCount !== 1 ||
      topologies.rows[0].id !== workspace.workspace_topology_id ||
      topologies.rows[0].revision !== workspace.workspace_topology_revision ||
      !sameIds(
        locations.rows.map((row) => row.id),
        Object.values(workspace.reference_map.locations),
      ) ||
      !sameIds(
        equipment.rows.map((row) => row.equipment_id),
        Object.values(workspace.reference_map.equipment),
      ) ||
      equipment.rows.some((row) => row.active)
    )
      throw new DemoCleanupError("BUSY");
    const locIds = locations.rows.map((row) => row.id);
    const eqIds = equipment.rows.map((row) => row.equipment_id);
    const use = await client.query<{ busy: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM warehouse_access_assignments WHERE warehouse_id=$1)
       OR EXISTS(SELECT 1 FROM inbound_receipts WHERE warehouse_id=$1)
       OR EXISTS(SELECT 1 FROM outbound_orders WHERE warehouse_id=$1)
       OR EXISTS(SELECT 1 FROM audit_events WHERE warehouse_id=$1)
       OR EXISTS(SELECT 1 FROM equipment_observations WHERE equipment_id=ANY($3::text[]))
       OR EXISTS(SELECT 1 FROM loads WHERE current_location_id=ANY($2::uuid[]))
       OR EXISTS(SELECT 1 FROM inventory_units WHERE location_id=ANY($2::uuid[]))
       OR EXISTS(SELECT 1 FROM transport_tasks WHERE source_location_id=ANY($2::uuid[])
          OR destination_location_id=ANY($2::uuid[]) OR equipment_id=ANY($3::text[]))
       OR EXISTS(SELECT 1 FROM alarms WHERE equipment_id=ANY($3::text[]))
       OR EXISTS(SELECT 1 FROM route_plans WHERE topology_id=$4) AS busy`,
      [warehouseId, locIds, eqIds, workspace.workspace_topology_id],
    );
    if (use.rows[0].busy) throw new DemoCleanupError("BUSY");
    // Archive is inserted by the enclosing transaction using the locked complete metadata.
    await client.query(
      "DELETE FROM demo_reference_workspaces WHERE session_id=$1",
      [sessionId],
    );
    await client.query(
      "DELETE FROM location_topology_bindings WHERE warehouse_id=$1",
      [warehouseId],
    );
    await client.query(
      "DELETE FROM equipment_descriptors WHERE warehouse_id=$1",
      [warehouseId],
    );
    await client.query(
      "DELETE FROM topology_edges WHERE topology_id=$1 AND topology_revision=$2",
      [workspace.workspace_topology_id, workspace.workspace_topology_revision],
    );
    await client.query(
      "DELETE FROM warehouse_topologies WHERE warehouse_id=$1",
      [warehouseId],
    );
    await client.query("DELETE FROM locations WHERE warehouse_id=$1", [
      warehouseId,
    ]);
    await client.query("DELETE FROM warehouses WHERE id=$1", [warehouseId]);
    const remains = await client.query<{ busy: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM warehouses WHERE id=$1)
       OR EXISTS(SELECT 1 FROM locations WHERE id=ANY($2::uuid[]))
       OR EXISTS(SELECT 1 FROM equipment_descriptors WHERE equipment_id=ANY($3::text[]))
       OR EXISTS(SELECT 1 FROM warehouse_topologies WHERE id=$4)
       OR EXISTS(SELECT 1 FROM topology_nodes WHERE topology_id=$4)
       OR EXISTS(SELECT 1 FROM topology_edges WHERE topology_id=$4)
       OR EXISTS(SELECT 1 FROM location_topology_bindings WHERE warehouse_id=$1)
       OR EXISTS(SELECT 1 FROM demo_reference_workspaces WHERE session_id=$5) AS busy`,
      [warehouseId, locIds, eqIds, workspace.workspace_topology_id, sessionId],
    );
    if (remains.rows[0].busy) throw new DemoCleanupError("BUSY");
  }
}
