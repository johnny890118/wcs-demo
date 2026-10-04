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
import { WorkProjectionService } from "./work-projection.service";

@Controller("v1/operations/work")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class WorkProjectionController {
  constructor(private readonly work: WorkProjectionService) {}
  @Get(":flow/:workId")
  getDetail(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Param("flow") flow: string,
    @Param("workId") workId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.work.getDetail(warehouseId, flow, workId, query);
  }
}
