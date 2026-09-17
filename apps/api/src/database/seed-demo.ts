import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { loadLocalEnvironment } from "../config/load-local-env";

async function main(): Promise<void> {
  loadLocalEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const sql = await readFile(
    resolve(process.cwd(), "apps/api/seeds/demo.sql"),
    "utf8",
  );
  const pool = new Pool({ connectionString, max: 1 });
  try {
    await pool.query(sql);
    process.stdout.write("Applied deterministic demo seed.\n");
  } finally {
    await pool.end();
  }
}

void main();
