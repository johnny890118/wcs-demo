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
import { WorkProjectionController } from "./work-projection.controller";
import { WorkProjectionService } from "./work-projection.service";
import { ExactContextController } from "./exact-context.controller";
import { ExactContextService } from "./exact-context.service";

@Module({
  controllers: [
    ExactContextController,
    OperationsController,
    WorkProjectionController,
    TaskProjectionController,
    InventoryProjectionController,
    LoadProjectionController,
    LocationProjectionController,
  ],
  providers: [
    ExactContextService,
    OperationsSummaryService,
    WorkProjectionService,
    TaskProjectionService,
    InventoryProjectionService,
    LoadProjectionService,
    LocationProjectionService,
    ServiceTokenGuard,
  ],
})
export class OperationsModule {}
