import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { OperationsController } from "./operations.controller";
import { OperationsSummaryService } from "./operations-summary.service";
import { TaskProjectionController } from "./task-projection.controller";
import { TaskProjectionService } from "./task-projection.service";

@Module({
  controllers: [OperationsController, TaskProjectionController],
  providers: [
    OperationsSummaryService,
    TaskProjectionService,
    ServiceTokenGuard,
  ],
})
export class OperationsModule {}
