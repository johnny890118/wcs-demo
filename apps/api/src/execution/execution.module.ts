import { randomUUID } from "node:crypto";
import { Module } from "@nestjs/common";
import type { Pool } from "pg";
import { DeterministicInboundExecutor } from "../../../../src/application/execution/inbound-execution";
import type { EquipmentPort } from "../../../../src/application/equipment/equipment-port";
import { ManualClock } from "../../../../src/infrastructure/simulator/manual-clock";
import { SimulatorEquipmentAdapter } from "../../../../src/infrastructure/simulator/simulator-equipment-adapter";
import type {
  EquipmentCommandType,
  EquipmentDescriptor,
} from "../../../../src/domain/equipment/equipment-descriptor";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { DATABASE_POOL } from "../database/database.module";
import { ExecutionController } from "./execution.controller";
import { PgInboundExecutionRepository } from "./pg-inbound-execution.repository";

export const EXECUTION_REPOSITORY = Symbol("EXECUTION_REPOSITORY");
export const EXECUTION_EQUIPMENT = Symbol("EXECUTION_EQUIPMENT");
export const EXECUTION_CLOCK = Symbol("EXECUTION_CLOCK");

@Module({
  controllers: [ExecutionController],
  providers: [
    ServiceTokenGuard,
    PgInboundExecutionRepository,
    {
      provide: EXECUTION_REPOSITORY,
      useExisting: PgInboundExecutionRepository,
    },
    {
      provide: EXECUTION_EQUIPMENT,
      useFactory: async (pool: Pool): Promise<EquipmentPort> => {
        const adapter = new SimulatorEquipmentAdapter();
        const result = await pool.query<{
          equipment_id: string;
          adapter_key: string;
          capabilities: string[];
          supported_commands: EquipmentCommandType[];
          constraints: Record<string, unknown>;
        }>(
          `SELECT equipment_id, adapter_key, capabilities, supported_commands, constraints
           FROM equipment_descriptors
           WHERE active = true AND adapter_key = 'simulator.mobile-transport'
           ORDER BY equipment_id`,
        );
        result.rows.forEach((row) => {
          const descriptor: EquipmentDescriptor = {
            equipmentId: row.equipment_id,
            adapterKey: row.adapter_key,
            capabilities: row.capabilities,
            supportedCommands: row.supported_commands,
            constraints: row.constraints,
          };
          adapter.register(descriptor, "idle");
        });
        return adapter;
      },
      inject: [DATABASE_POOL],
    },
    {
      provide: EXECUTION_CLOCK,
      useFactory: () => new ManualClock(),
    },
    {
      provide: DeterministicInboundExecutor,
      useFactory: (
        repository: PgInboundExecutionRepository,
        equipment: SimulatorEquipmentAdapter,
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
  ],
})
export class ExecutionModule {}
