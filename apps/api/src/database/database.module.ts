import { Global, Module } from "@nestjs/common";
import { Pool } from "pg";
import { instrumentQueryTiming } from "./query-timing";

export const DATABASE_POOL = Symbol("DATABASE_POOL");

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error("DATABASE_URL is required to start the API.");
        }
        const pool = new Pool({ connectionString, max: 10 });
        pool.on("connect", instrumentQueryTiming);
        return pool;
      },
    },
  ],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
