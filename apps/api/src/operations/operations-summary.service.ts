import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type { OperationsSummary } from "../../../../src/application/operations/operations-summary";
import type { OperationsDetails } from "../../../../src/application/operations/operations-details";
import type { TopologyNode } from "../../../../src/domain/topology/warehouse-topology";
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

type FocusedTaskRow = Omit<
  TaskRow,
  "source_location_id" | "destination_location_id"
> & {
  source: string;
  destination: string;
};

type EquipmentRow = {
  equipment_id: string;
  adapter_key: string;
  capabilities: string[];
  active: boolean;
};

type InventoryRow = {
  id: string;
  sku: string;
  quantity: number;
  location: string;
  status: string;
  updated_at: Date;
};

type AlarmRow = {
  id: string;
  transport_task_id: string;
  equipment_id: string;
  code: string;
  severity: string;
  message: string;
  status: string;
  raised_at: Date;
  acknowledged_at: Date | null;
  cleared_at: Date | null;
  resolution: string | null;
};

type NodeRow = {
  node_id: string;
  kind: string;
  capabilities: string[];
  position: TopologyNode["position"] | null;
};
type EdgeRow = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  status: string;
  required_capabilities: string[];
  resource_ids: string[];
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

  async getDetails(): Promise<OperationsDetails> {
    const [tasks, equipment, inventory, alarms, topology] = await Promise.all([
      this.pool.query<FocusedTaskRow>(
        `SELECT t.id, t.status, source.code AS source, destination.code AS destination,
          t.equipment_id, t.updated_at
         FROM transport_tasks t
         JOIN locations source ON source.id = t.source_location_id
         JOIN locations destination ON destination.id = t.destination_location_id
         ORDER BY t.updated_at DESC, t.id
         LIMIT 100`,
      ),
      this.pool.query<EquipmentRow>(
        `SELECT equipment_id, adapter_key, capabilities, active
         FROM equipment_descriptors
         ORDER BY equipment_id
         LIMIT 100`,
      ),
      this.pool.query<InventoryRow>(
        `SELECT inventory.id, inventory.sku, inventory.quantity,
          location.code AS location, inventory.status, inventory.updated_at
         FROM inventory_units inventory
         JOIN locations location ON location.id = inventory.location_id
         ORDER BY inventory.updated_at DESC, inventory.id
         LIMIT 100`,
      ),
      this.pool.query<AlarmRow>(
        `SELECT id, transport_task_id, equipment_id, code, severity, message,
          status, raised_at, acknowledged_at, cleared_at, resolution
         FROM alarms
         ORDER BY raised_at DESC, id
         LIMIT 100`,
      ),
      this.pool.query<TopologyRow>(
        `SELECT id, revision
         FROM warehouse_topologies
         WHERE status = 'active'
         ORDER BY activated_at DESC NULLS LAST, revision DESC
         LIMIT 1`,
      ),
    ]);
    const activeTopology = topology.rows[0];
    const [nodes, edges] = activeTopology
      ? await Promise.all([
          this.pool.query<NodeRow>(
            `SELECT node_id, kind, capabilities, position
             FROM topology_nodes
             WHERE topology_id = $1 AND topology_revision = $2
             ORDER BY node_id`,
            [activeTopology.id, activeTopology.revision],
          ),
          this.pool.query<EdgeRow>(
            `SELECT edge_id, from_node_id, to_node_id, status,
              required_capabilities, resource_ids
             FROM topology_edges
             WHERE topology_id = $1 AND topology_revision = $2
             ORDER BY edge_id`,
            [activeTopology.id, activeTopology.revision],
          ),
        ])
      : [{ rows: [] as NodeRow[] }, { rows: [] as EdgeRow[] }];

    return {
      tasks: tasks.rows.map((task) => ({
        taskId: task.id,
        status: task.status,
        source: task.source,
        destination: task.destination,
        equipmentId: task.equipment_id,
        updatedAt: task.updated_at.toISOString(),
      })),
      equipment: equipment.rows.map((item) => ({
        equipmentId: item.equipment_id,
        adapterKey: item.adapter_key,
        capabilities: item.capabilities,
        active: item.active,
      })),
      inventory: inventory.rows.map((item) => ({
        inventoryUnitId: item.id,
        sku: item.sku,
        quantity: item.quantity,
        location: item.location,
        status: item.status,
        updatedAt: item.updated_at.toISOString(),
      })),
      alarms: alarms.rows.map((alarm) => ({
        alarmId: alarm.id,
        taskId: alarm.transport_task_id,
        equipmentId: alarm.equipment_id,
        code: alarm.code,
        severity: alarm.severity,
        message: alarm.message,
        status: alarm.status,
        raisedAt: alarm.raised_at.toISOString(),
        acknowledgedAt: alarm.acknowledged_at?.toISOString() ?? null,
        clearedAt: alarm.cleared_at?.toISOString() ?? null,
        resolution: alarm.resolution,
      })),
      topology: activeTopology
        ? {
            topologyId: activeTopology.id,
            revision: activeTopology.revision,
            nodes: nodes.rows.map((node) => ({
              nodeId: node.node_id,
              kind: node.kind,
              capabilities: node.capabilities,
              ...(node.position ? { position: node.position } : {}),
            })),
            edges: edges.rows.map((edge) => ({
              edgeId: edge.edge_id,
              fromNodeId: edge.from_node_id,
              toNodeId: edge.to_node_id,
              status: edge.status,
              requiredCapabilities: edge.required_capabilities,
              resourceIds: edge.resource_ids,
            })),
          }
        : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
