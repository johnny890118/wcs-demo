import { randomUUID } from "node:crypto";
import { Logger, Module } from "@nestjs/common";
import type { Pool } from "pg";
import { DeterministicInboundExecutor } from "../../../../src/application/execution/inbound-execution";
import { DeterministicOutboundExecutor } from "../../../../src/application/execution/outbound-execution";
import { FaultRecoveryService } from "../../../../src/application/recovery/fault-recovery";
import type { EquipmentPort } from "../../../../src/application/equipment/equipment-port";
import { ManualClock } from "../../../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../../../src/infrastructure/simulator/simulator-equipment-adapter";
import { ObservationPublishingEquipmentPort } from "../../../../src/infrastructure/simulator/observation-publishing-equipment-port";
import { restoreSimulatorRegistration } from "../../../../src/infrastructure/simulator/simulator-restoration";
import type {
  EquipmentCommandType,
  EquipmentDescriptor,
} from "../../../../src/domain/equipment/equipment-descriptor";
import type { EquipmentStatus } from "../../../../src/domain/equipment/equipment-state-machine";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { DATABASE_POOL } from "../database/database.module";
import { ExecutionController } from "./execution.controller";
import { FaultRecoveryController } from "./fault-recovery.controller";
import { OutboundExecutionController } from "./outbound-execution.controller";
import { PgInboundExecutionRepository } from "./pg-inbound-execution.repository";
import { PgOutboundExecutionRepository } from "./pg-outbound-execution.repository";
import { PgFaultRecoveryRepository } from "./pg-fault-recovery.repository";
import { PgEquipmentObservationSink } from "./pg-equipment-observation.sink";

export const EXECUTION_REPOSITORY = Symbol("EXECUTION_REPOSITORY");
export const EXECUTION_EQUIPMENT = Symbol("EXECUTION_EQUIPMENT");
export const EXECUTION_CLOCK = Symbol("EXECUTION_CLOCK");
export const OUTBOUND_EXECUTION_REPOSITORY = Symbol(
  "OUTBOUND_EXECUTION_REPOSITORY",
);
export const FAULT_RECOVERY_REPOSITORY = Symbol("FAULT_RECOVERY_REPOSITORY");

type SimulatorEquipmentRow = {
  equipment_id: string;
  adapter_key: string;
  capabilities: string[];
  supported_commands: EquipmentCommandType[];
  constraints: Record<string, unknown>;
  topology_id: string | null;
  topology_revision: number | null;
  observation_status: EquipmentStatus | null;
  observation_task_id: string | null;
  observation_load_id: string | null;
  observation_topology_id: string | null;
  observation_topology_revision: number | null;
  observation_node_id: string | null;
  observation_connection_status: "connected" | "disconnected" | null;
  observation_quality: "good" | "uncertain" | "bad" | "unknown" | null;
  observation_sequence: string | null;
};

function simulatorHeartbeatIntervalMs(): number {
  const configured = Number(process.env.SIMULATOR_HEARTBEAT_MS ?? "10000");
  if (
    !Number.isSafeInteger(configured) ||
    configured < 1_000 ||
    configured > 30_000
  ) {
    throw new Error(
      "SIMULATOR_HEARTBEAT_MS must be an integer from 1000 to 30000.",
    );
  }
  return configured;
}

