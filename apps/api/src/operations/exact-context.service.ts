import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Pool } from "pg";
import { DATABASE_POOL } from "../database/database.module";
import {
  TaskProjectionService,
  taskReadSelect,
  type TaskReadRow,
} from "./task-projection.service";
import { InventoryProjectionService } from "./inventory-projection.service";
import { LoadProjectionService } from "./load-projection.service";
import { LocationProjectionService } from "./location-projection.service";
import { OperationsSummaryService } from "./operations-summary.service";
import { projectOperationsLiveView } from "../../../../src/application/operations/operations-live-view";
import {
  isContextSurface,
  type ExactContext,
} from "../../../../src/application/operations/exact-context";
import type { OperationsDetails } from "../../../../src/application/operations/operations-details";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
@Injectable()
export class ExactContextService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}
  async resolve(
    warehouseId: string,
    taskId: string,
    surface: unknown,
    alarmId?: unknown,
  ): Promise<ExactContext> {
    if (
      !uuid.test(taskId) ||
      !isContextSurface(surface) ||
      (alarmId !== undefined &&
        (typeof alarmId !== "string" || !uuid.test(alarmId)))
    )
      throw new BadRequestException("Invalid context identity.");
    const client = await this.pool.connect();
    let pending: Promise<unknown> = Promise.resolve();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      // Services fan out independent reads; one snapshot client must serialize
      // them rather than concurrently issuing queries on the same pg client.
      const scoped = {
        query: (sql: string, values?: unknown[]) => {
          const operation = pending.then(() => client.query(sql, values));
          pending = operation.then(
            () => undefined,
            () => undefined,
          );
          return operation;
        },
      } as unknown as Pool;
      const detail = await new TaskProjectionService(scoped).getDetail(
        warehouseId,
        taskId,
      );
      const roots = await client.query<TaskReadRow>(
        `${taskReadSelect} AND task.id = $2`,
        [warehouseId, taskId],
      );
      const root = roots.rows[0];
      if (!root) throw new NotFoundException("Context unavailable.");
      const load = (
        await new LoadProjectionService(scoped).list(warehouseId, {
          id: root.load_id,
        })
      ).items[0];
      const stock = await client.query<{ id: string }>(
        `SELECT inventory.id FROM inventory_units inventory JOIN locations location ON location.id = inventory.location_id AND location.warehouse_id = $2 WHERE inventory.load_id = $1`,
        [root.load_id, warehouseId],
      );
      const inventoryId = root.inventory_id ?? stock.rows[0]?.id;
      const inventory = inventoryId
        ? (
            await new InventoryProjectionService(scoped).list(warehouseId, {
              id: inventoryId,
            })
          ).items[0] ?? null
        : null;
      const source = (
        await new LocationProjectionService(scoped).list(warehouseId, {
          id: root.source_id,
        })
      ).items[0];
      const destination = (
        await new LocationProjectionService(scoped).list(warehouseId, {
          id: root.destination_id,
        })
      ).items[0];
      if (!load || !source || !destination || (root.inventory_id && !inventory))
        throw new NotFoundException("Context unavailable.");
      const selectedAlarm = alarmId ?? detail.alarm?.alarmId;
      let alarm: ExactContext["alarm"] = null;
      if (selectedAlarm) {
        const result = await client.query<OperationsDetails["alarms"][number]>(
          `SELECT alarm.id AS "alarmId", alarm.transport_task_id AS "taskId", alarm.equipment_id AS "equipmentId", alarm.code, alarm.severity, alarm.message, alarm.status, alarm.raised_at AS "raisedAt", alarm.acknowledged_at AS "acknowledgedAt", alarm.cleared_at AS "clearedAt", alarm.resolution FROM alarms alarm JOIN equipment_descriptors equipment ON equipment.equipment_id = alarm.equipment_id AND equipment.warehouse_id = $3 WHERE alarm.id = $1 AND alarm.transport_task_id = $2`,
          [selectedAlarm, taskId, warehouseId],
        );
        const row = result.rows[0];
        if (!row && alarmId)
          throw new NotFoundException("Context unavailable.");
        if (row)
          alarm = Object.fromEntries(
            Object.entries(row as unknown as Record<string, unknown>).map(
              ([key, value]) => [
                key,
                value instanceof Date ? value.toISOString() : value,
              ],
            ),
          ) as ExactContext["alarm"];
      }
      const liveEquipmentId =
        alarmId && alarm ? alarm.equipmentId : root.equipment_id;
      const live =
        surface === "live" && liveEquipmentId
          ? projectOperationsLiveView(
              await new OperationsSummaryService(scoped).getDetails(
                warehouseId,
                "live-view",
                { taskId, equipmentId: liveEquipmentId },
              ),
            )
          : null;
      await client.query("COMMIT");
      return {
        detail,
        load,
        inventory,
        source,
        destination,
        alarm,
        live,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      await pending;
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
