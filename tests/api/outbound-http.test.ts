import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { OutboundController } from "../../apps/api/src/outbound/outbound.controller";
import { InsufficientInventoryError } from "../../apps/api/src/outbound/outbound.errors";
import { OutboundService } from "../../apps/api/src/outbound/outbound.service";
import {
  OUTBOUND_REPOSITORY,
  type OutboundRepository,
} from "../../apps/api/src/outbound/outbound.types";

const validBody = {
  externalReference: "SO-2026-0001",
  sku: "SKU-CHAIR-BLACK",
  quantity: 5,
  destinationLocationId: "20000000-0000-4000-8000-000000000003",
};

describe("outbound HTTP contract", () => {
  let app: INestApplication;
  let repository: OutboundRepository;

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_PERMISSIONS = "outbound.create";
    repository = {
      create: vi.fn(async () => ({
        outboundOrderId: "a0000000-0000-4000-8000-000000000001",
        allocationIds: ["b0000000-0000-4000-8000-000000000001"],
        transportTaskIds: ["c0000000-0000-4000-8000-000000000001"],
        status: "allocated" as const,
        duplicate: false,
      })),
    };

    const testingModule = await Test.createTestingModule({
      controllers: [OutboundController],
      providers: [
        OutboundService,
        ServiceTokenGuard,
        { provide: OUTBOUND_REPOSITORY, useValue: repository },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    delete process.env.API_SERVICE_TOKEN;
    delete process.env.API_SERVICE_PERMISSIONS;
    await app.close();
  });

  it("rejects an unauthenticated allocation request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/outbound-orders")
      .set("Idempotency-Key", "outbound-request-0001")
      .send(validBody);

    expect(response.status).toBe(401);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("validates quantity, destination, and idempotency key", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/outbound-orders")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("X-Operator-Id", "outbound-operator")
      .set("Idempotency-Key", "short")
      .send({ ...validBody, quantity: 0, destinationLocationId: "shipping" });

    expect(response.status).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates one authenticated allocation contract", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/outbound-orders")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("X-Operator-Id", "outbound-operator")
      .set("Idempotency-Key", "outbound-request-0001")
      .send(validBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      status: "allocated",
      duplicate: false,
      allocationIds: [expect.any(String)],
      transportTaskIds: [expect.any(String)],
    });
    expect(repository.create).toHaveBeenCalledWith(
      {
        ...validBody,
        idempotencyKey: "outbound-request-0001",
        actorId: "outbound-operator",
      },
      expect.objectContaining({
        outboundOrderId: expect.any(String),
        outboxEventId: expect.any(String),
        auditEventId: expect.any(String),
      }),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("returns a stable conflict contract for insufficient inventory", async () => {
    vi.mocked(repository.create).mockRejectedValueOnce(
      new InsufficientInventoryError(validBody.sku, 5, 2),
    );

    const response = await request(app.getHttpServer())
      .post("/api/v1/outbound-orders")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("X-Operator-Id", "outbound-operator")
      .set("Idempotency-Key", "outbound-request-0001")
      .send(validBody);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: "INSUFFICIENT_INVENTORY" });
  });
});
