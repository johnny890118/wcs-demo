import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { AuditEventPage } from "../../../../src/application/audit/audit-projection";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { requireForwardedUserAccess } from "../auth/user-access";
import { AuditProjectionService } from "./audit-projection.service";

@Controller("v1/audit-events")
@UseGuards(ServiceTokenGuard)
@RequirePermission("audit.view")
@RequireUserPermission("audit.view")
export class AuditController {
  constructor(private readonly audit: AuditProjectionService) {}

  @Get()
  list(
    @Req() request: Request,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
    @Query("resourceType") resourceType?: string,
    @Query("resourceId") resourceId?: string,
    @Query("correlationId") correlationId?: string,
  ): Promise<AuditEventPage> {
    const access = requireForwardedUserAccess(request, "audit.view");
    return this.audit.list(access.currentWarehouseId, {
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(resourceId ? { resourceId } : {}),
      ...(correlationId ? { correlationId } : {}),
    });
  }
}
