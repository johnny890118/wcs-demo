import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

// Actual production-build Next, isolated loopback API sentinel, no credentials
// or requests to managed services. An old valid carrier must not reach the API.
let apiRequests = 0;
const sentinel = createServer((_request, response) => {
  apiRequests++;
  response.writeHead(500).end();
});
await new Promise((resolve) => sentinel.listen(0, "127.0.0.1", resolve));
const apiPort = sentinel.address().port;
const portProbe = createServer();
await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const secret = randomBytes(32).toString("hex");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    stdio: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXTAUTH_URL: origin,
      PUBLIC_SITE_URL: origin,
      NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
      ANONYMOUS_DEMO_SECRET: secret,
      PUBLIC_DEMO_USER_PERMISSIONS: "operations.view,inbound.create",
      API_SERVICE_TOKEN: randomBytes(32).toString("hex"),
      INTERNAL_API_BASE_URL: `http://127.0.0.1:${apiPort}`,
      SWP_LIFECYCLE_ENVIRONMENT: "production",
      SWP_DEPLOYMENT_PROFILE: "public_demo",
      SWP_EQUIPMENT_SOURCE: "simulation",
    },
  },
);
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error("Local Next process exited.");
    try {
      const response = await fetch(`${origin}/api/demo/session`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.status === 405) {
        ready = true;
        break;
      }
    } catch {
      /* bounded startup polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, "Local production-build Next did not become ready.");
  const issuance = await fetch(`${origin}/api/demo/session`, {
    method: "POST",
    headers: { origin },
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(issuance.status, 503);
  assert.equal(issuance.headers.get("set-cookie"), null);
  assert.equal(
    (await issuance.json()).code,
    "PUBLIC_DEMO_LIFECYCLE_UNAVAILABLE",
  );
  const encoded = Buffer.from(
    JSON.stringify({
      version: 1,
      audience: "swp-public-demo",
      sessionId: randomUUID(),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1_800_000).toISOString(),
    }),
  ).toString("base64url");
  const token = `${encoded}.${createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url")}`;
  const headers = { origin, cookie: `swp_anonymous_demo=${token}` };
  for (const [path, method] of [
    ["/api/operations/home", "GET"],
    ["/api/operations/inbound", "POST"],
  ]) {
    const response = await fetch(`${origin}${path}`, {
      method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(
      response.status,
      401,
      "Old carrier must not authorize a read or mutation.",
    );
  }
  const page = await fetch(`${origin}/operations/tasks`, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(page.status, 307);
  assert(page.headers.get("location")?.startsWith("/login?callbackUrl="));
  assert.equal(apiRequests, 0, "Unisolated carrier reached the API.");
  process.stdout.write(
    "Production-build public-demo boundary passed: issuance closed; old carrier read/mutation/SSR denied; zero upstream calls.\n",
  );
} finally {
  if (child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    const forceExit = setTimeout(() => child.kill("SIGKILL"), 5_000);
    try {
      await exited;
    } finally {
      clearTimeout(forceExit);
    }
  }
  await new Promise((resolve) => sentinel.close(resolve));
}
