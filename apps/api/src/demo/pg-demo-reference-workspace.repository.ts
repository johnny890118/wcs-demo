import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { OperationalRuntime } from "../../../../src/application/access/operational-access";
import { requireAnonymousDemoRuntime } from "../../../../src/application/demo/demo-admission";
import {
  DemoWorkspaceError,
  prepareDemoReferenceWorkspace,
  type DemoTemplateSnapshot,
  type DemoReferenceWorkspace,
  type DemoReferenceWorkspaceRecord,
  type DemoReferenceWorkspaceRepository,
} from "../../../../src/application/demo/demo-reference-workspace";
import type { WarehouseTopology } from "../../../../src/domain/topology/warehouse-topology";
import type { EquipmentDescriptor } from "../../../../src/domain/equipment/equipment-descriptor";

type WorkspaceRow = {
  session_id: string;
  workspace_warehouse_id: string;
  workspace_topology_id: string;
  workspace_topology_revision: number;
  template_warehouse_id: string;
  template_topology_id: string;
  template_topology_revision: number;
  reference_map: DemoReferenceWorkspace["referenceMap"];
  created_at: Date;
};
function record(row: WorkspaceRow): DemoReferenceWorkspaceRecord {
  return {
    sessionId: row.session_id,
    warehouseId: row.workspace_warehouse_id,
    topologyId: row.workspace_topology_id,
    topologyRevision: row.workspace_topology_revision,
    templateWarehouseId: row.template_warehouse_id,
    templateTopologyId: row.template_topology_id,
    templateTopologyRevision: row.template_topology_revision,
    referenceMap: row.reference_map,
    createdAt: row.created_at.toISOString(),
  };
}
type TemplateRow = {
  id: string;
  warehouse_id: string;
  revision: number;
  status: "active";
  nodes: {
    node_id: string;
    kind: string;
    capabilities: string[];
    position: WarehouseTopology["nodes"][number]["position"] | null;
    attributes: Record<string, unknown>;
  }[];
  edges: {
    edge_id: string;
    from_node_id: string;
    to_node_id: string;
    cost: number;
    status: "available" | "blocked";
    required_capabilities: string[];
    resource_ids: string[];
    geometry: Record<string, unknown> | null;
    attributes: Record<string, unknown>;
  }[];
  locations: {
    id: string;
    warehouse_id: string;
    code: string;
    kind: string;
    status: "available" | "blocked" | "disabled";
    capabilities: string[];
  }[];
  bindings: { location_id: string; node_id: string }[];
  equipment: {
    equipment_id: string;
    warehouse_id: string;
    adapter_key: string;
    capabilities: string[];
    supported_commands: EquipmentDescriptor["supportedCommands"];
    constraints: Record<string, unknown>;
  }[];
};
function template(row: TemplateRow): DemoTemplateSnapshot {
  return {
    topology: {
      topologyId: row.id,
      warehouseId: row.warehouse_id,
      revision: row.revision,
      status: row.status,
      nodes: row.nodes.map((node) => ({
        nodeId: node.node_id,
        kind: node.kind,
        capabilities: node.capabilities,
        ...(node.position ? { position: node.position } : {}),
        attributes: node.attributes,
      })),
      edges: row.edges.map((edge) => ({
        edgeId: edge.edge_id,
        fromNodeId: edge.from_node_id,
        toNodeId: edge.to_node_id,
        cost: edge.cost,
        status: edge.status,
        requiredCapabilities: edge.required_capabilities,
        resourceIds: edge.resource_ids,
        ...(edge.geometry ? { geometry: edge.geometry } : {}),
        attributes: edge.attributes,
      })),
    },
    locations: row.locations.map((location) => ({
      locationId: location.id,
      warehouseId: location.warehouse_id,
      code: location.code,
      kind: location.kind,
      status: location.status,
      capabilities: location.capabilities,
    })),
    bindings: row.bindings.map((binding) => ({
      locationId: binding.location_id,
      nodeId: binding.node_id,
    })),
    equipment: row.equipment.map((equipment) => ({
      equipmentId: equipment.equipment_id,
      warehouseId: equipment.warehouse_id,
      adapterKey: equipment.adapter_key,
      capabilities: equipment.capabilities,
      supportedCommands: equipment.supported_commands,
      constraints: equipment.constraints,
    })),
  };
}

