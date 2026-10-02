import { Controller, Get, Headers, Query, UseGuards } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { InventoryProjectionService } from "./inventory-projection.service";
@Controller("v1/operations/inventory")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class InventoryProjectionController {
  constructor(private readonly inventory: InventoryProjectionService) {}
  @Get()
  list(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.inventory.list(warehouseId, query);
  }
}
