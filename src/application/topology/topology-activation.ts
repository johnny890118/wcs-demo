import {
  validateTopology,
  type WarehouseTopology,
} from "../../domain/topology/warehouse-topology";

export class TopologyActivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopologyActivationError";
  }
}

export interface TopologyActivationRepository {
  get(topologyId: string, revision: number): Promise<WarehouseTopology | null>;
  activate(topologyId: string, revision: number): Promise<WarehouseTopology>;
}

export class TopologyActivationService {
  constructor(private readonly repository: TopologyActivationRepository) {}

  async activate(
    topologyId: string,
    revision: number,
  ): Promise<WarehouseTopology> {
    const topology = await this.repository.get(topologyId, revision);
    if (!topology) {
      throw new TopologyActivationError(
        `Topology ${topologyId} revision ${revision} was not found.`,
      );
    }
    if (topology.status !== "draft") {
      throw new TopologyActivationError(
        `Only a draft topology can be activated; current status is ${topology.status}.`,
      );
    }

    const issues = validateTopology(topology);
    if (issues.length > 0) {
      throw new TopologyActivationError(
        `Topology is invalid at ${issues[0]?.path}: ${issues[0]?.message}`,
      );
    }

    return this.repository.activate(topologyId, revision);
  }
}
