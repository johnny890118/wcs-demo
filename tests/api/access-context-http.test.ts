import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessContextController } from "../../apps/api/src/access-context/access-context.controller";
import { AccessContextService } from "../../apps/api/src/access-context/access-context.service";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { operationalAccessHeaders } from "../../src/infrastructure/http/operational-access-headers";
import { testOperationalAccess } from "../fixtures/operational-access";

const targetWarehouseId = "20000000-0000-4000-8000-000000000001";
const outsideWarehouseId = "30000000-0000-4000-8000-000000000001";
const multiWarehouseAccess = {
  ...testOperationalAccess,
  principal: {
    ...testOperationalAccess.principal,
    warehouseScopes: [
      ...testOperationalAccess.principal.warehouseScopes,
      {
        warehouseId: targetWarehouseId,
        code: "SECOND",
        name: "Second Warehouse",
      },
    ],
  },
};

describe("warehouse context HTTP contract", () => {
  let app: INestApplication;
  const context = { changeWarehouse: vi.fn() };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    vi.clearAllMocks();
    context.changeWarehouse.mockResolvedValue({
      currentWarehouseId: targetWarehouseId,
    });
    const testingModule = await Test.createTestingModule({
      controllers: [AccessContextController],
      providers: [
        ServiceTokenGuard,
        { provide: AccessContextService, useValue: context },
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

  it("records a switch only to a different warehouse already in scope", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/access-context/warehouse")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(multiWarehouseAccess))
      .send({ targetWarehouseId });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ currentWarehouseId: targetWarehouseId });
    expect(context.changeWarehouse).toHaveBeenCalledWith(
      expect.objectContaining({
        principal: testOperationalAccess.principal.subject,
        currentWarehouseId: testOperationalAccess.currentWarehouseId,
        warehouseScopes: [
          testOperationalAccess.currentWarehouseId,
          targetWarehouseId,
        ],
      }),
      targetWarehouseId,
    );
  });

  it("fails closed for missing service auth, invalid targets, and out-of-scope targets", async () => {
    const headers = operationalAccessHeaders(multiWarehouseAccess);
    const unauthenticated = await request(app.getHttpServer())
      .post("/api/v1/access-context/warehouse")
      .set(headers)
      .send({ targetWarehouseId });
    const malformed = await request(app.getHttpServer())
      .post("/api/v1/access-context/warehouse")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(headers)
      .send({ targetWarehouseId: "not-a-uuid" });
    const outOfScope = await request(app.getHttpServer())
      .post("/api/v1/access-context/warehouse")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(headers)
      .send({ targetWarehouseId: outsideWarehouseId });
    const unchanged = await request(app.getHttpServer())
      .post("/api/v1/access-context/warehouse")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(headers)
      .send({
        targetWarehouseId: testOperationalAccess.currentWarehouseId,
      });

    expect(unauthenticated.status).toBe(401);
    expect(malformed.status).toBe(400);
    expect(outOfScope.status).toBe(403);
    expect(unchanged.status).toBe(400);
    expect(context.changeWarehouse).not.toHaveBeenCalled();
  });
});
