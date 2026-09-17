import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { OperationsController } from "./operations.controller";
import { OperationsSummaryService } from "./operations-summary.service";

@Module({
  controllers: [OperationsController],
  providers: [OperationsSummaryService, ServiceTokenGuard],
})
export class OperationsModule {}
