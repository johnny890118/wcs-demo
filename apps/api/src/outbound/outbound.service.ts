import { createHash, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  OUTBOUND_REPOSITORY,
  type CreateOutboundOrder,
  type OutboundOrderResult,
  type OutboundRepository,
} from "./outbound.types";

@Injectable()
export class OutboundService {
  constructor(
    @Inject(OUTBOUND_REPOSITORY)
    private readonly repository: OutboundRepository,
  ) {}

  create(command: CreateOutboundOrder): Promise<OutboundOrderResult> {
    const requestHash = createHash("sha256")
      .update(JSON.stringify(command))
      .digest("hex");

    return this.repository.create(
      command,
      {
        outboundOrderId: randomUUID(),
        outboxEventId: randomUUID(),
        auditEventId: randomUUID(),
      },
      requestHash,
    );
  }
}
