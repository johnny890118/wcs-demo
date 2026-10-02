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
import { TaskProjectionService } from "./task-projection.service";

@Controller("v1/operations/tasks")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class TaskProjectionController {
  constructor(private readonly tasks: TaskProjectionService) {}
  @Get()
  getQueue(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.tasks.getQueue(warehouseId, query);
  }
  @Get(":taskId")
  getDetail(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.tasks.getDetail(warehouseId, taskId);
  }
}
