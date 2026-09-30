import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanAccessAssignmentController } from "../../apps/api/src/access-context/human-access-assignment.controller";
import { HumanAccessAssignmentService } from "../../apps/api/src/access-context/human-access-assignment.service";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { testOperationalAccess } from "../fixtures/operational-access";

describe("persisted human access assignment HTTP contract", () => {
  let app: INestApplication;
  const assignments = { resolve: vi.fn() };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "access.resolve";
    vi.clearAllMocks();
    assignments.resolve.mockResolvedValue(testOperationalAccess);
    const testingModule = await Test.createTestingModule({
      controllers: [HumanAccessAssignmentController],
      providers: [
        ServiceTokenGuard,
        { provide: HumanAccessAssignmentService, useValue: assignments },
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

  it("requires the dedicated service permission and resolves a bounded identity", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/resolve")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(testOperationalAccess);
    expect(assignments.resolve).toHaveBeenCalledWith(
      "demo-credentials",
      "legacy-demo-admin",
    );
  });

  it("rejects unauthenticated, unauthorized, and malformed requests", async () => {
    const unauthenticated = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/resolve")
      .send({
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      });
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    const unauthorized = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/resolve")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      });
    process.env.API_SERVICE_PERMISSIONS = "access.resolve";
    const malformed = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/resolve")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({ identityProvider: "", subject: "legacy-demo-admin" });

    expect(unauthenticated.status).toBe(401);
    expect(unauthorized.status).toBe(403);
    expect(malformed.status).toBe(400);
    expect(assignments.resolve).not.toHaveBeenCalled();
  });
});
