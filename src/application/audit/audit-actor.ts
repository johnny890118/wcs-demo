import type { InteractivePrincipalKind } from "../access/operational-access";

export const auditActorTypes = [
  "user",
  "anonymous_demo",
  "service",
  "system",
] as const;
export type AuditActorType = (typeof auditActorTypes)[number];

export function interactiveAuditActorType(
  principalKind: InteractivePrincipalKind,
): Extract<AuditActorType, "user" | "anonymous_demo"> {
  return principalKind === "anonymous_demo" ? "anonymous_demo" : "user";
}
