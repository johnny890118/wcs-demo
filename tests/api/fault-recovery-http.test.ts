import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";
import { FaultRecoveryController } from "../../apps/api/src/execution/fault-recovery.controller";
import { FaultRecoveryService } from "../../src/application/recovery/fault-recovery";

const taskId = "50000000-0000-4000-8000-000000000001";
const alarmId = "80000000-0000-4000-8000-000000000001";

describe("fault recovery HTTP contract", () => {
  let app: INestApplication;
  const recovery = {
    injectFault: vi.fn(),
    acknowledge: vi.fn(),
    recover: vi.fn(),
  };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-operations-console";
    vi.clearAllMocks();
    recovery.injectFault.mockResolvedValue({
      alarmId,
      taskId,
      status: "active",
    });
    recovery.acknowledge.mockResolvedValue({
      alarmId,
      taskId,
      status: "acknowledged",
    });
    recovery.recover.mockResolvedValue({
      taskId,
      status: "queued",
      equipmentId: null,
      blockingAlarmId: null,
      version: 4,
    });

    const testingModule = await Test.createTestingModule({
      controllers: [FaultRecoveryController],
      providers: [
        ServiceTokenGuard,
        { provide: FaultRecoveryService, useValue: recovery },
      ],
    }).compile();
    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    delete process.env.API_SERVICE_TOKEN;
    delete process.env.API_SERVICE_ID;
    await app.close();
  });

  it("rejects unauthenticated fault injection", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .send({
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
      });
    expect(response.status).toBe(401);
    expect(recovery.injectFault).not.toHaveBeenCalled();
  });

  it("validates fault and recovery commands before dispatch", async () => {
    const headers = {
      Authorization: `Bearer ${process.env.API_SERVICE_TOKEN}`,
    };
    const fault = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .set(headers)
      .send({ faultCode: "", severity: "urgent", message: " " });
    const recoveryResponse = await request(app.getHttpServer())
      .post(`/api/v1/alarms/${alarmId}/recover`)
      .set(headers)
      .send({ strategy: "retry", resolution: " " });

    expect(fault.status).toBe(400);
    expect(recoveryResponse.status).toBe(400);
    expect(recovery.injectFault).not.toHaveBeenCalled();
    expect(recovery.recover).not.toHaveBeenCalled();
  });

  it("exposes authenticated fault, acknowledgement, and release operations", async () => {
    const headers = {
      Authorization: `Bearer ${process.env.API_SERVICE_TOKEN}`,
    };
    const fault = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .set(headers)
      .send({
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
      });
    const acknowledgement = await request(app.getHttpServer())
      .post(`/api/v1/alarms/${alarmId}/acknowledge`)
      .set(headers)
      .send();
    const recovered = await request(app.getHttpServer())
      .post(`/api/v1/alarms/${alarmId}/recover`)
      .set(headers)
      .send({
        strategy: "release",
        resolution: "Vehicle released; task ready for reassignment.",
      });

    expect(fault.status).toBe(201);
    expect(acknowledgement.status).toBe(200);
    expect(recovered.status).toBe(200);
    expect(recovery.injectFault).toHaveBeenCalledWith(
      expect.objectContaining({ taskId, actorId: "test-operations-console" }),
    );
    expect(recovery.acknowledge).toHaveBeenCalledWith({
      alarmId,
      actorId: "test-operations-console",
    });
    expect(recovery.recover).toHaveBeenCalledWith({
      alarmId,
      strategy: "release",
      resolution: "Vehicle released; task ready for reassignment.",
      actorId: "test-operations-console",
    });
  });
});
