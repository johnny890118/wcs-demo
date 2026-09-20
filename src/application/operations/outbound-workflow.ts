export type CreateOutboundWorkflowRequest = Readonly<{
  idempotencyKey: string;
  externalReference: string;
  sku: string;
  quantity: number;
  destinationLocationId: string;
}>;

export type OutboundOrderAllocated = Readonly<{
  outboundOrderId: string;
  allocationIds: readonly string[];
  transportTaskIds: readonly string[];
  status: "allocated";
  duplicate: boolean;
}>;

export type ExecuteOutboundWorkflowRequest = Readonly<{
  equipmentId: string;
  confirmedAction: "execute_outbound_task";
  confirmationReason: string;
}>;

export type OutboundExecutionCompleted = Readonly<{
  taskId: string;
  equipmentId: string;
  status: "completed";
  completedAt: number;
}>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function stringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function isCreateOutboundWorkflowRequest(
  value: unknown,
): value is CreateOutboundWorkflowRequest {
  const data = record(value);
  return Boolean(
    data &&
      nonEmptyString(data.idempotencyKey, 200) &&
      data.idempotencyKey.length >= 8 &&
      nonEmptyString(data.externalReference, 200) &&
      nonEmptyString(data.sku, 200) &&
      Number.isSafeInteger(data.quantity) &&
      (data.quantity as number) > 0 &&
      nonEmptyString(data.destinationLocationId, 36),
  );
}

export function isExecuteOutboundWorkflowRequest(
  value: unknown,
): value is ExecuteOutboundWorkflowRequest {
  const data = record(value);
  return Boolean(
    data &&
      nonEmptyString(data.equipmentId, 100) &&
      data.confirmedAction === "execute_outbound_task" &&
      typeof data.confirmationReason === "string" &&
      data.confirmationReason.trim().length >= 8 &&
      data.confirmationReason.length <= 500,
  );
}

export function isOutboundOrderAllocated(
  value: unknown,
): value is OutboundOrderAllocated {
  const data = record(value);
  return Boolean(
    data &&
      typeof data.outboundOrderId === "string" &&
      stringArray(data.allocationIds) &&
      stringArray(data.transportTaskIds) &&
      data.transportTaskIds.length > 0 &&
      data.status === "allocated" &&
      typeof data.duplicate === "boolean",
  );
}

export function isOutboundExecutionCompleted(
  value: unknown,
): value is OutboundExecutionCompleted {
  const data = record(value);
  return Boolean(
    data &&
      typeof data.taskId === "string" &&
      typeof data.equipmentId === "string" &&
      data.status === "completed" &&
      typeof data.completedAt === "number" &&
      Number.isFinite(data.completedAt),
  );
}
