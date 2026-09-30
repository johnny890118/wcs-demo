import type {
  OperationalAccess,
  OperationalRuntime,
} from "../src/application/access/operational-access";
import type { HumanSessionReference } from "../src/application/access/human-session";

declare module "next-auth" {
  interface Session {
    access?: OperationalAccess;
    runtime?: OperationalRuntime;
  }

  interface User {
    access?: OperationalAccess;
    humanSession?: HumanSessionReference;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access?: OperationalAccess;
    humanSession?: HumanSessionReference;
  }
}
