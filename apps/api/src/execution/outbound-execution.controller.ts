import {
  BadGatewayException,
  BadRequestException,
  Body,
  Headers,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  EquipmentExecutionError,
  ExecutionConflictError,
  ExecutionTaskNotFoundError,
} from "../../../../src/application/execution/inbound-execution";
import {
  DeterministicOutboundExecutor,
  type OutboundExecutionResult,
} from "../../../../src/application/execution/outbound-execution";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission } from "../auth/permissions";
import { requireOperatorId } from "../auth/operator-identity";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller("v1/outbound-transport-tasks")
@UseGuards(ServiceTokenGuard)
@RequirePermission("transport.execute")
export class OutboundExecutionController {
  constructor(private readonly executor: DeterministicOutboundExecutor) {}

  @Post(":taskId/execute")
  @HttpCode(200)
  async execute(
    @Param("taskId") taskId: string,
    @Headers("x-operator-id") operatorId: string | undefined,
    @Body() body: unknown,
  ): Promise<OutboundExecutionResult> {
    if (!uuidPattern.test(taskId)) {
      throw new BadRequestException("taskId must be a UUID.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new BadRequestException("Request body must be an object.");
    }
    const equipmentId = (body as Record<string, unknown>).equipmentId;
    const confirmedAction = (body as Record<string, unknown>).confirmedAction;
    const confirmationReason = (body as Record<string, unknown>)
      .confirmationReason;
    if (
      typeof equipmentId !== "string" ||
      equipmentId.trim().length === 0 ||
      equipmentId.length > 100
    ) {
      throw new BadRequestException(
        "equipmentId must be a non-empty string of at most 100 characters.",
      );
    }
    if (confirmedAction !== "execute_outbound_task") {
      throw new BadRequestException(
        "confirmedAction must equal execute_outbound_task.",
      );
    }
    if (
      typeof confirmationReason !== "string" ||
      confirmationReason.trim().length < 8 ||
      confirmationReason.length > 500
    ) {
      throw new BadRequestException(
        "confirmationReason must contain 8 to 500 characters.",
      );
    }
    const actorId = requireOperatorId(operatorId);

    try {
      return await this.executor.execute({
        taskId,
        equipmentId: equipmentId.trim(),
        actorId,
        confirmationReason: confirmationReason.trim(),
      });
    } catch (error) {
      if (error instanceof ExecutionTaskNotFoundError) {
        throw new NotFoundException({
          code: "TASK_NOT_FOUND",
          message: error.message,
        });
      }
      if (error instanceof ExecutionConflictError) {
        throw new ConflictException({
          code: "EXECUTION_CONFLICT",
          message: error.message,
        });
      }
      if (error instanceof EquipmentExecutionError) {
        throw new BadGatewayException({
          code: "EQUIPMENT_EXECUTION_FAILED",
          message: error.message,
        });
      }
      throw error;
    }
  }
}
