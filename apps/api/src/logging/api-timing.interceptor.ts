import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { tap } from "rxjs";
import {
  recordRequestTiming,
  requestTimingHeader,
} from "../../../../src/infrastructure/http/request-timing";

@Injectable()
export class ApiTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const started = performance.now();
    const response = context.switchToHttp().getResponse<Response>();
    let recorded = false;
    const record = () => {
      if (recorded) return;
      recorded = true;
      recordRequestTiming("api_handler", performance.now() - started);
      if (!response.headersSent) {
        response.setHeader("Server-Timing", requestTimingHeader());
      }
    };
    return next.handle().pipe(tap({ next: record, error: record }));
  }
}
