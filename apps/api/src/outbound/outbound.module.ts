import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "../auth/service-token.guard";
import { OutboundController } from "./outbound.controller";
import { OutboundService } from "./outbound.service";
import { OUTBOUND_REPOSITORY } from "./outbound.types";
import { PgOutboundRepository } from "./pg-outbound.repository";

@Module({
  controllers: [OutboundController],
  providers: [
    OutboundService,
    ServiceTokenGuard,
    PgOutboundRepository,
    { provide: OUTBOUND_REPOSITORY, useExisting: PgOutboundRepository },
  ],
})
export class OutboundModule {}
