import { Global, Module } from "@nestjs/common";
import { JsonLogger } from "./json-logger";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ApiTimingInterceptor } from "./api-timing.interceptor";

@Global()
@Module({
  providers: [
    JsonLogger,
    { provide: APP_INTERCEPTOR, useClass: ApiTimingInterceptor },
  ],
  exports: [JsonLogger],
})
export class LoggingModule {}
