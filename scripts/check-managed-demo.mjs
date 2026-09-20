const webOrigin = new URL(
  process.env.MANAGED_WEB_ORIGIN ?? "https://wcs-demo.vercel.app",
);
const apiOrigin = new URL(
  process.env.MANAGED_API_ORIGIN ??
    "https://warehouse-platform-api.onrender.com",
);

async function request(path, options = {}) {
  const response = await fetch(new URL(path, webOrigin), {
    redirect: "manual",
    signal: AbortSignal.timeout(70_000),
    ...options,
  });
  return response;
}

function requireStatus(response, expected, label) {
  if (!expected.includes(response.status)) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
}

const entry = await request("/");
requireStatus(entry, [200], "Canonical entry");
const entryBody = await entry.text();
if (!entryBody.includes("Warehouse OS")) {
  throw new Error("Canonical entry did not render the product shell.");
}

const formerEntry = await request("/platform");
requireStatus(formerEntry, [307, 308], "Former product entry");
if (formerEntry.headers.get("location") !== "/") {
  throw new Error("Former product entry did not redirect to canonical root.");
}

const legacy = await request("/legacy");
requireStatus(legacy, [200], "Legacy migration reference");
if (legacy.headers.get("x-robots-tag") !== "noindex, nofollow") {
  throw new Error("Legacy migration reference is missing noindex policy.");
}

const operations = await request("/operations");
requireStatus(operations, [302, 303, 307, 308], "Protected operations entry");
if (!operations.headers.get("location")?.startsWith("/api/auth/signin")) {
  throw new Error("Protected operations entry did not redirect to sign-in.");
}
if (operations.headers.get("x-robots-tag") !== "noindex, nofollow") {
  throw new Error("Protected operations entry is missing noindex policy.");
}

const robots = await request("/robots.txt");
requireStatus(robots, [200], "Robots policy");
const robotsBody = await robots.text();
for (const directive of ["Disallow: /operations", "Disallow: /legacy"]) {
  if (!robotsBody.includes(directive)) {
    throw new Error(`Robots policy is missing ${directive}.`);
  }
}

const sitemap = await request("/sitemap.xml");
requireStatus(sitemap, [200], "Sitemap");
const sitemapBody = await sitemap.text();
if (!sitemapBody.includes(`<loc>${webOrigin.origin}/</loc>`)) {
  throw new Error("Sitemap is missing the canonical root.");
}
if (sitemapBody.includes(`${webOrigin.origin}/platform`)) {
  throw new Error("Sitemap still exposes the former product entry.");
}

const health = await fetch(new URL("/api/v1/health/live", apiOrigin), {
  signal: AbortSignal.timeout(70_000),
});
requireStatus(health, [200], "Managed API liveness");
const healthBody = await health.json();
if (healthBody?.status !== "ok") {
  throw new Error("Managed API liveness payload is invalid.");
}

console.log(
  `Managed demo checks passed for ${webOrigin.origin} and ${apiOrigin.origin}.`,
);
