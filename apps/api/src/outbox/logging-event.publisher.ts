import { Injectable } from "@nestjs/common";
import type {
  EventPublisher,
  OutboxEvent,
} from "../../../../src/application/outbox/outbox";
import { JsonLogger } from "../logging/json-logger";

@Injectable()
export class LoggingEventPublisher implements EventPublisher {
  constructor(private readonly logger: JsonLogger) {}

  async publish(event: OutboxEvent): Promise<void> {
    this.logger.log(
      {
        event: "outbox.publish",
        eventId: event.id,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
      },
      LoggingEventPublisher.name,
    );
  }
}
