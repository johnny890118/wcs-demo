import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { OperationsController } from "./operations.controller";
import { OperationsSummaryService } from "./operations-summary.service";
import { TaskProjectionController } from "./task-projection.controller";
import { TaskProjectionService } from "./task-projection.service";
import { InventoryProjectionController } from "./inventory-projection.controller";
import { InventoryProjectionService } from "./inventory-projection.service";
import { LoadProjectionController } from "./load-projection.controller";
import { LoadProjectionService } from "./load-projection.service";
import { LocationProjectionController } from "./location-projection.controller";
import { LocationProjectionService } from "./location-projection.service";

@Module({
  controllers: [
    OperationsController,
    TaskProjectionController,
    InventoryProjectionController,
    LoadProjectionController,
    LocationProjectionController,
  ],
  providers: [
    OperationsSummaryService,
    TaskProjectionService,
    InventoryProjectionService,
    LoadProjectionService,
    LocationProjectionService,
    ServiceTokenGuard,
  ],
})
export class OperationsModule {}
