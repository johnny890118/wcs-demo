import { createHash, randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import {
  INBOUND_REPOSITORY,
  type CreateInboundReceipt,
  type InboundReceiptResult,
  type InboundRepository,
} from "./inbound.types";

@Injectable()
export class InboundService {
  constructor(
    @Inject(INBOUND_REPOSITORY)
    private readonly repository: InboundRepository,
  ) {}

  create(command: CreateInboundReceipt): Promise<InboundReceiptResult> {
    const requestHash = createHash("sha256")
      .update(JSON.stringify(command))
      .digest("hex");

    return this.repository.create(
      command,
      {
        receiptId: randomUUID(),
        loadId: randomUUID(),
        transportTaskId: randomUUID(),
        outboxEventId: randomUUID(),
        auditEventId: randomUUID(),
      },
      requestHash,
    );
  }
}
