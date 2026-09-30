import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditProjectionService } from "../../apps/api/src/audit/audit-projection.service";
import { AuditController } from "../../apps/api/src/audit/audit.controller";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { operationalAccessHeaders } from "../../src/infrastructure/http/operational-access-headers";
import {
  testOperationalAccess,
  testWarehouseId,
} from "../fixtures/operational-access";

describe("audit events HTTP contract", () => {
  let app: INestApplication;
  const audit = { list: vi.fn() };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "audit.view";
    vi.clearAllMocks();
    audit.list.mockResolvedValue({ events: [], nextCursor: null });
    const testingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        ServiceTokenGuard,
        { provide: AuditProjectionService, useValue: audit },
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

  it("requires authentication and the dedicated audit permission", async () => {
    const unauthenticated = await request(app.getHttpServer()).get(
      "/api/v1/audit-events",
    );
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    const forbidden = await request(app.getHttpServer())
      .get("/api/v1/audit-events")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(testOperationalAccess));

    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(audit.list).not.toHaveBeenCalled();
  });

  it("forwards only bounded exact filters to the projection", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/audit-events")
      .query({
        cursor: "opaque-cursor",
        limit: "25",
        resourceType: "TransportTask",
        resourceId: "50000000-0000-4000-8000-000000000001",
        correlationId: "request:workflow-001",
      })
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set(operationalAccessHeaders(testOperationalAccess));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ events: [], nextCursor: null });
    expect(audit.list).toHaveBeenCalledWith(testWarehouseId, {
      cursor: "opaque-cursor",
      limit: 25,
      resourceType: "TransportTask",
      resourceId: "50000000-0000-4000-8000-000000000001",
      correlationId: "request:workflow-001",
    });
  });
});
