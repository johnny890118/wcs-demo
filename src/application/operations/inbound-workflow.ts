export type CreateInboundWorkflowRequest = Readonly<{
  idempotencyKey: string;
  externalReference: string;
  sourceLocationId: string;
  destinationLocationId: string;
  load: Readonly<{
    externalId: string;
    sku: string;
    quantity: number;
  }>;
}>;

export type InboundReceiptCreated = Readonly<{
  receiptId: string;
  loadId: string;
  transportTaskId: string;
  status: "requested";
  duplicate: boolean;
}>;

export type ExecuteInboundWorkflowRequest = Readonly<{
  equipmentId: string;
  confirmedAction: "execute_inbound_task";
  confirmationReason: string;
}>;

export type InboundExecutionCompleted = Readonly<{
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

export function isCreateInboundWorkflowRequest(
  value: unknown,
): value is CreateInboundWorkflowRequest {
  const data = record(value);
  const load = record(data?.load);
  return Boolean(
    data &&
      nonEmptyString(data.idempotencyKey, 200) &&
      data.idempotencyKey.length >= 8 &&
      nonEmptyString(data.externalReference, 200) &&
      nonEmptyString(data.sourceLocationId, 36) &&
      nonEmptyString(data.destinationLocationId, 36) &&
      data.sourceLocationId !== data.destinationLocationId &&
      load &&
      nonEmptyString(load.externalId, 200) &&
      nonEmptyString(load.sku, 200) &&
      Number.isSafeInteger(load.quantity) &&
      (load.quantity as number) > 0,
  );
}

export function isExecuteInboundWorkflowRequest(
  value: unknown,
): value is ExecuteInboundWorkflowRequest {
  const data = record(value);
  return Boolean(
    data &&
      nonEmptyString(data.equipmentId, 100) &&
      data.confirmedAction === "execute_inbound_task" &&
      typeof data.confirmationReason === "string" &&
      data.confirmationReason.trim().length >= 8 &&
      data.confirmationReason.length <= 500,
  );
}

export function isInboundReceiptCreated(
  value: unknown,
): value is InboundReceiptCreated {
  const data = record(value);
  return Boolean(
    data &&
      typeof data.receiptId === "string" &&
      typeof data.loadId === "string" &&
      typeof data.transportTaskId === "string" &&
      data.status === "requested" &&
      typeof data.duplicate === "boolean",
  );
}

export function isInboundExecutionCompleted(
  value: unknown,
): value is InboundExecutionCompleted {
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
