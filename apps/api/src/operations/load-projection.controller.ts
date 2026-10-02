import { Controller, Get, Headers, Query, UseGuards } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { LoadProjectionService } from "./load-projection.service";
@Controller("v1/operations/loads")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class LoadProjectionController {
  constructor(private readonly loads: LoadProjectionService) {}
  @Get()
  list(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.loads.list(warehouseId, query);
  }
}
