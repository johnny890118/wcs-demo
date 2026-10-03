import type { OperationalRuntime } from "../access/operational-access";

export type DemoAdmissionPolicy = Readonly<{
  ttlSeconds: number;
  maximumReservations: number;
}>;

export type DemoReservation = Readonly<{
  sessionId: string;
  templateWarehouseId: string;
  deploymentProfile: "public_demo";
  ttlSeconds: number;
  state: "provisioning" | "expired" | "closed";
  createdAt: string;
  expiresAt: string;
}>;

export type ReserveDemoSession = Readonly<{
  sessionId: string;
  templateWarehouseId: string;
}>;

export interface DemoAdmissionRepository {
  reserve(input: ReserveDemoSession): Promise<DemoReservation>;
  expireBatch(limit: number): Promise<number>;
}

export class DemoAdmissionError extends Error {
  constructor(
    readonly code: "UNAVAILABLE" | "INVALID" | "CAPACITY" | "CONFLICT",
  ) {
    super(`Demo admission failed: ${code}.`);
    this.name = "DemoAdmissionError";
  }
}

export function requireDemoAdmissionPolicy(
  runtime: OperationalRuntime,
  policy: DemoAdmissionPolicy,
): void {
  requireAnonymousDemoRuntime(runtime);
  if (
    !Number.isSafeInteger(policy.ttlSeconds) ||
    policy.ttlSeconds < 300 ||
    policy.ttlSeconds > 7_200 ||
    !Number.isSafeInteger(policy.maximumReservations) ||
    policy.maximumReservations < 1 ||
    policy.maximumReservations > 1_000
  ) {
    throw new DemoAdmissionError("INVALID");
  }
}

export function requireAnonymousDemoRuntime(runtime: OperationalRuntime): void {
  if (
    runtime.deploymentProfile !== "public_demo" ||
    runtime.equipmentSource !== "simulation"
  ) {
    throw new DemoAdmissionError("UNAVAILABLE");
  }
}

export function requireDemoReservationInput(input: ReserveDemoSession): void {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(input.sessionId) || !uuid.test(input.templateWarehouseId)) {
    throw new DemoAdmissionError("INVALID");
  }
}

export function requireDemoExpiryBatch(limit: number): void {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new DemoAdmissionError("INVALID");
  }
}
