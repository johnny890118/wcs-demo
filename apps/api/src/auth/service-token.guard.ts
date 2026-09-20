import { timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import {
  REQUIRED_PERMISSION,
  REQUIRED_USER_PERMISSION,
  servicePermissions,
  type ServicePermission,
} from "./permissions";
import { requireForwardedUserAccess } from "./user-access";

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.API_SERVICE_TOKEN;
    if (!expected) {
      throw new Error("API_SERVICE_TOKEN is required for protected endpoints.");
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header("authorization") ?? "";
    const provided = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "A valid service token is required.",
      });
    }
    const required = this.reflector.getAllAndOverride<
      ServicePermission | undefined
    >(REQUIRED_PERMISSION, [context.getHandler(), context.getClass()]);
    if (!required) {
      throw new Error(
        "Protected endpoints must declare one required service permission.",
      );
    }
    const configured = new Set(
      (process.env.API_SERVICE_PERMISSIONS ?? "")
        .split(",")
        .map((permission) => permission.trim())
        .filter((permission) =>
          servicePermissions.includes(permission as ServicePermission),
        ),
    );
    if (!configured.has(required)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: `Service identity lacks permission ${required}.`,
      });
    }
    const requiredUserPermission = this.reflector.getAllAndOverride<
      import("../../../../src/application/access/operational-access").UserPermission
    >(REQUIRED_USER_PERMISSION, [context.getHandler(), context.getClass()]);
    if (requiredUserPermission) {
      requireForwardedUserAccess(request, requiredUserPermission);
    }
    return true;
  }
}
