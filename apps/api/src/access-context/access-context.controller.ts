import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { requireForwardedUserAccess } from "../auth/user-access";
import { AccessContextService } from "./access-context.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller("v1/access-context/warehouse")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class AccessContextController {
  constructor(private readonly context: AccessContextService) {}

  @Post()
  change(
    @Req() request: Request,
    @Body() body: unknown,
  ): Promise<{ currentWarehouseId: string }> {
    const targetWarehouseId =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).targetWarehouseId
        : undefined;
    if (
      typeof targetWarehouseId !== "string" ||
      !uuidPattern.test(targetWarehouseId)
    ) {
      throw new BadRequestException({
        code: "INVALID_WAREHOUSE_CONTEXT",
        message: "targetWarehouseId must be a UUID.",
      });
    }
    const access = requireForwardedUserAccess(request, "operations.view");
    if (!access.warehouseScopes.includes(targetWarehouseId)) {
      throw new ForbiddenException({
        code: "WAREHOUSE_SCOPE_FORBIDDEN",
        message: "The selected warehouse is outside the principal scope.",
      });
    }
    if (targetWarehouseId === access.currentWarehouseId) {
      throw new BadRequestException({
        code: "WAREHOUSE_CONTEXT_UNCHANGED",
        message: "The selected warehouse is already current.",
      });
    }
    return this.context.changeWarehouse(access, targetWarehouseId);
  }
}
