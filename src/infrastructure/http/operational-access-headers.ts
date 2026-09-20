import type { OperationalAccess } from "../../application/access/operational-access";

export const operationalAccessHeaderNames = {
  principal: "X-SWP-Principal",
  permissions: "X-SWP-User-Permissions",
  warehouseScopes: "X-SWP-Warehouse-Scopes",
  currentWarehouse: "X-SWP-Warehouse",
} as const;

export function operationalAccessHeaders(
  access: OperationalAccess,
): Record<string, string> {
  return {
    [operationalAccessHeaderNames.principal]: access.principal.subject,
    [operationalAccessHeaderNames.permissions]:
      access.principal.permissions.join(","),
    [operationalAccessHeaderNames.warehouseScopes]:
      access.principal.warehouseScopes
        .map((scope) => scope.warehouseId)
        .join(","),
    [operationalAccessHeaderNames.currentWarehouse]: access.currentWarehouseId,
  };
}
