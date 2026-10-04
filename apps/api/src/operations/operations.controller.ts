import { Controller, Get, Headers, Query, UseGuards } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import type { OperationsSummary } from "../../../../src/application/operations/operations-summary";
import type { OperationsDetails } from "../../../../src/application/operations/operations-details";
import type { OperationsHome } from "../../../../src/application/operations/operations-home";
import type { OperationsOverview } from "../../../../src/application/operations/operations-overview";
import type { OperationsLiveView } from "../../../../src/application/operations/operations-live-view";
import { OperationsSummaryService } from "./operations-summary.service";

@Controller("v1/operations")
@UseGuards(ServiceTokenGuard)
@RequirePermission("operations.view")
@RequireUserPermission("operations.view")
export class OperationsController {
  constructor(private readonly summaries: OperationsSummaryService) {}

  @Get("live-view")
  getLiveView(
    @Headers("x-swp-warehouse") warehouseId: string,
    @Query("equipmentId") equipmentId?: unknown,
  ): Promise<OperationsLiveView> {
    return equipmentId === undefined
      ? this.summaries.getLiveView(warehouseId)
      : this.summaries.getLiveView(warehouseId, equipmentId);
  }

  @Get("overview")
  getOverview(
    @Headers("x-swp-warehouse") warehouseId: string,
  ): Promise<OperationsOverview> {
    return this.summaries.getOverview(warehouseId);
  }

  @Get("summary")
  getSummary(
    @Headers("x-swp-warehouse") warehouseId: string,
  ): Promise<OperationsSummary> {
    return this.summaries.getSummary(warehouseId);
  }

  @Get("details")
  getDetails(
    @Headers("x-swp-warehouse") warehouseId: string,
  ): Promise<OperationsDetails> {
    return this.summaries.getDetails(warehouseId);
  }

  @Get("home")
  getHome(
    @Headers("x-swp-warehouse") warehouseId: string,
  ): Promise<OperationsHome> {
    return this.summaries.getHome(warehouseId);
  }
}
