import { randomBytes, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { Pool } from "pg";

// Disposable, loopback-only production-like stack. Never reads production credentials.
const label = process.argv[2];
const workflow = process.argv[3] === "workflow";
if (!/^(before|after)$/.test(label ?? "")) {
  throw new Error("Provide measurement label: before or after.");
}
const container = `swp-navigation-${randomUUID()}`;
const baseURL = "http://127.0.0.1:3200";
const apiURL = "http://127.0.0.1:3201";
const environment = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://warehouse@127.0.0.1:55439/warehouse_navigation",
  NEXTAUTH_URL: baseURL,
  PUBLIC_SITE_URL: baseURL,
  NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
  DEMO_ADMIN_USERNAME: "navigation-test-operator",
  DEMO_ADMIN_PASSWORD: randomBytes(32).toString("hex"),
  INTERNAL_API_BASE_URL: apiURL,
  API_HOST: "127.0.0.1",
  API_PORT: "3201",
  PORT: "3201",
  API_SERVICE_ID: "navigation-test-web",
  API_SERVICE_TOKEN: randomBytes(32).toString("hex"),
  API_SERVICE_PERMISSIONS:
    "access.resolve,audit.view,operations.view,inbound.create,outbound.create,transport.execute,alarm.inject,alarm.acknowledge,alarm.recover",
  API_RATE_LIMIT_MAX: "10000",
  HUMAN_SESSION_READ_FRESHNESS_SECONDS: workflow
    ? label === "before"
      ? "3600"
      : "900"
    : label === "before"
      ? "0"
      : "3600",
  SWP_LIFECYCLE_ENVIRONMENT: "test",
  SWP_DEPLOYMENT_PROFILE: "private_demo",
  SWP_EQUIPMENT_SOURCE: "simulation",
};
const children = [];
let browser;
let created = false;
function run(command, args) {
  const result = spawnSync(command, args, {
    env: environment,
    encoding: "utf8",
  });
  if (result.status !== 0)
    throw new Error(`${command} failed (exit ${result.status}).`);
}
function start(command, args) {
  const child = spawn(command, args, { env: environment, stdio: "ignore" });
  children.push(child);
  return child;
}
async function ready(url, child) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null)
      throw new Error("Measurement server exited.");
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Measurement server did not become ready.");
}
function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return Number(sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(2));
}
try {
  run("docker", [
    "run",
    "--detach",
    "--name",
    container,
    "--publish",
    "127.0.0.1:55439:5432",
    "--tmpfs",
    "/var/lib/postgresql/data",
    "--env",
    "POSTGRES_DB=warehouse_navigation",
    "--env",
    "POSTGRES_USER=warehouse",
    "--env",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "postgres:17-alpine",
  ]);
  created = true;
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = spawnSync(
      "docker",
      [
        "exec",
        container,
        "pg_isready",
        "-U",
        "warehouse",
        "-d",
        "warehouse_navigation",
      ],
      { stdio: "ignore" },
    );
    if (result.status === 0) break;
    if (attempt === 79)
      throw new Error("Disposable PostgreSQL did not become ready.");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  run("node", ["dist/runtime/database/migrate.mjs"]);
  run("node", ["dist/runtime/database/seed-demo.mjs"]);
  const api = start("node", ["dist/runtime/main.mjs"]);
  await ready(`${apiURL}/api/v1/health/ready`, api);
  const web = start("node", [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3200",
  ]);
  await ready(baseURL, web);
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  if (workflow)
    await page.addInitScript(() => {
      document.addEventListener(
        "click",
        (event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('a[href^="/operations"]')
          )
            performance.mark("swp.benchmark_click");
        },
        true,
      );
    });
  await page.goto(`${baseURL}/login`);
  await page.locator("#username").fill(environment.DEMO_ADMIN_USERNAME);
  await page.locator("#password").fill(environment.DEMO_ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${baseURL}/operations`);
  await page.locator("h1").waitFor();
  const samples = [];
  const routes = workflow
    ? [
        "/operations/tasks",
        "/operations/inventory",
        "/operations/loads",
        "/operations/locations",
        "/operations/warehouse",
        "/operations/alarms",
        "/operations",
      ]
    : ["/operations/tasks", "/operations/inventory", "/operations/warehouse"];
  for (let index = 0; index < 63; index++) {
    const route = routes[index % routes.length];
    const responsePromise = workflow
      ? null
      : page.waitForResponse(
          (response) =>
            response.url().includes("/_next/data/") &&
            response.url().split("?")[0].endsWith(`${route}.json`),
        );
    const responseStages = [];
    const captureResponse = (response) => {
      if (
        response.url().includes("/_next/data/") ||
        response.url().includes("/api/operations/")
      )
        responseStages.push(response.headers()["server-timing"] ?? "");
    };
    if (workflow) page.on("response", captureResponse);
    const started = performance.now();
    await page.locator(`a[href="${route}"]:visible`).first().click();
    const response = responsePromise ? await responsePromise : null;
    await page.waitForURL(`${baseURL}${route}`);
    await page.locator("h1").waitFor();
    if (response && response.status() !== 200)
      throw new Error("Authenticated navigation failed.");
    let eventToUsable = null;
    if (workflow) {
      await page.waitForFunction(
        () => !document.querySelector('[data-projection-state="loading"]'),
      );
      eventToUsable = await page.evaluate(async () => {
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        const mark = performance.getEntriesByName("swp.benchmark_click").at(-1);
        return mark ? performance.now() - mark.startTime : null;
      });
      page.off("response", captureResponse);
    }
    const timing = workflow
      ? responseStages.join(",")
      : response.headers()["server-timing"] ?? "";
    const stages = {};
    for (const match of timing.matchAll(/([a-z_]+);dur=(\d+(?:\.\d+)?)/g))
      stages[match[1]] = Number(match[2]);
    if (index >= 3)
      samples.push({
        route,
        navigation_total: performance.now() - started,
        ...(workflow ? { event_to_usable: eventToUsable } : {}),
        ...stages,
      });
  }
  const metrics = {};
  for (const stage of [
    "navigation_total",
    ...(workflow ? ["event_to_usable"] : []),
    "navigation_server",
    "session_validation",
    "projection_api",
    "api_handler",
    "database_query",
  ]) {
    const values = samples
      .map((sample) => sample[stage])
      .filter((value) => typeof value === "number");
    metrics[stage] = {
      count: values.length,
      p50: percentile(values, 0.5),
      p95: percentile(values, 0.95),
    };
  }
  const browserNavigationEntries = await page.evaluate(
    () => performance.getEntriesByName("swp.navigation_total").length,
  );
  if (
    label === "after" &&
    (browserNavigationEntries < 1 || browserNavigationEntries > 50)
  )
    throw new Error("Browser navigation diagnostics did not remain bounded.");
  const securityRuntime = [];
  if (label === "after") {
    const pool = new Pool({ connectionString: environment.DATABASE_URL });
    const signedState = await page.context().storageState();
    const warehouseId = "10000000-0000-4000-8000-000000000001";
    const principalId = "a0000000-0000-4000-8000-000000000001";
    const original = await pool.query(
      "SELECT permissions FROM warehouse_access_assignments WHERE principal_id = $1 AND warehouse_id = $2",
      [principalId, warehouseId],
    );
    const routes = [
      "/api/operations/inbound",
      "/api/operations/outbound",
      "/api/operations/inbound/50000000-0000-4000-8000-000000000001/execute",
      "/api/operations/outbound/50000000-0000-4000-8000-000000000001/execute",
      "/api/operations/alarms/70000000-0000-4000-8000-000000000001/acknowledge",
      "/api/operations/alarms/70000000-0000-4000-8000-000000000001/recover",
    ];
    try {
      for (const scenario of [
        "principal_disable",
        "assignment_revoke",
        "permission_change",
        "session_revoke",
      ]) {
        try {
          if (scenario === "principal_disable")
            await pool.query(
              "UPDATE access_principals SET status = 'disabled' WHERE id = $1",
              [principalId],
            );
          if (scenario === "assignment_revoke")
            await pool.query(
              "UPDATE warehouse_access_assignments SET status = 'revoked' WHERE principal_id = $1 AND warehouse_id = $2",
              [principalId, warehouseId],
            );
          if (scenario === "permission_change")
            await pool.query(
              "UPDATE warehouse_access_assignments SET permissions = ARRAY['operations.view']::text[] WHERE principal_id = $1 AND warehouse_id = $2",
              [principalId, warehouseId],
            );
          if (scenario === "session_revoke")
            await pool.query(
              "UPDATE human_access_sessions SET revoked_at = now(), revocation_reason = 'administrative' WHERE principal_id = $1",
              [principalId],
            );
          const readContext = await browser.newContext({
            storageState: signedState,
          });
          try {
            const read = await readContext.request.get(
              `${baseURL}/api/operations/inventory`,
            );
            if (read.status() !== 200)
              throw new Error(`Bounded read contract failed: ${scenario}.`);
          } finally {
            await readContext.close();
          }
          const expected = scenario === "permission_change" ? 403 : 401;
          for (const route of routes) {
            // Restore the same fresh signed claims independently for each route.
            const context = await browser.newContext({
              storageState: signedState,
            });
            try {
              const mutation = await context.request.post(
                `${baseURL}${route}`,
                { headers: { Origin: baseURL }, data: {} },
              );
              if (mutation.status() !== expected)
                throw new Error(
                  `Strict mutation contract failed: ${scenario}.`,
                );
            } finally {
              await context.close();
            }
          }
          securityRuntime.push({
            scenario,
            boundedReadStatus: 200,
            strictMutationsChecked: routes.length,
            strictMutationStatus: expected,
          });
        } finally {
          await pool.query(
            "UPDATE access_principals SET status = 'active' WHERE id = $1",
            [principalId],
          );
          await pool.query(
            "UPDATE warehouse_access_assignments SET status = 'active', permissions = $3::text[] WHERE principal_id = $1 AND warehouse_id = $2",
            [principalId, warehouseId, original.rows[0].permissions],
          );
        }
      }
    } finally {
      await pool.end();
    }
  }
  const evidence = {
    label,
    environment:
      "local production builds; real Nest and disposable PostgreSQL; NOT production",
    warmupNavigations: 3,
    samples: samples.length,
    metrics,
    securityRuntime,
    browserNavigationEntries,
    workflow,
    readFreshnessSeconds: Number(
      environment.HUMAN_SESSION_READ_FRESHNESS_SECONDS,
    ),
    measurements: samples,
  };
  mkdirSync("tmp/navigation", { recursive: true });
  writeFileSync(
    `tmp/navigation/${workflow ? "workflow-" : ""}${label}.json`,
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        label,
        environment: evidence.environment,
        samples: samples.length,
        metrics,
        securityRuntime,
        browserNavigationEntries,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  for (const child of children.reverse()) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
  }
  // Exact agent-created disposable container only; tmpfs database is intentionally ephemeral.
  if (created)
    spawnSync("docker", ["rm", "--force", container], { stdio: "ignore" });
}
