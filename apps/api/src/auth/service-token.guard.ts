import { timingSafeEqual } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class ServiceTokenGuard implements CanActivate {
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
    return true;
  }
}
