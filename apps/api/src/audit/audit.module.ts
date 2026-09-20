import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { AuditProjectionService } from "./audit-projection.service";
import { AuditController } from "./audit.controller";

@Module({
  controllers: [AuditController],
  providers: [AuditProjectionService, ServiceTokenGuard],
})
export class AuditModule {}
