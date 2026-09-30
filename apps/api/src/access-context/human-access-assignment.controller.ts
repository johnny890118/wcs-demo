import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { OperationalAccess } from "../../../../src/application/access/operational-access";
import { RequirePermission } from "../auth/permissions";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { HumanAccessAssignmentService } from "./human-access-assignment.service";

@Controller("v1/access-context/human")
@UseGuards(ServiceTokenGuard)
@RequirePermission("access.resolve")
export class HumanAccessAssignmentController {
  constructor(private readonly assignments: HumanAccessAssignmentService) {}

  @Post("resolve")
  resolve(@Body() body: unknown): Promise<OperationalAccess> {
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
    return this.assignments.resolve(
      record.identityProvider.trim(),
      record.subject.trim(),
    );
  }
}
