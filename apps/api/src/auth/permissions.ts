import { SetMetadata } from "@nestjs/common";
import type { UserPermission } from "../../../../src/application/access/operational-access";

export const servicePermissions = [
  "audit.view",
  "operations.view",
  "inbound.create",
  "outbound.create",
  "transport.execute",
  "alarm.inject",
  "alarm.acknowledge",
  "alarm.recover",
] as const;

export type ServicePermission = (typeof servicePermissions)[number];
export const REQUIRED_PERMISSION = "required-service-permission";
export const REQUIRED_USER_PERMISSION = "required-user-permission";

export const RequirePermission = (permission: ServicePermission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);

export const RequireUserPermission = (permission: UserPermission) =>
  SetMetadata(REQUIRED_USER_PERMISSION, permission);
