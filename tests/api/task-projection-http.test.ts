import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { TaskProjectionController } from "../../apps/api/src/operations/task-projection.controller";
import { TaskProjectionService } from "../../apps/api/src/operations/task-projection.service";
import { InventoryProjectionController } from "../../apps/api/src/operations/inventory-projection.controller";
import { InventoryProjectionService } from "../../apps/api/src/operations/inventory-projection.service";
import { operationalAccessHeaders } from "../../src/infrastructure/http/operational-access-headers";
import {
  testOperationalAccess,
  testWarehouseId,
} from "../fixtures/operational-access";

describe("task projection HTTP authorization", () => {
  let app: INestApplication;
  const service = { getQueue: vi.fn(), getDetail: vi.fn(), list: vi.fn() };
  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-task-projection-service-token";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    vi.clearAllMocks();
    const testingModule = await Test.createTestingModule({
      controllers: [TaskProjectionController, InventoryProjectionController],
      providers: [
        ServiceTokenGuard,
        { provide: TaskProjectionService, useValue: service },
        { provide: InventoryProjectionService, useValue: service },
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
  function authorized(path: string, access = testOperationalAccess) {
    let pending = request(app.getHttpServer())
      .get(path)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`);
    for (const [name, value] of Object.entries(
      operationalAccessHeaders(access),
    ))
      pending = pending.set(name, value);
    return pending;
  }
  it.each([
    "/api/v1/operations/inventory",
    "/api/v1/operations/tasks",
    "/api/v1/operations/tasks/50000000-0000-4000-8000-000000000001",
  ])(
    "denies missing identity, missing permission and foreign warehouse for %s",
    async (path) => {
      expect((await request(app.getHttpServer()).get(path)).status).toBe(401);
      expect(
        (
          await authorized(path, {
            ...testOperationalAccess,
            principal: {
              ...testOperationalAccess.principal,
              permissions: ["audit.view"],
            },
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await authorized(path).set(
            "X-SWP-Warehouse",
            "20000000-0000-4000-8000-000000000001",
          )
        ).status,
      ).toBe(403);
      expect(service.getQueue).not.toHaveBeenCalled();
      expect(service.getDetail).not.toHaveBeenCalled();
      expect(service.list).not.toHaveBeenCalled();
    },
  );
  it("passes only the guard-validated warehouse to queue and detail", async () => {
    expect(
      (await authorized("/api/v1/operations/tasks?view=all&limit=2")).status,
    ).toBe(200);
    expect(service.getQueue).toHaveBeenCalledWith(testWarehouseId, {
      view: "all",
      limit: "2",
    });
    expect(
      (
        await authorized(
          "/api/v1/operations/tasks/50000000-0000-4000-8000-000000000001",
        )
      ).status,
    ).toBe(200);
    expect(service.getDetail).toHaveBeenCalledWith(
      testWarehouseId,
      "50000000-0000-4000-8000-000000000001",
    );
  });
});
