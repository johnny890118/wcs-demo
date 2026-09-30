import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { InboundController } from "../../apps/api/src/inbound/inbound.controller";
import { InboundService } from "../../apps/api/src/inbound/inbound.service";
import {
  INBOUND_REPOSITORY,
  type InboundRepository,
} from "../../apps/api/src/inbound/inbound.types";
import { operationalAccessHeaders } from "../../src/infrastructure/http/operational-access-headers";
import type { OperationalAccess } from "../../src/application/access/operational-access";
import {
  testOperationalAccess,
  testWarehouseId,
} from "../fixtures/operational-access";

const validBody = {
  externalReference: "ASN-2026-0001",
  load: {
    externalId: "PALLET-0001",
    sku: "SKU-CHAIR-BLACK",
    quantity: 12,
  },
  sourceLocationId: "20000000-0000-4000-8000-000000000001",
  destinationLocationId: "20000000-0000-4000-8000-000000000002",
};

describe("inbound HTTP contract", () => {
  let app: INestApplication;
  let repository: InboundRepository;

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-web";
    process.env.API_SERVICE_PERMISSIONS = "inbound.create";
    repository = {
      create: vi.fn(async () => ({
        receiptId: "30000000-0000-4000-8000-000000000001",
        loadId: "40000000-0000-4000-8000-000000000001",
        transportTaskId: "50000000-0000-4000-8000-000000000001",
        status: "requested" as const,
        duplicate: false,
      })),
    };

    const testingModule = await Test.createTestingModule({
      controllers: [InboundController],
      providers: [
        InboundService,
        ServiceTokenGuard,
        { provide: INBOUND_REPOSITORY, useValue: repository },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    delete process.env.API_SERVICE_TOKEN;
    delete process.env.API_SERVICE_ID;
    delete process.env.API_SERVICE_PERMISSIONS;
    await app.close();
  });

  it("rejects an unauthenticated mutation", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Idempotency-Key", "request-0001")
      .send(validBody);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("validates the idempotency key and inbound payload", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(testOperationalAccess))
      .set("Idempotency-Key", "short")
      .send({ ...validBody, load: { ...validBody.load, quantity: 0 } });

    expect(response.status).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("creates one transactional inbound request contract", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(testOperationalAccess))
      .set("Idempotency-Key", "request-0001")
      .send(validBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      receiptId: "30000000-0000-4000-8000-000000000001",
      status: "requested",
      duplicate: false,
    });
    expect(repository.create).toHaveBeenCalledWith(
      {
        ...validBody,
        idempotencyKey: "request-0001",
        actorId: testOperationalAccess.principal.subject,
        actorType: "user",
        warehouseId: testWarehouseId,
      },
      expect.objectContaining({
        receiptId: expect.any(String),
        loadId: expect.any(String),
        transportTaskId: expect.any(String),
        outboxEventId: expect.any(String),
        auditEventId: expect.any(String),
      }),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
  });

  it("preserves anonymous-demo actor and session scope at the API boundary", async () => {
    const anonymousAccess = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        kind: "anonymous_demo" as const,
        subject: "anonymous-demo:90000000-0000-4000-8000-000000000099",
      },
      demoSessionScope: {
        sessionId: "90000000-0000-4000-8000-000000000099",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    } satisfies OperationalAccess;

    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(anonymousAccess))
      .set("Idempotency-Key", "anonymous-request-0001")
      .send(validBody);

    expect(response.status).toBe(201);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: anonymousAccess.principal.subject,
        actorType: "anonymous_demo",
        warehouseId: testWarehouseId,
      }),
      expect.any(Object),
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );

    const missingScope = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set({
        ...operationalAccessHeaders(anonymousAccess),
        "X-SWP-Demo-Session-Expires-At": "",
      })
      .set("Idempotency-Key", "anonymous-request-0002")
      .send(validBody);
    expect(missingScope.status).toBe(401);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("requires the forwarded authenticated user context", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("Idempotency-Key", "request-operator-required")
      .send(validBody);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("INVALID_USER_CONTEXT");
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("revalidates the user permission at the API boundary", async () => {
    const withoutInboundPermission = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        permissions: ["operations.view"] as const,
      },
    };
    const response = await request(app.getHttpServer())
      .post("/api/v1/inbound-receipts")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(withoutInboundPermission))
      .set("Idempotency-Key", "request-permission-required")
      .send(validBody);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("USER_PERMISSION_FORBIDDEN");
    expect(repository.create).not.toHaveBeenCalled();
  });
});
