import { SetMetadata } from "@nestjs/common";

export const servicePermissions = [
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

export const RequirePermission = (permission: ServicePermission) =>
  SetMetadata(REQUIRED_PERMISSION, permission);
