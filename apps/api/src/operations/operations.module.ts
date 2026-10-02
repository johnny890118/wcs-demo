import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { OperationsController } from "./operations.controller";
import { OperationsSummaryService } from "./operations-summary.service";
import { TaskProjectionController } from "./task-projection.controller";
import { TaskProjectionService } from "./task-projection.service";
import { InventoryProjectionController } from "./inventory-projection.controller";
import { InventoryProjectionService } from "./inventory-projection.service";

@Module({
  controllers: [
    OperationsController,
    TaskProjectionController,
    InventoryProjectionController,
  ],
  providers: [
    OperationsSummaryService,
    TaskProjectionService,
    InventoryProjectionService,
    ServiceTokenGuard,
  ],
})
export class OperationsModule {}
