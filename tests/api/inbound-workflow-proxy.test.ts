import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("../../pages/api/auth/[...nextauth]", () => ({ authOptions: {} }));
vi.mock("../../src/infrastructure/http/wcs-api-client", () => ({
  createInboundReceipt: vi.fn(),
  executeInboundTask: vi.fn(),
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
import createHandler from "../../pages/api/operations/inbound";
import executeHandler from "../../pages/api/operations/inbound/[taskId]/execute";
import {
  createInboundReceipt,
  executeInboundTask,
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
  idempotencyKey: "browser-request-0001",
  externalReference: "ASN-UI-01",
  sourceLocationId: "20000000-0000-4000-8000-000000000001",
  destinationLocationId: "20000000-0000-4000-8000-000000000002",
  load: { externalId: "PALLET-UI-01", sku: "SKU-UI", quantity: 6 },
};
const taskId = "50000000-0000-4000-8000-000000000001";

describe("inbound workflow browser boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not forward mutations without an authenticated operator", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = createResponse();
    await createHandler(
      { method: "POST", body: createBody } as never,
      response as never,
    );

    expect(response.statusCode).toBe(401);
    expect(createInboundReceipt).not.toHaveBeenCalled();
  });

  it("forwards a validated receipt with the session operator identity", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    vi.mocked(createInboundReceipt).mockResolvedValue({
      receiptId: "30000000-0000-4000-8000-000000000001",
      loadId: "40000000-0000-4000-8000-000000000001",
      transportTaskId: taskId,
      status: "requested",
      duplicate: false,
    });
    const response = createResponse();
    await createHandler(
      { method: "POST", body: createBody } as never,
      response as never,
    );

    expect(response.statusCode).toBe(201);
    expect(createInboundReceipt).toHaveBeenCalledWith(
      createBody,
      testOperationalAccess,
    );
  });

  it("forwards only an exact confirmed execution", async () => {
    vi.mocked(getServerSession).mockResolvedValue(testOperationalSession);
    const body = {
      equipmentId: "AMR-01",
      confirmedAction: "execute_inbound_task" as const,
      confirmationReason: "Operator verified current telemetry.",
    };
    vi.mocked(executeInboundTask).mockResolvedValue({
      taskId,
      equipmentId: "AMR-01",
      status: "completed",
      completedAt: 5_000,
    });
    const response = createResponse();
    await executeHandler(
      { method: "POST", query: { taskId }, body } as never,
      response as never,
    );

    expect(response.statusCode).toBe(200);
    expect(executeInboundTask).toHaveBeenCalledWith(
      taskId,
      body,
      testOperationalAccess,
    );
  });

  it("denies a principal without the requested command permission", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      ...testOperationalSession,
      access: {
        ...testOperationalAccess,
        principal: {
          ...testOperationalAccess.principal,
          permissions: ["operations.view"],
          warehouseScopes: testOperationalAccess.principal.warehouseScopes.map(
            (scope) => ({ ...scope, permissions: ["operations.view"] }),
          ),
        },
      },
    });
    const response = createResponse();
    await createHandler(
      { method: "POST", body: createBody } as never,
      response as never,
    );

    expect(response.statusCode).toBe(403);
    expect(createInboundReceipt).not.toHaveBeenCalled();
  });
});
