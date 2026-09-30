import type { OperationalAccess } from "../../application/access/operational-access";

export const operationalAccessHeaderNames = {
  principalKind: "X-SWP-Principal-Kind",
  principal: "X-SWP-Principal",
  permissions: "X-SWP-User-Permissions",
  warehouseScopes: "X-SWP-Warehouse-Scopes",
  currentWarehouse: "X-SWP-Warehouse",
  demoSession: "X-SWP-Demo-Session",
  demoSessionExpiresAt: "X-SWP-Demo-Session-Expires-At",
} as const;

export function operationalAccessHeaders(
  access: OperationalAccess,
): Record<string, string> {
  const headers: Record<string, string> = {
    [operationalAccessHeaderNames.principalKind]: access.principal.kind,
    [operationalAccessHeaderNames.principal]: access.principal.subject,
    [operationalAccessHeaderNames.permissions]:
      access.principal.permissions.join(","),
    [operationalAccessHeaderNames.warehouseScopes]:
      access.principal.warehouseScopes
        .map((scope) => scope.warehouseId)
        .join(","),
    [operationalAccessHeaderNames.currentWarehouse]: access.currentWarehouseId,
  };
  if (access.demoSessionScope) {
    headers[operationalAccessHeaderNames.demoSession] =
      access.demoSessionScope.sessionId;
    headers[operationalAccessHeaderNames.demoSessionExpiresAt] =
      access.demoSessionScope.expiresAt;
  }
  return headers;
}
