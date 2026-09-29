export const userPermissions = [
  "operations.view",
  "audit.view",
  "inbound.create",
  "outbound.create",
  "transport.execute",
  "alarm.acknowledge",
  "alarm.recover",
] as const;

export type UserPermission = (typeof userPermissions)[number];

export type WarehouseScope = Readonly<{
  warehouseId: string;
  code: string;
  name: string;
}>;

export type OperationalPrincipal = Readonly<{
  subject: string;
  displayName: string;
  identityProvider: string;
  permissions: readonly UserPermission[];
  warehouseScopes: readonly WarehouseScope[];
}>;

export type OperationalAccess = Readonly<{
  principal: OperationalPrincipal;
  currentWarehouseId: string;
}>;

export const operationalEnvironments = [
  "development",
  "test",
  "staging",
  "production",
] as const;

export type OperationalEnvironment = (typeof operationalEnvironments)[number];

export const equipmentSources = ["simulation", "hardware", "hybrid"] as const;
export type EquipmentSource = (typeof equipmentSources)[number];

export const deploymentProfiles = [
  "public_demo",
  "private_demo",
  "pilot",
  "production",
] as const;

export type DeploymentProfile = (typeof deploymentProfiles)[number];

export type OperationalRuntime = Readonly<{
  environment: OperationalEnvironment;
  deploymentProfile: DeploymentProfile;
  equipmentSource: EquipmentSource;
}>;

const allowedEquipmentSources: Readonly<
  Record<DeploymentProfile, readonly EquipmentSource[]>
> = Object.freeze({
  public_demo: ["simulation"],
  private_demo: ["simulation"],
  pilot: ["hardware", "hybrid"],
  production: ["hardware", "hybrid"],
});

export function isProfileEquipmentSourceAllowed(
  profile: DeploymentProfile,
  equipmentSource: EquipmentSource,
): boolean {
  return allowedEquipmentSources[profile].includes(equipmentSource);
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNonBlank(value: unknown, maximum = 120): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximum
  );
}

export function isUserPermission(value: unknown): value is UserPermission {
  return userPermissions.includes(value as UserPermission);
}

export function isWarehouseScope(value: unknown): value is WarehouseScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const scope = value as Record<string, unknown>;
  return (
    typeof scope.warehouseId === "string" &&
    uuidPattern.test(scope.warehouseId) &&
    isNonBlank(scope.code, 50) &&
    isNonBlank(scope.name, 160)
  );
}

export function isOperationalAccess(
  value: unknown,
): value is OperationalAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const access = value as Record<string, unknown>;
  if (
    !access.principal ||
    typeof access.principal !== "object" ||
    Array.isArray(access.principal) ||
    typeof access.currentWarehouseId !== "string"
  ) {
    return false;
  }
  const principal = access.principal as Record<string, unknown>;
  if (
    !isNonBlank(principal.subject) ||
    !isNonBlank(principal.displayName) ||
    !isNonBlank(principal.identityProvider, 80) ||
    !Array.isArray(principal.permissions) ||
    principal.permissions.length === 0 ||
    new Set(principal.permissions).size !== principal.permissions.length ||
    !principal.permissions.every(isUserPermission) ||
    !Array.isArray(principal.warehouseScopes) ||
    principal.warehouseScopes.length === 0 ||
    principal.warehouseScopes.length > 100 ||
    !principal.warehouseScopes.every(isWarehouseScope)
  ) {
    return false;
  }
  const warehouseIds = principal.warehouseScopes.map(
    (scope) => (scope as WarehouseScope).warehouseId,
  );
  return (
    new Set(warehouseIds).size === warehouseIds.length &&
    warehouseIds.includes(access.currentWarehouseId)
  );
}

export function isOperationalRuntime(
  value: unknown,
): value is OperationalRuntime {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const runtime = value as Record<string, unknown>;
  const valid =
    operationalEnvironments.includes(
      runtime.environment as OperationalEnvironment,
    ) &&
    deploymentProfiles.includes(
      runtime.deploymentProfile as DeploymentProfile,
    ) &&
    equipmentSources.includes(runtime.equipmentSource as EquipmentSource);
  return (
    valid &&
    isProfileEquipmentSourceAllowed(
      runtime.deploymentProfile as DeploymentProfile,
      runtime.equipmentSource as EquipmentSource,
    )
  );
}

export function hasUserPermission(
  access: OperationalAccess,
  permission: UserPermission,
): boolean {
  return access.principal.permissions.includes(permission);
}

export function currentWarehouse(access: OperationalAccess): WarehouseScope {
  const scope = access.principal.warehouseScopes.find(
    (candidate) => candidate.warehouseId === access.currentWarehouseId,
  );
  if (!scope) throw new Error("Current warehouse is outside principal scope.");
  return scope;
}
