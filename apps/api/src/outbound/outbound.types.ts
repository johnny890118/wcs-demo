import type { AuditActorType } from "../../../../src/application/audit/audit-actor";

export type CreateOutboundOrder = Readonly<{
  idempotencyKey: string;
  actorId: string;
  actorType: Extract<AuditActorType, "user" | "anonymous_demo">;
  warehouseId: string;
  externalReference: string;
  sku: string;
  quantity: number;
  destinationLocationId: string;
}>;

export type OutboundOrderResult = Readonly<{
  outboundOrderId: string;
  allocationIds: readonly string[];
  transportTaskIds: readonly string[];
  status: "allocated";
  duplicate: boolean;
}>;

export type OutboundIdentifiers = Readonly<{
  outboundOrderId: string;
  outboxEventId: string;
  auditEventId: string;
}>;

export const OUTBOUND_REPOSITORY = Symbol("OUTBOUND_REPOSITORY");

export interface OutboundRepository {
  create(
    command: CreateOutboundOrder,
    identifiers: OutboundIdentifiers,
    requestHash: string,
  ): Promise<OutboundOrderResult>;
}
