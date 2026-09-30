import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanAccessAssignmentController } from "../../apps/api/src/access-context/human-access-assignment.controller";
import { HumanAccessAssignmentService } from "../../apps/api/src/access-context/human-access-assignment.service";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { testOperationalAccess } from "../fixtures/operational-access";

const session = {
  sessionId: "90000000-0000-4000-8000-000000000099",
  expiresAt: "2099-01-01T00:00:00.000Z",
};

describe("persisted human access session HTTP contract", () => {
  let app: INestApplication;
  const assignments = {
    issue: vi.fn(),
    validate: vi.fn(),
    revoke: vi.fn(),
  };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "access.resolve";
    vi.clearAllMocks();
    assignments.issue.mockResolvedValue({
      access: testOperationalAccess,
      session,
    });
    assignments.validate.mockResolvedValue({
      access: testOperationalAccess,
      session,
    });
    assignments.revoke.mockResolvedValue({ revoked: true });
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

  it("issues and revalidates a bounded human session", async () => {
    const issued = await authorizedPost(
      "/api/v1/access-context/human/sessions",
      {
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      },
    );
    const validated = await authorizedPost(
      `/api/v1/access-context/human/sessions/${session.sessionId}/validate`,
      {
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
        currentWarehouseId: testOperationalAccess.currentWarehouseId,
      },
    );

    expect(issued.status).toBe(201);
    expect(validated.status).toBe(201);
    expect(issued.body).toEqual({ access: testOperationalAccess, session });
    expect(assignments.issue).toHaveBeenCalledWith(
      "demo-credentials",
      "legacy-demo-admin",
    );
    expect(assignments.validate).toHaveBeenCalledWith(
      session.sessionId,
      "demo-credentials",
      "legacy-demo-admin",
      testOperationalAccess.currentWarehouseId,
    );
  });

  it("revokes with an explicit known reason and authenticated service actor", async () => {
    const response = await authorizedPost(
      `/api/v1/access-context/human/sessions/${session.sessionId}/revoke`,
      { reason: "administrative" },
    );

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ revoked: true });
    expect(assignments.revoke).toHaveBeenCalledWith(
      session.sessionId,
      "administrative",
      "test-bff",
    );
  });

  it("rejects unauthenticated, unauthorized, and malformed requests", async () => {
    const unauthenticated = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/sessions")
      .send({
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      });
    process.env.API_SERVICE_PERMISSIONS = "operations.view";
    const unauthorized = await authorizedPost(
      "/api/v1/access-context/human/sessions",
      {
        identityProvider: "demo-credentials",
        subject: "legacy-demo-admin",
      },
    );
    process.env.API_SERVICE_PERMISSIONS = "access.resolve";
    const malformed = await authorizedPost(
      "/api/v1/access-context/human/sessions/not-a-uuid/validate",
      { identityProvider: "", subject: "legacy-demo-admin" },
    );

    expect(unauthenticated.status).toBe(401);
    expect(unauthorized.status).toBe(403);
    expect(malformed.status).toBe(400);
    expect(assignments.issue).not.toHaveBeenCalled();
  });

  function authorizedPost(path: string, body: object) {
    return request(app.getHttpServer())
      .post(path)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send(body);
  }
});
