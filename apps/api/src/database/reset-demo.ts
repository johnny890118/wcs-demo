import { Pool } from "pg";
import { loadLocalEnvironment } from "../config/load-local-env";

async function main(): Promise<void> {
  loadLocalEnvironment();
  if (process.env.ALLOW_DEMO_RESET !== "true") {
    throw new Error("Demo reset requires ALLOW_DEMO_RESET=true.");
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    const marker = await client.query<{ value: string }>(
      "SELECT value FROM platform_metadata WHERE key = 'deployment_mode'",
    );
    if (marker.rows[0]?.value !== "demo") {
      throw new Error(
        "Refusing reset because the database is not explicitly marked as demo.",
      );
    }

    await client.query("BEGIN");
    try {
      await client.query(`
        TRUNCATE route_plan_edges, route_plans,
          audit_events, outbox_events, alarms, inventory_allocations,
          transport_tasks, outbound_orders, inventory_units,
          loads, inbound_receipts
      `);
      await client.query("COMMIT");
      process.stdout.write("Demo transactional data reset completed.\n");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
