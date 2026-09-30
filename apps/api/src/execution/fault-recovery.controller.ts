import {
  BadGatewayException,
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import {
  FaultRecoveryConflictError,
  FaultRecoveryEquipmentError,
  FaultRecoveryNotFoundError,
  FaultRecoveryService,
  type PersistedAlarm,
  type RecoverableTask,
} from "../../../../src/application/recovery/fault-recovery";
import {
  alarmSeverities,
  type AlarmSeverity,
} from "../../../../src/domain/alarm/alarm";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { RequirePermission, RequireUserPermission } from "../auth/permissions";
import { requireForwardedUserAccess } from "../auth/user-access";
import { requireServicePrincipal } from "../auth/service-principal";
import { interactiveAuditActorType } from "../../../../src/application/audit/audit-actor";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller("v1")
@UseGuards(ServiceTokenGuard)
export class FaultRecoveryController {
  constructor(private readonly recovery: FaultRecoveryService) {}

  @Post("transport-tasks/:taskId/faults")
  @RequirePermission("alarm.inject")
  async injectFault(
    @Req() request: Request,
    @Param("taskId") taskId: string,
    @Body() body: unknown,
  ): Promise<PersistedAlarm> {
    this.requireUuid(taskId, "taskId");
    const value = this.requireBody(body);
    const faultCode = this.requireText(value.faultCode, "faultCode", 100);
    const message = this.requireText(value.message, "message", 500);
    const confirmationReason = this.requireConfirmation(value, "inject_fault");
    if (
      typeof value.severity !== "string" ||
      !alarmSeverities.includes(value.severity as AlarmSeverity)
    ) {
      throw new BadRequestException(
        "severity must be info, warning, or critical.",
      );
    }
    const principal = requireServicePrincipal(request);
    return this.handle(() =>
      this.recovery.injectFault({
        taskId,
        faultCode,
        message,
        severity: value.severity as AlarmSeverity,
        actorId: principal.subject,
        actorType: "service",
        confirmationReason,
      }),
    );
  }

  @Post("alarms/:alarmId/acknowledge")
  @HttpCode(200)
  @RequirePermission("alarm.acknowledge")
  @RequireUserPermission("alarm.acknowledge")
  acknowledge(
    @Req() request: Request,
    @Param("alarmId") alarmId: string,
    @Body() body: unknown,
  ): Promise<PersistedAlarm> {
    this.requireUuid(alarmId, "alarmId");
    const value = this.requireBody(body);
    const confirmationReason = this.requireConfirmation(
      value,
      "acknowledge_alarm",
    );
    const access = requireForwardedUserAccess(request, "alarm.acknowledge");
    return this.handle(() =>
      this.recovery.acknowledge({
        alarmId,
        actorId: access.principal,
        actorType: interactiveAuditActorType(access.principalKind),
        warehouseId: access.currentWarehouseId,
        confirmationReason,
      }),
    );
  }

  @Post("alarms/:alarmId/recover")
  @HttpCode(200)
  @RequirePermission("alarm.recover")
  @RequireUserPermission("alarm.recover")
  recover(
    @Req() request: Request,
    @Param("alarmId") alarmId: string,
    @Body() body: unknown,
  ): Promise<RecoverableTask> {
    this.requireUuid(alarmId, "alarmId");
    const value = this.requireBody(body);
    if (value.strategy !== "resume" && value.strategy !== "release") {
      throw new BadRequestException("strategy must be resume or release.");
    }
    const resolution = this.requireText(value.resolution, "resolution", 500);
    const confirmationReason = this.requireConfirmation(
      value,
      `${value.strategy}_task`,
    );
    const access = requireForwardedUserAccess(request, "alarm.recover");
    return this.handle(() =>
      this.recovery.recover({
        alarmId,
        strategy: value.strategy as "resume" | "release",
        resolution,
        actorId: access.principal,
        actorType: interactiveAuditActorType(access.principalKind),
        warehouseId: access.currentWarehouseId,
        confirmationReason,
      }),
    );
  }

  private async handle<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof FaultRecoveryNotFoundError) {
        throw new NotFoundException({
          code: "FAULT_RECOVERY_NOT_FOUND",
          message: error.message,
        });
      }
      if (error instanceof FaultRecoveryConflictError) {
        throw new ConflictException({
          code: "FAULT_RECOVERY_CONFLICT",
          message: error.message,
        });
      }
      if (error instanceof FaultRecoveryEquipmentError) {
        throw new BadGatewayException({
          code: "EQUIPMENT_COMMAND_FAILED",
          message: error.message,
        });
      }
      throw error;
    }
  }

  private requireBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new BadRequestException("Request body must be an object.");
    }
    return body as Record<string, unknown>;
  }

  private requireText(value: unknown, field: string, max: number): string {
    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.length > max
    ) {
      throw new BadRequestException(
        `${field} must be a non-empty string of at most ${max} characters.`,
      );
    }
    return value.trim();
  }

  private requireUuid(value: string, field: string): void {
    if (!uuidPattern.test(value)) {
      throw new BadRequestException(`${field} must be a UUID.`);
    }
  }

  private requireConfirmation(
    body: Record<string, unknown>,
    expectedAction: string,
  ): string {
    if (body.confirmedAction !== expectedAction) {
      throw new BadRequestException(
        `confirmedAction must exactly match ${expectedAction}.`,
      );
    }
    const reason = this.requireText(
      body.confirmationReason,
      "confirmationReason",
      500,
    );
    if (reason.length < 8) {
      throw new BadRequestException(
        "confirmationReason must contain at least 8 characters.",
      );
    }
    return reason;
  }
}
