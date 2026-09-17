import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { InboundController } from "./inbound.controller";
import { InboundService } from "./inbound.service";
import { PgInboundRepository } from "./pg-inbound.repository";
import { INBOUND_REPOSITORY } from "./inbound.types";

@Module({
  controllers: [InboundController],
  providers: [
    InboundService,
    ServiceTokenGuard,
    PgInboundRepository,
    { provide: INBOUND_REPOSITORY, useExisting: PgInboundRepository },
  ],
})
export class InboundModule {}
