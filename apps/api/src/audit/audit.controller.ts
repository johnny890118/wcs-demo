import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AuditEventPage } from "../../../../src/application/audit/audit-projection";
import { RequirePermission } from "../auth/permissions";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { AuditProjectionService } from "./audit-projection.service";

@Controller("v1/audit-events")
@UseGuards(ServiceTokenGuard)
@RequirePermission("audit.view")
export class AuditController {
  constructor(private readonly audit: AuditProjectionService) {}

  @Get()
  list(
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("resourceType") resourceType?: string,
    @Query("resourceId") resourceId?: string,
    @Query("correlationId") correlationId?: string,
  ): Promise<AuditEventPage> {
    return this.audit.list({
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(resourceId ? { resourceId } : {}),
      ...(correlationId ? { correlationId } : {}),
    });
  }
}
