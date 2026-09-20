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

async function fetchWcsProjection(path: string): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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
  operatorId: string,
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
      "X-Operator-Id": operatorId,
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

export async function fetchOperationsSummary(): Promise<OperationsSummary> {
  const payload = await fetchWcsProjection("/api/v1/operations/summary");
  if (!isOperationsSummary(payload)) {
    throw new Error("WCS operations API returned an invalid projection.");
  }
  return payload;
}

export async function fetchOperationsDetails(): Promise<OperationsDetails> {
  const payload = await fetchWcsProjection("/api/v1/operations/details");
  if (!isOperationsDetails(payload)) {
    throw new Error("WCS operations API returned invalid focused projections.");
  }
  return payload;
}

export async function fetchAuditEvents(
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
  );
  if (!isAuditEventPage(payload)) {
    throw new Error("WCS audit API returned an invalid projection.");
  }
  return payload;
}

export async function createInboundReceipt(
  request: CreateInboundWorkflowRequest,
  operatorId: string,
): Promise<InboundReceiptCreated> {
  const { idempotencyKey, ...body } = request;
  const payload = await postWcsCommand(
    "/api/v1/inbound-receipts",
    body,
    operatorId,
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
  operatorId: string,
): Promise<InboundExecutionCompleted> {
  const payload = await postWcsCommand(
    `/api/v1/transport-tasks/${encodeURIComponent(taskId)}/execute`,
    request,
    operatorId,
  );
  if (!isInboundExecutionCompleted(payload)) {
    throw new Error("WCS API returned an invalid inbound execution result.");
  }
  return payload;
}

export async function createOutboundOrder(
  request: CreateOutboundWorkflowRequest,
  operatorId: string,
): Promise<OutboundOrderAllocated> {
  const { idempotencyKey, ...body } = request;
  const payload = await postWcsCommand(
    "/api/v1/outbound-orders",
    body,
    operatorId,
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
  operatorId: string,
): Promise<OutboundExecutionCompleted> {
  const payload = await postWcsCommand(
    `/api/v1/outbound-transport-tasks/${encodeURIComponent(taskId)}/execute`,
    request,
    operatorId,
  );
  if (!isOutboundExecutionCompleted(payload)) {
    throw new Error("WCS API returned an invalid outbound execution result.");
  }
  return payload;
}

export async function acknowledgeAlarm(
  alarmId: string,
  request: AcknowledgeAlarmRequest,
  operatorId: string,
): Promise<AlarmAcknowledged> {
  const payload = await postWcsCommand(
    `/api/v1/alarms/${encodeURIComponent(alarmId)}/acknowledge`,
    request,
    operatorId,
  );
  if (!isAlarmAcknowledged(payload)) {
    throw new Error("WCS API returned an invalid alarm acknowledgement.");
  }
  return payload;
}

export async function recoverAlarm(
  alarmId: string,
  request: RecoverAlarmRequest,
  operatorId: string,
): Promise<AlarmRecovered> {
  const payload = await postWcsCommand(
    `/api/v1/alarms/${encodeURIComponent(alarmId)}/recover`,
    request,
    operatorId,
  );
  if (!isAlarmRecovered(payload)) {
    throw new Error("WCS API returned an invalid alarm recovery result.");
  }
  return payload;
}
