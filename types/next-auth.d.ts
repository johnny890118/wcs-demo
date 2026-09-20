import type {
  OperationalAccess,
  OperationalRuntime,
} from "../src/application/access/operational-access";

declare module "next-auth" {
  interface Session {
    access?: OperationalAccess;
    runtime?: OperationalRuntime;
  }

  interface User {
    access?: OperationalAccess;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access?: OperationalAccess;
  }
}
