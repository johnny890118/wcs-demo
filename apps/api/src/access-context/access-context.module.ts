import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { AccessContextController } from "./access-context.controller";
import { AccessContextService } from "./access-context.service";
import { HumanAccessAssignmentController } from "./human-access-assignment.controller";
import { HumanAccessAssignmentService } from "./human-access-assignment.service";
import { HumanLoginProtectionController } from "./human-login-protection.controller";
import { HumanLoginProtectionService } from "./human-login-protection.service";

@Module({
  controllers: [
    AccessContextController,
    HumanAccessAssignmentController,
    HumanLoginProtectionController,
  ],
  providers: [
    AccessContextService,
    HumanAccessAssignmentService,
    HumanLoginProtectionService,
    ServiceTokenGuard,
  ],
})
export class AccessContextModule {}
