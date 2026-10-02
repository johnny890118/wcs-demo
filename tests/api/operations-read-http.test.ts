import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { OperationsController } from "../../apps/api/src/operations/operations.controller";
import { OperationsSummaryService } from "../../apps/api/src/operations/operations-summary.service";
import { operationalAccessHeaders } from "../../src/infrastructure/http/operational-access-headers";
import {
  testOperationalAccess,
  testWarehouseId,
} from "../fixtures/operational-access";

describe("warehouse-scoped operations read HTTP contract", () => {
  let app: INestApplication;
  const summaries = {
    getSummary: vi.fn(),
    getDetails: vi.fn(),
    getHome: vi.fn(),
    getOverview: vi.fn(),
    getLiveView: vi.fn(),
  };
  const serviceToken = "test-service-token-with-safe-length";

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = serviceToken;
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    vi.clearAllMocks();
    summaries.getSummary.mockResolvedValue({
      counts: {
        activeTasks: 0,
        storedInventory: 0,
        openReceipts: 0,
        configuredEquipment: 0,
      },
      topology: null,
      recentTasks: [],
      generatedAt: "2026-09-21T00:00:00.000Z",
    });
    summaries.getDetails.mockResolvedValue({
      tasks: [],
      equipment: [],
      inventory: [],
      alarms: [],
      locations: [],
      topology: null,
      generatedAt: "2026-09-21T00:00:00.000Z",
    });
    const testingModule = await Test.createTestingModule({
      controllers: [OperationsController],
      providers: [
        ServiceTokenGuard,
        { provide: OperationsSummaryService, useValue: summaries },
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

  function authorized(path: string) {
    let pending = request(app.getHttpServer())
      .get(path)
      .set("Authorization", `Bearer ${serviceToken}`);
    for (const [name, value] of Object.entries(
      operationalAccessHeaders(testOperationalAccess),
    )) {
      pending = pending.set(name, value);
    }
    return pending;
  }

  it("requires both the service identity and forwarded user context", async () => {
    const serviceOnly = await request(app.getHttpServer())
      .get("/api/v1/operations/summary")
      .set("Authorization", `Bearer ${serviceToken}`);
    expect(serviceOnly.status).toBe(401);
    expect(serviceOnly.body.code).toBe("INVALID_USER_CONTEXT");
    expect(summaries.getSummary).not.toHaveBeenCalled();
  });

  it("rejects insufficient user permission and out-of-scope warehouses", async () => {
    const noPermission = {
      ...testOperationalAccess,
      principal: {
        ...testOperationalAccess.principal,
        permissions: ["audit.view"] as const,
      },
    };
    let permissionRequest = request(app.getHttpServer())
      .get("/api/v1/operations/summary")
      .set("Authorization", `Bearer ${serviceToken}`);
    for (const [name, value] of Object.entries(
      operationalAccessHeaders(noPermission),
    )) {
      permissionRequest = permissionRequest.set(name, value);
    }
    const forbidden = await permissionRequest;
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe("USER_PERMISSION_FORBIDDEN");

    const outside = await authorized("/api/v1/operations/summary").set(
      "X-SWP-Warehouse",
      "20000000-0000-4000-8000-000000000001",
    );
    expect(outside.status).toBe(403);
    expect(outside.body.code).toBe("WAREHOUSE_SCOPE_FORBIDDEN");
  });

  it("passes the validated current warehouse to both projections", async () => {
    expect((await authorized("/api/v1/operations/summary")).status).toBe(200);
    expect((await authorized("/api/v1/operations/details")).status).toBe(200);
    expect(summaries.getSummary).toHaveBeenCalledWith(testWarehouseId);
    expect(summaries.getDetails).toHaveBeenCalledWith(testWarehouseId);
    expect((await authorized("/api/v1/operations/home")).status).toBe(200);
    expect(summaries.getHome).toHaveBeenCalledWith(testWarehouseId);
    expect((await authorized("/api/v1/operations/overview")).status).toBe(200);
    expect(summaries.getOverview).toHaveBeenCalledWith(testWarehouseId);
    expect((await authorized("/api/v1/operations/live-view")).status).toBe(200);
    expect(summaries.getLiveView).toHaveBeenCalledWith(testWarehouseId);
  });

  it.each(["home", "overview", "live-view"])(
    "protects the %s projection with the same permission and scope boundary",
    async (projection) => {
      expect(
        (
          await request(app.getHttpServer()).get(
            `/api/v1/operations/${projection}`,
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await authorized(`/api/v1/operations/${projection}`).set(
            "X-SWP-Warehouse",
            "20000000-0000-4000-8000-000000000001",
          )
        ).status,
      ).toBe(403);
      expect(summaries.getHome).not.toHaveBeenCalled();
      expect(summaries.getOverview).not.toHaveBeenCalled();
      expect(summaries.getLiveView).not.toHaveBeenCalled();
    },
  );
});
