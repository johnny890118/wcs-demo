import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { HumanLoginAttemptDecision } from "../../../../src/application/access/login-protection";
import { RequirePermission } from "../auth/permissions";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { HumanLoginProtectionService } from "./human-login-protection.service";

const fingerprintPattern = /^[0-9a-f]{64}$/;

@Controller("v1/access-context/human/login-attempts")
@UseGuards(ServiceTokenGuard)
@RequirePermission("access.resolve")
export class HumanLoginProtectionController {
  constructor(private readonly protection: HumanLoginProtectionService) {}

  @Post("evaluate")
  evaluate(@Body() body: unknown): Promise<HumanLoginAttemptDecision> {
    const record =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    if (
      typeof record.identityProvider !== "string" ||
      record.identityProvider.trim().length === 0 ||
      record.identityProvider.length > 80 ||
      typeof record.identifierFingerprint !== "string" ||
      !fingerprintPattern.test(record.identifierFingerprint) ||
      typeof record.accepted !== "boolean"
    ) {
      throw new BadRequestException({
        code: "INVALID_LOGIN_ATTEMPT",
        message: "A bounded opaque login attempt is required.",
      });
    }
    return this.protection.evaluate(
      record.identityProvider.trim(),
      record.identifierFingerprint,
      record.accepted,
    );
  }
}
