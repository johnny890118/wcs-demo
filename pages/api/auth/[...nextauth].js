import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  createDemoOperationalAccess,
  loadOperationalRuntime,
} from "../../../src/infrastructure/auth/demo-identity";
import { absoluteAuthRedirect } from "../../../src/ui/auth/login-routing";
import {
  isOperationalAccess,
  selectCurrentWarehouse,
} from "../../../src/application/access/operational-access";
import { recordWarehouseContextChange } from "../../../src/infrastructure/http/wcs-api-client";

async function authorize(credentials) {
  const username = process.env.DEMO_ADMIN_USERNAME;
  const password = process.env.DEMO_ADMIN_PASSWORD;

  // This credentials provider exists only to protect the legacy local demo
  // during migration. The target identity/RBAC design will replace it.
  if (!username || !password || !credentials) {
    return null;
  }

  if (credentials.username === username && credentials.password === password) {
    return {
      id: "legacy-demo-admin",
      name: username,
      access: createDemoOperationalAccess(username),
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
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.access) token.access = user.access;
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
          token.access = selected;
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
};

export default NextAuth(authOptions);
