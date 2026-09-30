import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import {
  isUserPermission,
  type UserPermission,
  type InteractivePrincipalKind,
  type DemoSessionScope,
} from "../../../../src/application/access/operational-access";
import { operationalAccessHeaderNames } from "../../../../src/infrastructure/http/operational-access-headers";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ForwardedUserAccess = Readonly<{
  principalKind: InteractivePrincipalKind;
  principal: string;
  permissions: readonly UserPermission[];
  warehouseScopes: readonly string[];
  currentWarehouseId: string;
  demoSessionScope?: DemoSessionScope;
}>;

function commaList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function requireForwardedUserAccess(
  request: Request,
  requiredPermission: UserPermission,
): ForwardedUserAccess {
  const principal = request.header(operationalAccessHeaderNames.principal);
  const principalKind = request.header(
    operationalAccessHeaderNames.principalKind,
  );
  const permissions = commaList(
    request.header(operationalAccessHeaderNames.permissions),
  );
  const warehouseScopes = commaList(
    request.header(operationalAccessHeaderNames.warehouseScopes),
  );
  const currentWarehouseId = request.header(
    operationalAccessHeaderNames.currentWarehouse,
  );
  const demoSessionId = request.header(
    operationalAccessHeaderNames.demoSession,
  );
  const demoSessionExpiresAt = request.header(
    operationalAccessHeaderNames.demoSessionExpiresAt,
  );
  const hasDemoSessionHeader = Boolean(demoSessionId || demoSessionExpiresAt);
  const validDemoSession =
    principalKind === "anonymous_demo" &&
    Boolean(demoSessionId && uuidPattern.test(demoSessionId)) &&
    principal === `anonymous-demo:${demoSessionId}` &&
    Boolean(demoSessionExpiresAt) &&
    !Number.isNaN(Date.parse(demoSessionExpiresAt ?? "")) &&
    Date.parse(demoSessionExpiresAt ?? "") > Date.now();
  if (
    (principalKind !== "human" && principalKind !== "anonymous_demo") ||
    !principal?.trim() ||
    principal.length > 120 ||
    permissions.length === 0 ||
    new Set(permissions).size !== permissions.length ||
    !permissions.every(isUserPermission) ||
    warehouseScopes.length === 0 ||
    warehouseScopes.length > 100 ||
    new Set(warehouseScopes).size !== warehouseScopes.length ||
    !warehouseScopes.every((warehouseId) => uuidPattern.test(warehouseId)) ||
    !currentWarehouseId ||
    !uuidPattern.test(currentWarehouseId) ||
    (principalKind === "human" && hasDemoSessionHeader) ||
    (principalKind === "anonymous_demo" && !validDemoSession)
  ) {
    throw new UnauthorizedException({
      code: "INVALID_USER_CONTEXT",
      message: "A valid forwarded operational access context is required.",
    });
  }
  if (!warehouseScopes.includes(currentWarehouseId)) {
    throw new ForbiddenException({
      code: "WAREHOUSE_SCOPE_FORBIDDEN",
      message: "The current warehouse is outside the principal scope.",
    });
  }
  if (!permissions.includes(requiredPermission)) {
    throw new ForbiddenException({
      code: "USER_PERMISSION_FORBIDDEN",
      message: `The principal lacks permission ${requiredPermission}.`,
    });
  }
  return {
    principalKind,
    principal: principal.trim(),
    permissions: permissions as UserPermission[],
    warehouseScopes,
    currentWarehouseId,
    ...(principalKind === "anonymous_demo"
      ? {
          demoSessionScope: {
            sessionId: demoSessionId!,
            expiresAt: demoSessionExpiresAt!,
          },
        }
      : {}),
  };
}
