import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { ExecutionModule } from "./execution/execution.module";
import { HealthController } from "./health/health.controller";
import { InboundModule } from "./inbound/inbound.module";
import { LoggingModule } from "./logging/logging.module";
import { RequestContextMiddleware } from "./logging/request-context.middleware";
import { ApiSecurityHeadersMiddleware } from "./security/api-security-headers.middleware";
import { RateLimitMiddleware } from "./security/rate-limit.middleware";
import { OutboxModule } from "./outbox/outbox.module";
import { OperationsModule } from "./operations/operations.module";
import { OutboundModule } from "./outbound/outbound.module";

@Module({
  imports: [
    LoggingModule,
    DatabaseModule,
    InboundModule,
    ExecutionModule,
    OutboxModule,
    OperationsModule,
    OutboundModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        RequestContextMiddleware,
        ApiSecurityHeadersMiddleware,
        RateLimitMiddleware,
      )
      .forRoutes("*");
  }
}
