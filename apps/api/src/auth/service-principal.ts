import type { Request } from "express";
import { servicePermissions, type ServicePermission } from "./permissions";

export type ServicePrincipal = Readonly<{
  kind: "service";
  subject: string;
  permissions: readonly ServicePermission[];
}>;

const principals = new WeakMap<Request, ServicePrincipal>();

export function loadServicePrincipal(): ServicePrincipal {
  const subject = process.env.API_SERVICE_ID?.trim();
  if (!subject || subject.length > 120) {
    throw new Error("API_SERVICE_ID must be a non-empty service identity.");
  }
  const configured = (process.env.API_SERVICE_PERMISSIONS ?? "")
    .split(",")
    .map((permission) => permission.trim())
    .filter(Boolean);
  if (
    configured.length === 0 ||
    new Set(configured).size !== configured.length ||
    !configured.every((permission) =>
      servicePermissions.includes(permission as ServicePermission),
    )
  ) {
    throw new Error("API_SERVICE_PERMISSIONS contains invalid permissions.");
  }
  return {
    kind: "service",
    subject,
    permissions: configured as ServicePermission[],
  };
}

export function attachServicePrincipal(
  request: Request,
  principal: ServicePrincipal,
): void {
  principals.set(request, principal);
}

export function requireServicePrincipal(request: Request): ServicePrincipal {
  const principal = principals.get(request);
  if (!principal) throw new Error("Service principal was not authenticated.");
  return principal;
}
