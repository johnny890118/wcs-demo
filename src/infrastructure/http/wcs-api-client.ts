import {
  isOperationsSummary,
  type OperationsSummary,
} from "../../application/operations/operations-summary";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "../../application/operations/operations-details";
import {
  isInboundExecutionCompleted,
  isInboundReceiptCreated,
  type CreateInboundWorkflowRequest,
  type ExecuteInboundWorkflowRequest,
  type InboundExecutionCompleted,
  type InboundReceiptCreated,
} from "../../application/operations/inbound-workflow";
import {
  isOutboundExecutionCompleted,
  isOutboundOrderAllocated,
  type CreateOutboundWorkflowRequest,
  type ExecuteOutboundWorkflowRequest,
  type OutboundExecutionCompleted,
  type OutboundOrderAllocated,
} from "../../application/operations/outbound-workflow";
import {
  isAlarmAcknowledged,
  isAlarmRecovered,
  type AcknowledgeAlarmRequest,
  type AlarmAcknowledged,
  type AlarmRecovered,
  type RecoverAlarmRequest,
} from "../../application/operations/alarm-workflow";
import {
  isAuditEventPage,
  type AuditEventPage,
  type AuditEventQuery,
} from "../../application/audit/audit-projection";
import {
  isOperationalAccess,
  type OperationalAccess,
} from "../../application/access/operational-access";
import {
  isHumanSessionReference,
  type HumanSessionReference,
} from "../../application/access/human-session";
import { operationalAccessHeaders } from "./operational-access-headers";

const defaultTimeoutMs = 55_000;

export function loadWcsApiTimeoutMs(): number {
  const value = Number(process.env.INTERNAL_API_TIMEOUT_MS ?? defaultTimeoutMs);
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 60_000) {
    throw new Error(
      "INTERNAL_API_TIMEOUT_MS must be an integer from 1000 to 60000.",
    );
  }
  return value;
}

async function fetchWcsProjection(
  path: string,
  access: OperationalAccess,
): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...operationalAccessHeaders(access),
    },
    signal: AbortSignal.timeout(loadWcsApiTimeoutMs()),
  });
  if (!response.ok) {
    throw new Error(`WCS API returned HTTP ${response.status}.`);
  }
  return response.json();
}

export class WcsCommandError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "WcsCommandError";
  }
}

async function postWcsCommand(
  path: string,
  body: unknown,
  access: OperationalAccess,
  headers: Record<string, string> = {},
): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...operationalAccessHeaders(access),
      ...headers,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(loadWcsApiTimeoutMs()),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null;
    throw new WcsCommandError(
      response.status,
      typeof error?.code === "string" ? error.code : "WCS_COMMAND_FAILED",
      typeof error?.message === "string"
        ? error.message
        : `WCS API returned HTTP ${response.status}.`,
    );
  }
  return payload;
}

export type HumanSessionResolution = Readonly<{
  access: OperationalAccess;
  session: HumanSessionReference;
}>;

async function postHumanSession(path: string, body: unknown): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(loadWcsApiTimeoutMs()),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("No valid persisted operational session is available.");
  }
  return payload;
}

function requireHumanSessionResolution(
  payload: unknown,
): HumanSessionResolution {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The operational session response is invalid.");
  }
  const resolution = payload as Record<string, unknown>;
  if (
    !isOperationalAccess(resolution.access) ||
    !isHumanSessionReference(resolution.session)
  ) {
    throw new Error("The operational session response is invalid.");
  }
  return {
    access: resolution.access,
    session: resolution.session,
  };
}

export async function issueHumanOperationalSession(
  identityProvider: string,
  subject: string,
): Promise<HumanSessionResolution> {
  return requireHumanSessionResolution(
    await postHumanSession("/api/v1/access-context/human/sessions", {
      identityProvider,
      subject,
    }),
  );
}

export async function validateHumanOperationalSession(
  session: HumanSessionReference,
  access: OperationalAccess,
): Promise<HumanSessionResolution> {
  return requireHumanSessionResolution(
    await postHumanSession(
      `/api/v1/access-context/human/sessions/${encodeURIComponent(
        session.sessionId,
      )}/validate`,
      {
        identityProvider: access.principal.identityProvider,
        subject: access.principal.subject,
        currentWarehouseId: access.currentWarehouseId,
      },
    ),
  );
}

export async function revokeHumanOperationalSession(
  session: HumanSessionReference,
  reason: "sign_out" | "administrative" = "sign_out",
): Promise<void> {
  const payload = await postHumanSession(
    `/api/v1/access-context/human/sessions/${encodeURIComponent(
      session.sessionId,
    )}/revoke`,
    { reason },
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    typeof (payload as Record<string, unknown>).revoked !== "boolean"
  ) {
    throw new Error("The operational session revocation response is invalid.");
  }
}

