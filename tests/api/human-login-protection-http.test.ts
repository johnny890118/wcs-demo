import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanLoginProtectionController } from "../../apps/api/src/access-context/human-login-protection.controller";
import { HumanLoginProtectionService } from "../../apps/api/src/access-context/human-login-protection.service";
import { ServiceTokenGuard } from "../../apps/api/src/auth/service-token.guard";

describe("human login protection HTTP contract", () => {
  let app: INestApplication;
  const protection = { evaluate: vi.fn() };

  beforeEach(async () => {
    process.env.API_SERVICE_TOKEN = "test-service-token-with-safe-length";
    process.env.API_SERVICE_ID = "test-bff";
    process.env.API_SERVICE_PERMISSIONS = "access.resolve";
    protection.evaluate.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: null,
    });
    const testingModule = await Test.createTestingModule({
      controllers: [HumanLoginProtectionController],
      providers: [
        ServiceTokenGuard,
        { provide: HumanLoginProtectionService, useValue: protection },
      ],
    }).compile();
    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    delete process.env.API_SERVICE_TOKEN;
    delete process.env.API_SERVICE_ID;
    delete process.env.API_SERVICE_PERMISSIONS;
    await app.close();
  });

  it("accepts only an opaque bounded credential decision", async () => {
    const body = {
      identityProvider: "demo-credentials",
      identifierFingerprint: "a".repeat(64),
      accepted: false,
    };
    const response = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/login-attempts/evaluate")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ allowed: false, retryAfterSeconds: null });
    expect(protection.evaluate).toHaveBeenCalledWith(
      "demo-credentials",
      body.identifierFingerprint,
      false,
    );
  });

  it("rejects raw or malformed identifier input", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/access-context/human/login-attempts/evaluate")
      .set("Authorization", `Bearer ${process.env.API_SERVICE_TOKEN}`)
      .send({
        identityProvider: "demo-credentials",
        identifierFingerprint: "operator@example.com",
        accepted: false,
      });

    expect(response.status).toBe(400);
    expect(protection.evaluate).not.toHaveBeenCalled();
  });
});
