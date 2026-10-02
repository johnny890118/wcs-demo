import { Controller, Get, Headers, Query, UseGuards } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { LocationProjectionService } from "./location-projection.service";
@Controller("v1/operations/locations")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class LocationProjectionController {
  constructor(private readonly locations: LocationProjectionService) {}
  @Get()
  list(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.locations.list(warehouseId, query);
  }
}
