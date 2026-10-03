import type { OperationalRuntime } from "../access/operational-access";
import {
  requireAnonymousDemoRuntime,
  requireDemoReservationInput,
} from "./demo-admission";

export type DemoCleanupPolicy = Readonly<{ leaseSeconds: number }>;
export type DemoCleanupLease = Readonly<{
  sessionId: string;
  token: string;
  attempt: number;
  expiresAt: string;
}>;
export interface DemoReferenceCleanupRepository {
  claim(sessionId: string): Promise<DemoCleanupLease>;
  complete(lease: DemoCleanupLease): Promise<void>;
}
export class DemoCleanupError extends Error {
  constructor(readonly code: "INVALID" | "UNAVAILABLE" | "BUSY" | "FENCED") {
    super(`Demo reference cleanup failed: ${code}.`);
    this.name = "DemoCleanupError";
  }
}
export function requireDemoCleanupPolicy(
  runtime: OperationalRuntime,
  policy: DemoCleanupPolicy,
): void {
  requireAnonymousDemoRuntime(runtime);
  if (
    !Number.isSafeInteger(policy.leaseSeconds) ||
    policy.leaseSeconds < 30 ||
    policy.leaseSeconds > 300
  ) {
    throw new DemoCleanupError("INVALID");
  }
}
export function requireDemoCleanupIdentity(value: string): void {
  try {
    requireDemoReservationInput({
      sessionId: value,
      templateWarehouseId: value,
    });
  } catch {
    throw new DemoCleanupError("INVALID");
  }
}
