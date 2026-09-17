import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { requestContext } from "./request-context";

const safeRequestId = /^[A-Za-z0-9._:-]{8,100}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const supplied = request.header("x-request-id");
    const requestId =
      supplied && safeRequestId.test(supplied) ? supplied : randomUUID();
    response.setHeader("X-Request-Id", requestId);
    requestContext.run({ requestId }, next);
  }
}
