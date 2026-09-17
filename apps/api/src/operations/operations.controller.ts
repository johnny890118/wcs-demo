import { Controller, Get, UseGuards } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import type { OperationsSummary } from "../../../../src/application/operations/operations-summary";
import type { OperationsDetails } from "../../../../src/application/operations/operations-details";
import { OperationsSummaryService } from "./operations-summary.service";

@Controller("v1/operations")
@UseGuards(ServiceTokenGuard)
export class OperationsController {
  constructor(private readonly summaries: OperationsSummaryService) {}

  @Get("summary")
  getSummary(): Promise<OperationsSummary> {
    return this.summaries.getSummary();
  }

  @Get("details")
  getDetails(): Promise<OperationsDetails> {
    return this.summaries.getDetails();
  }
}
