import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { AccessContextController } from "./access-context.controller";
import { AccessContextService } from "./access-context.service";

@Module({
  controllers: [AccessContextController],
  providers: [AccessContextService, ServiceTokenGuard],
})
export class AccessContextModule {}
