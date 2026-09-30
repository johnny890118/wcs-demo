import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { RequirePermission } from "../auth/permissions";
import { requireServicePrincipal } from "../auth/service-principal";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import {
  HumanAccessAssignmentService,
  type HumanSessionResolution,
} from "./human-access-assignment.service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller("v1/access-context/human/sessions")
@UseGuards(ServiceTokenGuard)
@RequirePermission("access.resolve")
export class HumanAccessAssignmentController {
  constructor(private readonly assignments: HumanAccessAssignmentService) {}

  @Post()
  issue(@Body() body: unknown): Promise<HumanSessionResolution> {
    const identity = boundedIdentity(body);
    return this.assignments.issue(identity.identityProvider, identity.subject);
  }

  @Post(":sessionId/validate")
  validate(
    @Param("sessionId") sessionId: string,
    @Body() body: unknown,
  ): Promise<HumanSessionResolution> {
    requireUuid(sessionId, "sessionId");
    const identity = boundedIdentity(body);
    const currentWarehouseId =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).currentWarehouseId
        : undefined;
    if (
      typeof currentWarehouseId !== "string" ||
      !uuidPattern.test(currentWarehouseId)
    ) {
      throw new BadRequestException({
        code: "INVALID_WAREHOUSE_CONTEXT",
        message: "currentWarehouseId must be a UUID.",
      });
    }
    return this.assignments.validate(
      sessionId,
      identity.identityProvider,
      identity.subject,
      currentWarehouseId,
    );
  }

  @Post(":sessionId/revoke")
  revoke(
    @Req() request: Request,
    @Param("sessionId") sessionId: string,
    @Body() body: unknown,
  ): Promise<{ revoked: boolean }> {
    requireUuid(sessionId, "sessionId");
    const reason =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).reason
        : undefined;
    if (reason !== "sign_out" && reason !== "administrative") {
      throw new BadRequestException({
        code: "INVALID_REVOCATION_REASON",
        message: "A known session revocation reason is required.",
      });
    }
    return this.assignments.revoke(
      sessionId,
      reason,
      requireServicePrincipal(request).subject,
    );
  }
}

function boundedIdentity(body: unknown): {
  identityProvider: string;
  subject: string;
} {
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  if (
    typeof record.identityProvider !== "string" ||
    record.identityProvider.trim().length === 0 ||
    record.identityProvider.length > 80 ||
    typeof record.subject !== "string" ||
    record.subject.trim().length === 0 ||
    record.subject.length > 120
  ) {
    throw new BadRequestException({
      code: "INVALID_IDENTITY_REFERENCE",
      message: "A bounded identity provider and subject are required.",
    });
  }
  return {
    identityProvider: record.identityProvider.trim(),
    subject: record.subject.trim(),
  };
}

function requireUuid(value: string, name: string): void {
  if (!uuidPattern.test(value)) {
    throw new BadRequestException({
      code: "INVALID_SESSION_REFERENCE",
      message: `${name} must be a UUID.`,
    });
  }
}