/** Persist inactive reference identities only; no live adapter or access grant. */
export class PgDemoReferenceWorkspaceRepository
  implements DemoReferenceWorkspaceRepository
{
  private readonly adapterKeys: readonly string[];
  constructor(
    private readonly pool: Pool,
    runtime: OperationalRuntime,
    allowedSimulationAdapterKeys: readonly string[],
  ) {
    requireAnonymousDemoRuntime(runtime);
    this.adapterKeys = [...allowedSimulationAdapterKeys];
  }

  async snapshot(sessionId: string): Promise<DemoReferenceWorkspaceRecord> {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionId,
      )
    )
      throw new DemoWorkspaceError("UNAVAILABLE");
    sessionId = sessionId.toLowerCase();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");
      await client.query("SELECT pg_advisory_xact_lock($1)", [870_041_003]);
      const reservation = await client.query<{
        template_warehouse_id: string;
        state: string;
        valid: boolean;
      }>(
        "SELECT template_warehouse_id,state,expires_at > clock_timestamp() AS valid FROM demo_session_reservations WHERE session_id=$1 FOR UPDATE",
        [sessionId],
      );
      const scope = reservation.rows[0];
      if (!scope || scope.state !== "provisioning" || !scope.valid)
        throw new DemoWorkspaceError("UNAVAILABLE");
      const existing = await client.query<WorkspaceRow>(
        "SELECT * FROM demo_reference_workspaces WHERE session_id=$1",
        [sessionId],
      );
      if (existing.rows[0]) {
        await client.query("COMMIT");
        return record(existing.rows[0]);
      }
      // One MVCC statement: topology and all child references share a snapshot.
      const source = await client.query<TemplateRow>(
        `SELECT topology.id,topology.warehouse_id,topology.revision,topology.status,
          COALESCE((SELECT jsonb_agg(to_jsonb(item)) FROM (SELECT node_id,kind,capabilities,position,attributes FROM topology_nodes WHERE topology_id=topology.id AND topology_revision=topology.revision ORDER BY node_id LIMIT 1001) item),'[]') AS nodes,
          COALESCE((SELECT jsonb_agg(to_jsonb(item)) FROM (SELECT edge_id,from_node_id,to_node_id,cost,status,required_capabilities,resource_ids,geometry,attributes FROM topology_edges WHERE topology_id=topology.id AND topology_revision=topology.revision ORDER BY edge_id LIMIT 4001) item),'[]') AS edges,
          COALESCE((SELECT jsonb_agg(to_jsonb(item)) FROM (SELECT id,warehouse_id,code,kind,status,capabilities FROM locations WHERE warehouse_id=topology.warehouse_id ORDER BY id LIMIT 251) item),'[]') AS locations,
          COALESCE((SELECT jsonb_agg(to_jsonb(item)) FROM (SELECT location_id,node_id FROM location_topology_bindings WHERE warehouse_id=topology.warehouse_id AND topology_id=topology.id AND topology_revision=topology.revision ORDER BY location_id LIMIT 251) item),'[]') AS bindings,
          COALESCE((SELECT jsonb_agg(to_jsonb(item)) FROM (SELECT equipment_id,warehouse_id,adapter_key,capabilities,supported_commands,constraints FROM equipment_descriptors WHERE warehouse_id=topology.warehouse_id AND active=true ORDER BY equipment_id LIMIT 101) item),'[]') AS equipment
         FROM warehouse_topologies topology WHERE warehouse_id=$1 AND status='active'`,
        [scope.template_warehouse_id],
      );
      if (!source.rows[0]) throw new DemoWorkspaceError("INVALID_TEMPLATE");
      const reference = template(source.rows[0]);
      const owned = prepareDemoReferenceWorkspace(
        reference,
        randomUUID,
        this.adapterKeys,
      );
      await client.query(
        "INSERT INTO warehouses (id,code,name) VALUES ($1,$2,'Isolated Demo Workspace')",
        [owned.warehouseId, `DEMO-${sessionId}`],
      );
      await client.query(
        "INSERT INTO warehouse_topologies (id,warehouse_id,revision,status,activated_at) VALUES ($1,$2,1,'active',clock_timestamp())",
        [owned.topology.topologyId, owned.warehouseId],
      );
      for (const node of owned.topology.nodes)
        await client.query(
          "INSERT INTO topology_nodes (topology_id,topology_revision,node_id,kind,capabilities,position,attributes) VALUES ($1,1,$2,$3,$4,$5,$6)",
          [
            owned.topology.topologyId,
            node.nodeId,
            node.kind,
            node.capabilities,
            node.position ?? null,
            node.attributes ?? {},
          ],
        );
      for (const edge of owned.topology.edges)
        await client.query(
          "INSERT INTO topology_edges (topology_id,topology_revision,edge_id,from_node_id,to_node_id,cost,status,required_capabilities,resource_ids,geometry,attributes) VALUES ($1,1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
          [
            owned.topology.topologyId,
            edge.edgeId,
            edge.fromNodeId,
            edge.toNodeId,
            edge.cost,
            edge.status,
            edge.requiredCapabilities,
            edge.resourceIds,
            edge.geometry ?? null,
            edge.attributes ?? {},
          ],
        );
      for (const location of owned.locations)
        await client.query(
          "INSERT INTO locations (id,warehouse_id,code,kind,status,capabilities) VALUES ($1,$2,$3,$4,$5,$6)",
          [
            location.locationId,
            owned.warehouseId,
            location.code,
            location.kind,
            location.status,
            location.capabilities,
          ],
        );
      for (const binding of owned.bindings)
        await client.query(
          "INSERT INTO location_topology_bindings (location_id,warehouse_id,topology_id,topology_revision,node_id) VALUES ($1,$2,$3,1,$4)",
          [
            binding.locationId,
            owned.warehouseId,
            owned.topology.topologyId,
            binding.nodeId,
          ],
        );
      for (const equipment of owned.equipment)
        await client.query(
          "INSERT INTO equipment_descriptors (equipment_id,warehouse_id,adapter_key,capabilities,supported_commands,constraints,active) VALUES ($1,$2,$3,$4,$5,$6,false)",
          [
            equipment.equipmentId,
            owned.warehouseId,
            equipment.adapterKey,
            equipment.capabilities,
            equipment.supportedCommands,
            equipment.constraints,
          ],
        );
      const deadline = await client.query(
        "SELECT 1 FROM demo_session_reservations WHERE session_id=$1 AND state='provisioning' AND expires_at > clock_timestamp()",
        [sessionId],
      );
      if (deadline.rowCount !== 1) throw new DemoWorkspaceError("UNAVAILABLE");
      const saved = await client.query<WorkspaceRow>(
        "INSERT INTO demo_reference_workspaces (session_id,workspace_warehouse_id,workspace_topology_id,workspace_topology_revision,template_warehouse_id,template_topology_id,template_topology_revision,reference_map) VALUES ($1,$2,$3,1,$4,$5,$6,$7) RETURNING *",
        [
          sessionId,
          owned.warehouseId,
          owned.topology.topologyId,
          reference.topology.warehouseId,
          reference.topology.topologyId,
          reference.topology.revision,
          owned.referenceMap,
        ],
      );
      await client.query(
        "INSERT INTO demo_session_control_events (id,session_id,action,actor_type,actor_id) VALUES ($1,$2,'demo_session.workspace_snapshotted','system','demo-lifecycle')",
        [randomUUID(), sessionId],
      );
      await client.query("COMMIT");
      return record(saved.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
