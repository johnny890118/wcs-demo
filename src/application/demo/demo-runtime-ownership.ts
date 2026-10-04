import type { OperationalRuntime } from "../access/operational-access";
import { requireAnonymousDemoRuntime } from "./demo-admission";
import { requireDemoCleanupIdentity } from "./demo-reference-cleanup";

export type DemoRuntimePolicy = Readonly<{ leaseSeconds: number }>;
export type DemoRuntimeLease = Readonly<{
  sessionId: string;
  warehouseId: string;
  token: string;
  generation: number;
  state: "initializing" | "active" | "unknown";
  expiresAt: string;
}>;
export interface DemoRuntimeOwnershipRepository {
  claim(sessionId: string): Promise<DemoRuntimeLease>;
  renew(lease: DemoRuntimeLease): Promise<DemoRuntimeLease>;
  activate(lease: DemoRuntimeLease): Promise<DemoRuntimeLease>;
}
export class DemoRuntimeError extends Error {
  constructor(readonly code: "INVALID" | "UNAVAILABLE" | "BUSY" | "FENCED") {
    super(`Demo simulator ownership failed: ${code}.`);
    this.name = "DemoRuntimeError";
  }
}
export function requireDemoRuntimePolicy(
  runtime: OperationalRuntime,
  policy: DemoRuntimePolicy,
): void {
  requireAnonymousDemoRuntime(runtime);
  if (
    !Number.isSafeInteger(policy.leaseSeconds) ||
    policy.leaseSeconds < 30 ||
    policy.leaseSeconds > 300
  ) {
    throw new DemoRuntimeError("INVALID");
  }
}
export function requireDemoRuntimeIdentity(value: string): void {
  try {
    requireDemoCleanupIdentity(value);
  } catch {
    throw new DemoRuntimeError("INVALID");
  }
}
