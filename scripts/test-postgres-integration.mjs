import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const composeFile = resolve("infra/compose.integration.yml");
const projectName = "wcs-demo-integration";
const databaseUrl = "postgresql://warehouse@127.0.0.1:55432/warehouse_test";

function run(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...environment },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with ${result.status}.`,
    );
  }
}

const composeArgs = ["compose", "-p", projectName, "-f", composeFile];

try {
  run("docker", [...composeArgs, "up", "-d", "--wait"]);
  run("npm", ["run", "db:migrate"], { DATABASE_URL: databaseUrl });
  run("npm", ["run", "db:seed:demo"], { DATABASE_URL: databaseUrl });
  run("npx", ["vitest", "run", "tests/integration/postgres-inbound.test.ts"], {
    DATABASE_URL: databaseUrl,
    RUN_POSTGRES_INTEGRATION: "1",
  });
  // Sequential: the control-ledger reset-boundary regression uses the real
  // operational truncate list inside a rolled-back disposable-DB transaction.
  run(
    "npx",
    ["vitest", "run", "tests/integration/postgres-demo-admission.test.ts"],
    {
      DATABASE_URL: databaseUrl,
      RUN_POSTGRES_INTEGRATION: "1",
    },
  );
  run("npm", ["run", "db:reset:demo"], {
    DATABASE_URL: databaseUrl,
    ALLOW_DEMO_RESET: "true",
  });
} finally {
  spawnSync("docker", [...composeArgs, "down", "--volumes"], {
    stdio: "inherit",
  });
}
