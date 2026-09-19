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
  telemetry_status: string | null;
  telemetry_task_id: string | null;
  telemetry_load_id: string | null;
  telemetry_fault_code: string | null;
  telemetry_topology_id: string | null;
  telemetry_topology_revision: number | null;
  telemetry_node_id: string | null;
  telemetry_connection_status: "connected" | "disconnected" | null;
  telemetry_quality: "good" | "uncertain" | "bad" | "unknown" | null;
  telemetry_sequence: string | null;
  telemetry_observed_at: Date | null;
  telemetry_received_at: Date | null;
  telemetry_source: string | null;
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

type LocationRow = {
  id: string;
  code: string;
  kind: string;
  status: "available" | "blocked" | "disabled";
  capabilities: string[];
  active_node_id: string | null;
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

export const equipmentTelemetryFreshAfterMs = 30_000;

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
    const [tasks, equipment, inventory, alarms, locations, topology] =
      await Promise.all([
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
          `SELECT descriptor.equipment_id, descriptor.adapter_key,
          descriptor.capabilities, descriptor.active,
          observation.status AS telemetry_status,
          observation.task_id AS telemetry_task_id,
          observation.load_id AS telemetry_load_id,
          observation.fault_code AS telemetry_fault_code,
          observation.topology_id AS telemetry_topology_id,
          observation.topology_revision AS telemetry_topology_revision,
          observation.node_id AS telemetry_node_id,
          observation.connection_status AS telemetry_connection_status,
          observation.quality AS telemetry_quality,
          observation.sequence::text AS telemetry_sequence,
          observation.observed_at AS telemetry_observed_at,
          observation.received_at AS telemetry_received_at,
          observation.source AS telemetry_source
         FROM equipment_descriptors descriptor
         LEFT JOIN equipment_observations observation
           ON observation.equipment_id = descriptor.equipment_id
         ORDER BY descriptor.equipment_id
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
        this.pool.query<LocationRow>(
          `SELECT location.id, location.code, location.kind, location.status,
          location.capabilities, binding.node_id AS active_node_id
         FROM locations location
         LEFT JOIN warehouse_topologies topology
           ON topology.warehouse_id = location.warehouse_id
          AND topology.status = 'active'
         LEFT JOIN location_topology_bindings binding
           ON binding.location_id = location.id
          AND binding.topology_id = topology.id
          AND binding.topology_revision = topology.revision
         ORDER BY location.code
         LIMIT 500`,
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
      equipment: equipment.rows.map((item) => {
        const receivedAt = item.telemetry_received_at;
        const ageMs = receivedAt
          ? Math.max(0, Date.now() - receivedAt.getTime())
          : null;
        const hasTelemetry =
          item.telemetry_status !== null &&
          item.telemetry_connection_status !== null &&
          item.telemetry_quality !== null &&
          item.telemetry_sequence !== null &&
          item.telemetry_observed_at !== null &&
          receivedAt !== null &&
          item.telemetry_source !== null &&
          ageMs !== null;
        return {
          equipmentId: item.equipment_id,
          adapterKey: item.adapter_key,
          capabilities: item.capabilities,
          active: item.active,
          telemetry: hasTelemetry
            ? {
                status: item.telemetry_status!,
                taskId: item.telemetry_task_id,
                loadId: item.telemetry_load_id,
                faultCode: item.telemetry_fault_code,
                topologyId: item.telemetry_topology_id,
                topologyRevision: item.telemetry_topology_revision,
                nodeId: item.telemetry_node_id,
                connectionStatus: item.telemetry_connection_status!,
                quality: item.telemetry_quality!,
                freshness:
                  item.telemetry_connection_status === "connected" &&
                  ageMs <= equipmentTelemetryFreshAfterMs
                    ? ("current" as const)
                    : ("stale" as const),
                ageMs,
                sequence: Number(item.telemetry_sequence),
                observedAt: item.telemetry_observed_at!.toISOString(),
                receivedAt: receivedAt.toISOString(),
                source: item.telemetry_source!,
              }
            : null,
        };
      }),
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
      locations: locations.rows.map((location) => ({
        locationId: location.id,
        code: location.code,
        kind: location.kind,
        status: location.status,
        capabilities: location.capabilities,
        activeNodeId: location.active_node_id,
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
