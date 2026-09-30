import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { AccessContextController } from "./access-context.controller";
import { AccessContextService } from "./access-context.service";
import { HumanAccessAssignmentController } from "./human-access-assignment.controller";
import { HumanAccessAssignmentService } from "./human-access-assignment.service";

@Module({
  controllers: [AccessContextController, HumanAccessAssignmentController],
  providers: [
    AccessContextService,
    HumanAccessAssignmentService,
    ServiceTokenGuard,
  ],
})
export class AccessContextModule {}
