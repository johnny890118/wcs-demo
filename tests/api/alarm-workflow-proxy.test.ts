import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  acknowledgeAlarm: vi.fn(),
  recoverAlarm: vi.fn(),
  WcsCommandError: class WcsCommandError extends Error {
    constructor(
      readonly status: number,
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { getServerSession } from "next-auth/next";
import acknowledgeHandler from "../../pages/api/operations/alarms/[alarmId]/acknowledge";
import recoverHandler from "../../pages/api/operations/alarms/[alarmId]/recover";
import {
  acknowledgeAlarm,
  recoverAlarm,
} from "../../src/infrastructure/http/wcs-api-client";
import {
  testOperationalAccess,
  testOperationalSession,
} from "../fixtures/operational-access";

function createResponse() {
  const response = {
    body: undefined as unknown,
    statusCode: undefined as number | undefined,
    headers: {} as Record<string, string>,
    setHeader: vi.fn((name: string, value: string) => {
      response.headers[name] = value;
      return response;
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

const alarmId = "80000000-0000-4000-8000-000000000001";
const taskId = "50000000-0000-4000-8000-000000000001";

describe("alarm workflow browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not forward acknowledgement without an authenticated operator", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await acknowledgeHandler(
      {
        method: "POST",
        query: { alarmId },
        body: {
          confirmedAction: "acknowledge_alarm",
          confirmationReason: "Evidence reviewed.",
        },
      } as never,
      response as never,
    );
    expect(response.statusCode).toBe(401);
    expect(acknowledgeAlarm).not.toHaveBeenCalled();
  });

  it("forwards an exact acknowledgement with the session identity", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    const body = {
      confirmedAction: "acknowledge_alarm" as const,
      confirmationReason: "Alarm evidence reviewed.",
    };
    vi.mocked(acknowledgeAlarm).mockResolvedValue({
      alarmId,
      status: "acknowledged",
    });
    const response = createResponse();
    await acknowledgeHandler(
      { method: "POST", query: { alarmId }, body } as never,
      response as never,
    );
    expect(response.statusCode).toBe(200);
    expect(acknowledgeAlarm).toHaveBeenCalledWith(
      alarmId,
      body,
      testOperationalAccess,
    );
  });

  it("forwards only a matching confirmed recovery strategy", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    const body = {
      strategy: "release" as const,
      resolution: "Vehicle isolated and task returned to queue.",
      confirmedAction: "release_task" as const,
      confirmationReason: "Supervisor verified isolation evidence.",
    };
    vi.mocked(recoverAlarm).mockResolvedValue({
      taskId,
      equipmentId: null,
      status: "queued",
      blockingAlarmId: null,
      version: 4,
    });
    const response = createResponse();
    await recoverHandler(
      { method: "POST", query: { alarmId }, body } as never,
      response as never,
    );
    expect(response.statusCode).toBe(200);
    expect(recoverAlarm).toHaveBeenCalledWith(
      alarmId,
      body,
      testOperationalAccess,
    );
  });
});
