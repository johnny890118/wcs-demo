import { Controller, Get, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "../database/database.module";

@Controller("v1/health")
export class HealthController {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  @Get("live")
  liveness(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  async readiness(): Promise<{ status: "ready" }> {
    await this.pool.query("SELECT 1");
    return { status: "ready" };
  }
}