export async function fetchOperationsSummary(
  access: OperationalAccess,
): Promise<OperationsSummary> {
  const payload = await fetchWcsProjection(
    "/api/v1/operations/summary",
    access,
  );
  if (!isOperationsSummary(payload)) {
    throw new Error("WCS operations API returned an invalid projection.");
  }
  return payload;
}

export async function fetchOperationsDetails(
  access: OperationalAccess,
): Promise<OperationsDetails> {
  const payload = await fetchWcsProjection(
    "/api/v1/operations/details",
    access,
  );
  if (!isOperationsDetails(payload)) {
    throw new Error("WCS operations API returned invalid focused projections.");
  }
  return payload;
}

export async function fetchAuditEvents(
  access: OperationalAccess,
  query: AuditEventQuery = {},
): Promise<AuditEventPage> {
  const search = new URLSearchParams();
  if (query.cursor) search.set("cursor", query.cursor);
  if (query.limit !== undefined) search.set("limit", String(query.limit));
  if (query.resourceType) search.set("resourceType", query.resourceType);
  if (query.resourceId) search.set("resourceId", query.resourceId);
  if (query.correlationId) search.set("correlationId", query.correlationId);
  const payload = await fetchWcsProjection(
    `/api/v1/audit-events${search.size ? `?${search}` : ""}`,
    access,
  );
  if (!isAuditEventPage(payload)) {
    throw new Error("WCS audit API returned an invalid projection.");
  }
  return payload;
}

export async function recordWarehouseContextChange(
  access: OperationalAccess,
  targetWarehouseId: string,
): Promise<{ currentWarehouseId: string }> {
  const payload = await postWcsCommand(
    "/api/v1/access-context/warehouse",
    { targetWarehouseId },
    access,
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    (payload as Record<string, unknown>).currentWarehouseId !==
      targetWarehouseId
  ) {
    throw new Error("WCS API returned an invalid warehouse context result.");
  }
  return { currentWarehouseId: targetWarehouseId };
}

export async function createInboundReceipt(
  request: CreateInboundWorkflowRequest,
  access: OperationalAccess,
): Promise<InboundReceiptCreated> {
  const { idempotencyKey, ...body } = request;
  const payload = await postWcsCommand(
    "/api/v1/inbound-receipts",
    body,
    access,
    { "Idempotency-Key": idempotencyKey },
  );
  if (!isInboundReceiptCreated(payload)) {
    throw new Error("WCS API returned an invalid inbound receipt result.");
  }
  return payload;
}

export async function executeInboundTask(
  taskId: string,
  request: ExecuteInboundWorkflowRequest,
  access: OperationalAccess,
): Promise<InboundExecutionCompleted> {
  const payload = await postWcsCommand(
    `/api/v1/transport-tasks/${encodeURIComponent(taskId)}/execute`,
    request,
    access,
  );
  if (!isInboundExecutionCompleted(payload)) {
    throw new Error("WCS API returned an invalid inbound execution result.");
  }
  return payload;
}

export async function createOutboundOrder(
  request: CreateOutboundWorkflowRequest,
  access: OperationalAccess,
): Promise<OutboundOrderAllocated> {
  const { idempotencyKey, ...body } = request;
  const payload = await postWcsCommand(
    "/api/v1/outbound-orders",
    body,
    access,
    { "Idempotency-Key": idempotencyKey },
  );
  if (!isOutboundOrderAllocated(payload)) {
    throw new Error("WCS API returned an invalid outbound order result.");
  }
  return payload;
}

export async function executeOutboundTask(
  taskId: string,
  request: ExecuteOutboundWorkflowRequest,
  access: OperationalAccess,
): Promise<OutboundExecutionCompleted> {
  const payload = await postWcsCommand(
    `/api/v1/outbound-transport-tasks/${encodeURIComponent(taskId)}/execute`,
    request,
    access,
  );
  if (!isOutboundExecutionCompleted(payload)) {
    throw new Error("WCS API returned an invalid outbound execution result.");
  }
  return payload;
}

export async function acknowledgeAlarm(
  alarmId: string,
  request: AcknowledgeAlarmRequest,
  access: OperationalAccess,
): Promise<AlarmAcknowledged> {
  const payload = await postWcsCommand(
    `/api/v1/alarms/${encodeURIComponent(alarmId)}/acknowledge`,
    request,
    access,
  );
  if (!isAlarmAcknowledged(payload)) {
    throw new Error("WCS API returned an invalid alarm acknowledgement.");
  }
  return payload;
}

export async function recoverAlarm(
  alarmId: string,
  request: RecoverAlarmRequest,
  access: OperationalAccess,
): Promise<AlarmRecovered> {
  const payload = await postWcsCommand(
    `/api/v1/alarms/${encodeURIComponent(alarmId)}/recover`,
    request,
    access,
  );
  if (!isAlarmRecovered(payload)) {
    throw new Error("WCS API returned an invalid alarm recovery result.");
  }
  return payload;
}
