import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { OutboundExecutionController } from "../../apps/api/src/execution/outbound-execution.controller";
import { DeterministicOutboundExecutor } from "../../src/application/execution/outbound-execution";

const taskId = "c0000000-0000-4000-8000-000000000001";
const validBody = {
  equipmentId: "AMR-01",
  confirmedAction: "execute_outbound_task",
  confirmationReason: "Operator verified allocation and shipping route.",
};

describe("outbound execution HTTP contract", () => {
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
      controllers: [OutboundExecutionController],
      providers: [
        ServiceTokenGuard,
        { provide: DeterministicOutboundExecutor, useValue: executor },
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
      .post(`/api/v1/outbound-transport-tasks/${taskId}/execute`)
      .set("X-Operator-Id", "outbound-operator")
      .send(validBody);
    expect(response.status).toBe(401);
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("requires exact confirmation, reason, and operator identity", async () => {
    const authorization = `Bearer ${process.env.API_SERVICE_TOKEN}`;
    const wrongAction = await request(app.getHttpServer())
      .post(`/api/v1/outbound-transport-tasks/${taskId}/execute`)
      .set("Authorization", authorization)
      .set("X-Operator-Id", "outbound-operator")
      .send({ ...validBody, confirmedAction: "execute" });
    const missingOperator = await request(app.getHttpServer())
      .post(`/api/v1/outbound-transport-tasks/${taskId}/execute`)
      .set("Authorization", authorization)
      .send(validBody);

    expect(wrongAction.status).toBe(400);
    expect(missingOperator.status).toBe(400);
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("executes only after the authenticated operator confirms", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/outbound-transport-tasks/${taskId}/execute`)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .set("X-Operator-Id", "outbound-operator")
      .send(validBody);

    expect(response.status).toBe(200);
    expect(executor.execute).toHaveBeenCalledWith({
      taskId,
      equipmentId: "AMR-01",
      actorId: "outbound-operator",
      confirmationReason: validBody.confirmationReason,
    });
  });
});
