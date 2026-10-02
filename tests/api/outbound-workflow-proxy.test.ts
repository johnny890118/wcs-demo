import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  createOutboundOrder: vi.fn(),
  executeOutboundTask: vi.fn(),
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
import createHandler from "../../pages/api/operations/outbound";
import executeHandler from "../../pages/api/operations/outbound/[taskId]/execute";
import {
  createOutboundOrder,
  executeOutboundTask,
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

const createBody = {
  idempotencyKey: "browser-outbound-0001",
  externalReference: "SO-UI-01",
  sku: "SKU-E2E",
  quantity: 2,
  destinationLocationId: "20000000-0000-4000-8000-000000000003",
};
const taskId = "c0000000-0000-4000-8000-000000000099";
const trustedHeaders = { origin: "https://app.example.test" };

describe("outbound workflow browser boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_URL = trustedHeaders.origin;
  });

  it("does not forward mutations without an authenticated operator", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await createHandler(
      { method: "POST", headers: trustedHeaders, body: createBody } as never,
      response as never,
    );
    expect(response.statusCode).toBe(401);
    expect(createOutboundOrder).not.toHaveBeenCalled();
  });

  it("forwards a validated allocation with the session operator identity", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(createOutboundOrder).mockResolvedValue({
      outboundOrderId: "a0000000-0000-4000-8000-000000000099",
      allocationIds: ["b0000000-0000-4000-8000-000000000099"],
      transportTaskIds: [taskId],
      status: "allocated",
      duplicate: false,
    });
    const response = createResponse();
    await createHandler(
      { method: "POST", headers: trustedHeaders, body: createBody } as never,
      response as never,
    );
    expect(response.statusCode).toBe(201);
    expect(createOutboundOrder).toHaveBeenCalledWith(
      createBody,
      testOperationalAccess,
    );
  });

  it("forwards only an exact confirmed execution", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    const body = {
      equipmentId: "AMR-01",
      confirmedAction: "execute_outbound_task" as const,
      confirmationReason: "Operator verified allocation and telemetry.",
    };
    vi.mocked(executeOutboundTask).mockResolvedValue({
      taskId,
      equipmentId: "AMR-01",
      status: "completed",
      completedAt: 5_000,
    });
    const response = createResponse();
    await executeHandler(
      {
        method: "POST",
        headers: trustedHeaders,
        query: { taskId },
        body,
      } as never,
      response as never,
    );
    expect(response.statusCode).toBe(200);
    expect(executeOutboundTask).toHaveBeenCalledWith(
      taskId,
      body,
      testOperationalAccess,
    );
  });
});
