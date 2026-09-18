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
    process.env.API_SERVICE_PERMISSIONS =
      "alarm.inject,alarm.acknowledge,alarm.recover";
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
    delete process.env.API_SERVICE_PERMISSIONS;
    await app.close();
  });

  it("rejects unauthenticated fault injection", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .send({
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
        confirmedAction: "inject_fault",
        confirmationReason: "Controlled simulator fault drill.",
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
      .send({
        faultCode: "",
        severity: "urgent",
        message: " ",
        confirmedAction: "inject_fault",
        confirmationReason: " ",
      });
    const recoveryResponse = await request(app.getHttpServer())
      .post(`/api/v1/alarms/${alarmId}/recover`)
      .set(headers)
      .send({
        strategy: "retry",
        resolution: " ",
        confirmedAction: "retry_task",
        confirmationReason: " ",
      });

    expect(fault.status).toBe(400);
    expect(recoveryResponse.status).toBe(400);
    expect(recovery.injectFault).not.toHaveBeenCalled();
    expect(recovery.recover).not.toHaveBeenCalled();
  });

  it("denies a valid token without the endpoint permission", async () => {
    process.env.API_SERVICE_PERMISSIONS = "alarm.acknowledge";
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
        confirmedAction: "inject_fault",
        confirmationReason: "Controlled simulator fault drill.",
      });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ code: "FORBIDDEN" });
    expect(recovery.injectFault).not.toHaveBeenCalled();
  });

  it("requires an exact named confirmation for high-risk commands", async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/transport-tasks/${taskId}/faults`)
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({
        faultCode: "DRIVE_BLOCKED",
        severity: "critical",
        message: "Travel path is blocked.",
        confirmedAction: "recover",
        confirmationReason: "Controlled simulator fault drill.",
      });

    expect(response.status).toBe(400);
    expect(recovery.injectFault).not.toHaveBeenCalled();
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
        confirmedAction: "inject_fault",
        confirmationReason: "Controlled simulator fault drill.",
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
        confirmedAction: "release_task",
        confirmationReason: "Supervisor approved vehicle isolation.",
      });

    expect(fault.status).toBe(201);
    expect(acknowledgement.status).toBe(200);
    expect(recovered.status).toBe(200);
    expect(recovery.injectFault).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId,
        actorId: "test-operations-console",
        confirmationReason: "Controlled simulator fault drill.",
      }),
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
      confirmationReason: "Supervisor approved vehicle isolation.",
    });
  });
});
