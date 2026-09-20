import type { Session } from "next-auth";
import {
  hasUserPermission,
  isOperationalAccess,
  isOperationalRuntime,
  type OperationalAccess,
  type OperationalRuntime,
  type UserPermission,
} from "../../application/access/operational-access";

export type AuthorizedOperationalSession = Readonly<{
  access: OperationalAccess;
  runtime: OperationalRuntime;
}>;

export type OperationalSessionDecision =
  | Readonly<{ allowed: true; session: AuthorizedOperationalSession }>
  | Readonly<{
      allowed: false;
      reason: "unauthenticated" | "invalid-access-context" | "forbidden";
    }>;

export function authorizeOperationalSession(
  session: Session | null,
  permission: UserPermission,
): OperationalSessionDecision {
  if (!session) return { allowed: false, reason: "unauthenticated" };
  if (
    !isOperationalAccess(session.access) ||
    !isOperationalRuntime(session.runtime)
  ) {
    return { allowed: false, reason: "invalid-access-context" };
  }
  if (!hasUserPermission(session.access, permission)) {
    return { allowed: false, reason: "forbidden" };
  }
  return {
    allowed: true,
    session: { access: session.access, runtime: session.runtime },
  };
}
