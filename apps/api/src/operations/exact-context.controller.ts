import {
  Controller,
  Get,
  Headers,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { ExactContextService } from "./exact-context.service";
@Controller("v1/operations/context")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class ExactContextController {
  constructor(private readonly context: ExactContextService) {}
  @Get(":taskId/:surface")
  resolve(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Param("taskId") taskId: string,
    @Param("surface") surface: string,
    @Query("alarmId") alarmId?: unknown,
  ) {
    return this.context.resolve(warehouseId, taskId, surface, alarmId);
  }
}