@Module({
  controllers: [
    ExecutionController,
    OutboundExecutionController,
    FaultRecoveryController,
  ],
  providers: [
    ServiceTokenGuard,
    PgInboundExecutionRepository,
    PgOutboundExecutionRepository,
    PgFaultRecoveryRepository,
    PgEquipmentObservationSink,
    {
      provide: FAULT_RECOVERY_REPOSITORY,
      useExisting: PgFaultRecoveryRepository,
    },
    {
      provide: OUTBOUND_EXECUTION_REPOSITORY,
      useExisting: PgOutboundExecutionRepository,
    },
    {
      provide: EXECUTION_REPOSITORY,
      useExisting: PgInboundExecutionRepository,
    },
    {
      provide: EXECUTION_EQUIPMENT,
      useFactory: async (
        pool: Pool,
        observationSink: PgEquipmentObservationSink,
      ): Promise<EquipmentPort> => {
        const adapter = new SimulatorEquipmentAdapter();
        const observed = new ObservationPublishingEquipmentPort(
          adapter,
          observationSink,
          undefined,
          { disconnectOnDestroy: false },
        );
        const result = await pool.query<SimulatorEquipmentRow>(
          `SELECT descriptor.equipment_id, descriptor.adapter_key,
             descriptor.capabilities, descriptor.supported_commands,
             descriptor.constraints, topology.id AS topology_id,
             topology.revision AS topology_revision,
             observation.status AS observation_status,
             observation.task_id AS observation_task_id,
             observation.load_id AS observation_load_id,
             observation.topology_id AS observation_topology_id,
             observation.topology_revision AS observation_topology_revision,
             observation.node_id AS observation_node_id,
             observation.connection_status AS observation_connection_status,
             observation.quality AS observation_quality,
             observation.sequence::text AS observation_sequence
           FROM equipment_descriptors descriptor
           LEFT JOIN warehouse_topologies topology
             ON topology.warehouse_id = descriptor.warehouse_id
            AND topology.status = 'active'
           LEFT JOIN equipment_observations observation
             ON observation.equipment_id = descriptor.equipment_id
           WHERE descriptor.active = true
             AND descriptor.adapter_key = 'simulator.mobile-transport'
           ORDER BY descriptor.equipment_id`,
        );
        for (const row of result.rows) {
          const descriptor: EquipmentDescriptor = {
            equipmentId: row.equipment_id,
            adapterKey: row.adapter_key,
            capabilities: row.capabilities,
            supportedCommands: row.supported_commands,
            constraints: row.constraints,
          };
          const state = adapter.register(
            descriptor,
            restoreSimulatorRegistration(
              {
                status: row.observation_status,
                taskId: row.observation_task_id,
                loadId: row.observation_load_id,
                topologyId: row.observation_topology_id,
                topologyRevision: row.observation_topology_revision,
                nodeId: row.observation_node_id,
                connectionStatus: row.observation_connection_status,
                quality: row.observation_quality,
              },
              row.topology_id !== null && row.topology_revision !== null
                ? { id: row.topology_id, revision: row.topology_revision }
                : null,
            ),
          );
          const lastSequence =
            row.observation_sequence === null
              ? -1
              : Number(row.observation_sequence);
          observed.track(row.equipment_id, lastSequence, {
            topologyId: row.topology_id,
            topologyRevision: row.topology_revision,
            source: "deterministic-simulator",
          });
          await observed.publish(state);
        }
        const logger = new Logger("SimulatorObservationHeartbeat");
        observed.startHeartbeat(simulatorHeartbeatIntervalMs(), (error) => {
          logger.error(
            error instanceof Error
              ? error.message
              : "Simulator heartbeat failed.",
          );
        });
        return observed;
      },
      inject: [DATABASE_POOL, PgEquipmentObservationSink],
    },
    {
      provide: EXECUTION_CLOCK,
      useFactory: () => new ManualClock(),
    },
    {
      provide: DeterministicInboundExecutor,
      useFactory: (
        repository: PgInboundExecutionRepository,
        equipment: EquipmentPort,
        clock: ManualClock,
      ) =>
        new DeterministicInboundExecutor(
          repository,
          equipment,
          clock,
          randomUUID,
        ),
      inject: [EXECUTION_REPOSITORY, EXECUTION_EQUIPMENT, EXECUTION_CLOCK],
    },
    {
      provide: DeterministicOutboundExecutor,
      useFactory: (
        repository: PgOutboundExecutionRepository,
        equipment: EquipmentPort,
        clock: ManualClock,
      ) =>
        new DeterministicOutboundExecutor(
          repository,
          equipment,
          clock,
          randomUUID,
        ),
      inject: [
        OUTBOUND_EXECUTION_REPOSITORY,
        EXECUTION_EQUIPMENT,
        EXECUTION_CLOCK,
      ],
    },
    {
      provide: FaultRecoveryService,
      useFactory: (
        repository: PgFaultRecoveryRepository,
        equipment: EquipmentPort,
        clock: ManualClock,
      ) => new FaultRecoveryService(repository, equipment, clock, randomUUID),
      inject: [FAULT_RECOVERY_REPOSITORY, EXECUTION_EQUIPMENT, EXECUTION_CLOCK],
    },
  ],
})
export class ExecutionModule {}
