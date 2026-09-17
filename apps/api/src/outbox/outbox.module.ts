import { Module } from "@nestjs/common";
import { OutboxProcessor } from "../../../../src/application/outbox/outbox";
import { LoggingEventPublisher } from "./logging-event.publisher";
import { OutboxWorker, createOutboxWorkerId } from "./outbox.worker";
import { PgOutboxRepository } from "./pg-outbox.repository";

@Module({
  providers: [
    PgOutboxRepository,
    LoggingEventPublisher,
    {
      provide: OutboxProcessor,
      useFactory: (
        repository: PgOutboxRepository,
        publisher: LoggingEventPublisher,
      ) => new OutboxProcessor(repository, publisher, createOutboxWorkerId()),
      inject: [PgOutboxRepository, LoggingEventPublisher],
    },
    OutboxWorker,
  ],
})
export class OutboxModule {}
