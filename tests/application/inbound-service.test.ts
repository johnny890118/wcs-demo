import { describe, expect, it, vi } from "vitest";
import { InboundService } from "../../apps/api/src/inbound/inbound.service";
import type { InboundRepository } from "../../apps/api/src/inbound/inbound.types";

describe("inbound application service", () => {
  it("generates unique aggregate identifiers and a stable request fingerprint", async () => {
    const create = vi.fn(async (_command, identifiers, _requestHash) => ({
      ...identifiers,
      status: "requested" as const,
      duplicate: false,
    }));
    const repository: InboundRepository = { create };
    const service = new InboundService(repository);
    const command = {
      idempotencyKey: "request-0001",
      actorId: "test-web",
      externalReference: "ASN-0001",
      load: { externalId: "PALLET-01", sku: "SKU-01", quantity: 1 },
      sourceLocationId: "20000000-0000-4000-8000-000000000001",
      destinationLocationId: "20000000-0000-4000-8000-000000000002",
    };

    await service.create(command);
    await service.create(command);

    const firstIdentifiers = create.mock.calls[0]?.[1];
    const secondIdentifiers = create.mock.calls[1]?.[1];
    expect(firstIdentifiers?.receiptId).not.toBe(secondIdentifiers?.receiptId);
    expect(create.mock.calls[0]?.[2]).toBe(create.mock.calls[1]?.[2]);
  });
});
