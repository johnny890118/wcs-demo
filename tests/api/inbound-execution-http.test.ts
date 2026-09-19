import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { ExecutionController } from "../../apps/api/src/execution/execution.controller";
import { DeterministicInboundExecutor } from "../../src/application/execution/inbound-execution";

const taskId = "50000000-0000-4000-8000-000000000001";
const validBody = {
  equipmentId: "AMR-01",
  confirmedAction: "execute_inbound_task",
  confirmationReason: "Operator verified route and current telemetry.",
};

describe("inbound execution HTTP contract", () => {
  let app: INestApplication;
  const executor = { execute: vi.fn() };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_PERMISSIONS = "transport.execute";
    executor.execute.mockResolvedValue({
      taskId,
      equipmentId: "AMR-01",
      status: "completed",
      completedAt: 5_000,
    });
    const testingModule = await Test.createTestingModule({
      controllers: [ExecutionController],
      providers: [
        ServiceTokenGuard,
        { provide: DeterministicInboundExecutor, useValue: executor },
      ],
    }).compile();
    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    delete process.env.API_SERVICE_TOKEN;
    delete process.env.API_SERVICE_PERMISSIONS;
    await app.close();
  });

  it("rejects unauthenticated execution", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/execute`)
      .set("X-Operator-Id", "operator@example.test")
      .send(validBody);
    expect(response.status).toBe(401);
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("requires exact confirmation, reason, and operator identity", async () => {
    const authorization = `Bearer ${process.env.API_SERVICE_TOKEN}`;
    const wrongAction = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/execute`)
      .set("Authorization", authorization)
      .set("X-Operator-Id", "operator@example.test")
      .send({ ...validBody, confirmedAction: "execute" });
    const missingOperator = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/execute`)
      .set("Authorization", authorization)
      .send(validBody);

    expect(wrongAction.status).toBe(400);
    expect(missingOperator.status).toBe(400);
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("executes only after the authenticated operator confirms", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/execute`)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("X-Operator-Id", "operator@example.test")
      .send(validBody);

    expect(response.status).toBe(200);
    expect(executor.execute).toHaveBeenCalledWith({
      taskId,
      equipmentId: "AMR-01",
      actorId: "operator@example.test",
      confirmationReason: validBody.confirmationReason,
    });
  });
});
