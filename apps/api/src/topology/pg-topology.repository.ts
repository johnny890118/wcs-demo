import { Inject, Injectable } from "@nestjs/common";
import type { Pool, PoolClient } from "pg";
import {
  TopologyActivationError,
  type TopologyActivationRepository,
} from "../../../../src/application/topology/topology-activation";
import {
  validateTopology,
  type TopologyEdge,
  type TopologyNode,
  type WarehouseTopology,
} from "../../../../src/domain/topology/warehouse-topology";
import { DATABASE_POOL } from "../database/database.module";

type TopologyRow = {
  id: string;
  warehouse_id: string;
  revision: number;
  status: WarehouseTopology["status"];
};

type NodeRow = {
  node_id: string;
  kind: string;
  capabilities: string[];
  position: TopologyNode["position"] | null;
  attributes: Record<string, unknown>;
};

type EdgeRow = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  cost: number;
  status: TopologyEdge["status"];
  required_capabilities: string[];
  resource_ids: string[];
  geometry: Record<string, unknown> | null;
  attributes: Record<string, unknown>;
};

@Injectable()
export class PgTopologyRepository implements TopologyActivationRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async get(
    topologyId: string,
    revision: number,
  ): Promise<WarehouseTopology | null> {
    return this.load(this.pool, topologyId, revision);
  }

  async activate(
    topologyId: string,
    revision: number,
  ): Promise<WarehouseTopology> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<TopologyRow>(
        `SELECT id, warehouse_id, revision, status
         FROM warehouse_topologies
         WHERE id = $1 AND revision = $2
         FOR UPDATE`,
        [topologyId, revision],
      );
      const row = selected.rows[0];
      if (!row || row.status !== "draft") {
        throw new Error("Topology draft changed before activation.");
      }

      const topology = await this.load(client, topologyId, revision);
      const issues = topology ? validateTopology(topology) : [];
      if (!topology || issues.length > 0) {
        throw new TopologyActivationError(
          issues[0]
            ? `Topology is invalid at ${issues[0].path}: ${issues[0].message}`
            : "Topology draft disappeared before activation.",
        );
      }

      await client.query(
        `UPDATE warehouse_topologies
         SET status = 'retired'
         WHERE warehouse_id = $1 AND status = 'active'`,
        [row.warehouse_id],
      );
      await client.query(
        `UPDATE warehouse_topologies
         SET status = 'active', activated_at = now()
         WHERE id = $1 AND revision = $2`,
        [topologyId, revision],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const activated = await this.get(topologyId, revision);
    if (!activated)
      throw new Error("Activated topology could not be reloaded.");
    return activated;
  }

  private async load(
    queryable: Pick<Pool, "query"> | Pick<PoolClient, "query">,
    topologyId: string,
    revision: number,
  ): Promise<WarehouseTopology | null> {
    const topologyResult = await queryable.query<TopologyRow>(
      `SELECT id, warehouse_id, revision, status
         FROM warehouse_topologies
         WHERE id = $1 AND revision = $2`,
      [topologyId, revision],
    );
    const nodesResult = await queryable.query<NodeRow>(
      `SELECT node_id, kind, capabilities, position, attributes
         FROM topology_nodes
         WHERE topology_id = $1 AND topology_revision = $2
         ORDER BY node_id`,
      [topologyId, revision],
    );
    const edgesResult = await queryable.query<EdgeRow>(
      `SELECT edge_id, from_node_id, to_node_id, cost, status,
          required_capabilities, resource_ids, geometry, attributes
         FROM topology_edges
         WHERE topology_id = $1 AND topology_revision = $2
         ORDER BY edge_id`,
      [topologyId, revision],
    );
    const row = topologyResult.rows[0];
    if (!row) return null;

    return {
      topologyId: row.id,
      warehouseId: row.warehouse_id,
      revision: row.revision,
      status: row.status,
      nodes: nodesResult.rows.map((node) => ({
        nodeId: node.node_id,
        kind: node.kind,
        capabilities: node.capabilities,
        ...(node.position ? { position: node.position } : {}),
        attributes: node.attributes,
      })),
      edges: edgesResult.rows.map((edge) => ({
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
    };
  }
}
