import type { Session } from "next-auth";
import type { OperationalAccess } from "../../application/access/operational-access";
import { authorizeOperationalSession } from "../../infrastructure/auth/operational-session";
import { loginDestination } from "./login-routing";

export type OperationalPageAccessDecision =
  | Readonly<{ allowed: true; access: OperationalAccess }>
  | Readonly<{ allowed: false; destination: string }>;

export function operationalPageAccess(
  session: Session | null,
  permission: Parameters<typeof authorizeOperationalSession>[1],
  returnTo: string,
): OperationalPageAccessDecision {
  const decision = authorizeOperationalSession(session, permission);
  if (decision.allowed) {
    return { allowed: true, access: decision.session.access };
  }
  return {
    allowed: false,
    destination:
      decision.reason === "forbidden"
        ? "/operations/access-denied"
        : loginDestination(returnTo),
  };
}
