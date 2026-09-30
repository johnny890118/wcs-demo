import {
  userPermissions,
  type OperationalAccess,
  type UserPermission,
  isOperationalAccess,
} from "../../application/access/operational-access";
export { loadOperationalRuntime } from "../runtime/operational-runtime";

const demoWarehouseId = "10000000-0000-4000-8000-000000000001";

function configuredPermissions(): readonly UserPermission[] {
  const configured = process.env.DEMO_USER_PERMISSIONS;
  if (!configured) return userPermissions;
  const parsed = configured
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (
    parsed.length === 0 ||
    new Set(parsed).size !== parsed.length ||
    !parsed.every((permission) =>
      userPermissions.includes(permission as UserPermission),
    )
  ) {
    throw new Error("DEMO_USER_PERMISSIONS contains invalid permissions.");
  }
  return parsed as UserPermission[];
}

function configuredValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (value.length > 160) throw new Error(`${name} is too long.`);
  return value;
}

export function createDemoOperationalAccess(
  username: string,
): OperationalAccess {
  const warehouseId = configuredValue("DEMO_WAREHOUSE_ID", demoWarehouseId);
  const access: OperationalAccess = {
    principal: {
      kind: "human",
      subject: "legacy-demo-admin",
      displayName: username,
      identityProvider: "demo-credentials",
      permissions: configuredPermissions(),
      warehouseScopes: [
        {
          warehouseId,
          code: configuredValue("DEMO_WAREHOUSE_CODE", "DEMO"),
          name: configuredValue(
            "DEMO_WAREHOUSE_NAME",
            "Deterministic Demo Warehouse",
          ),
        },
      ],
    },
    currentWarehouseId: warehouseId,
  };
  if (!isOperationalAccess(access)) {
    throw new Error("Demo identity access configuration is invalid.");
  }
  return access;
}
