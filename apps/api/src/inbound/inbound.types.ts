export type CreateInboundReceipt = Readonly<{
  idempotencyKey: string;
  actorId: string;
  externalReference: string;
  load: Readonly<{
    externalId: string;
    sku: string;
    quantity: number;
  }>;
  sourceLocationId: string;
  destinationLocationId: string;
}>;

export type InboundReceiptResult = Readonly<{
  receiptId: string;
  loadId: string;
  transportTaskId: string;
  status: "requested";
  duplicate: boolean;
}>;

export type InboundIdentifiers = Readonly<{
  receiptId: string;
  loadId: string;
  transportTaskId: string;
  outboxEventId: string;
  auditEventId: string;
}>;

export const INBOUND_REPOSITORY = Symbol("INBOUND_REPOSITORY");

export interface InboundRepository {
  create(
    command: CreateInboundReceipt,
    identifiers: InboundIdentifiers,
    requestHash: string,
  ): Promise<InboundReceiptResult>;
}
