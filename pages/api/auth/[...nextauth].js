import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loadOperationalRuntime } from "../../../src/infrastructure/auth/demo-identity";
import {
  isHumanSessionExpired,
  isHumanSessionReference,
  loadHumanSessionTtlSeconds,
} from "../../../src/application/access/human-session";
import { absoluteAuthRedirect } from "../../../src/ui/auth/login-routing";
import {
  isOperationalAccess,
  selectCurrentWarehouse,
} from "../../../src/application/access/operational-access";
import {
  issueHumanOperationalSession,
  recordWarehouseContextChange,
  revokeHumanOperationalSession,
  validateHumanOperationalSession,
} from "../../../src/infrastructure/http/wcs-api-client";

export async function authorize(credentials) {
  const username = process.env.DEMO_ADMIN_USERNAME;
  const password = process.env.DEMO_ADMIN_PASSWORD;

  // This credentials provider exists only to protect the legacy local demo
  // during migration. The target identity/RBAC design will replace it.
  if (!username || !password || !credentials) {
    return null;
  }

  if (credentials.username === username && credentials.password === password) {
    const resolution = await issueHumanOperationalSession(
      "demo-credentials",
      "legacy-demo-admin",
    );
    return {
      id: resolution.access.principal.subject,
      name: resolution.access.principal.displayName,
      access: resolution.access,
      humanSession: resolution.session,
    };
  }

  return null;
}

export const authOptions = {
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize,
    }),
  ],
  // JWT_SECRET is read only as a local migration fallback for the legacy .env.
  // New environments must use NEXTAUTH_SECRET.
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  session: {
    maxAge: loadHumanSessionTtlSeconds(),
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.access && user?.humanSession) {
        token.access = user.access;
        token.humanSession = user.humanSession;
      } else if (isOperationalAccess(token.access)) {
        if (token.access.principal.kind === "human") {
          if (
            !isHumanSessionReference(token.humanSession) ||
            isHumanSessionExpired(token.humanSession)
          ) {
            clearHumanSession(token);
          } else {
            try {
              const resolution = await validateHumanOperationalSession(
                token.humanSession,
                token.access,
              );
              token.access = resolution.access;
              token.humanSession = resolution.session;
            } catch {
              clearHumanSession(token);
            }
          }
        }
      }
      if (trigger === "update") {
        if (!isOperationalAccess(token.access)) {
          throw new Error(
            "Cannot change an invalid operational access context.",
          );
        }
        const selected = selectCurrentWarehouse(
          token.access,
          session?.currentWarehouseId,
        );
        if (selected !== token.access) {
          await recordWarehouseContextChange(
            token.access,
            selected.currentWarehouseId,
          );
          if (!isHumanSessionReference(token.humanSession)) {
            throw new Error("Cannot update an invalid human session.");
          }
          const resolution = await validateHumanOperationalSession(
            token.humanSession,
            selected,
          );
          token.access = resolution.access;
          token.humanSession = resolution.session;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.access = token.access;
      session.runtime = loadOperationalRuntime();
      return session;
    },
    redirect({ url, baseUrl }) {
      return absoluteAuthRedirect(url, baseUrl);
    },
  },
  events: {
    async signOut({ token }) {
      if (isHumanSessionReference(token?.humanSession)) {
        await revokeHumanOperationalSession(token.humanSession, "sign_out");
      }
    },
  },
};

export default NextAuth(authOptions);

function clearHumanSession(token) {
  delete token.access;
  delete token.humanSession;
}
