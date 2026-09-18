import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, destination: string) {
  await page.goto(destination);
  await expect(page).toHaveURL(/\/api\/auth\/signin/);
  await page.getByLabel("Username").fill("e2e-operator");
  await page.getByLabel("Password").fill("e2e-password");
  await page.getByRole("button", { name: "Sign in with Credentials" }).click();
  await expect(page).toHaveURL(destination);
}

const scenarioApi = "http://127.0.0.1:3101";
const serviceHeaders = { Authorization: "Bearer e2e-service-token" };

async function loadScenario(page: Page, name: string) {
  const response = await page.request.post(
    `${scenarioApi}/test/scenarios/${name}`,
    { headers: serviceHeaders },
  );
  expect(response.ok()).toBe(true);
}

test("public entry supports keyboard skip navigation and automated accessibility", async ({
  page,
}) => {
  await page.goto("/platform");
  const siteOrigin = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/Warehouse OS/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteOrigin}/platform`,
  );

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /operations");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`${siteOrigin}/contact`);
});

test("public entry reflows at a 200%-equivalent CSS viewport", async ({
  page,
}) => {
  // 640 CSS px represents a 1280 px browser viewport zoomed to 200%.
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/platform");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "開啟操作台" }).last(),
  ).toBeVisible();
});

test("authenticated focused projections expose screen-reader semantics", async ({
  page,
}) => {
  await signIn(page, "/operations/projections");

  await expect(
    page.getByRole("heading", { level: 1, name: "聚焦營運投影" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "操作台桌面版導覽" }),
  ).toBeVisible();
  await expect(page.getByRole("table", { name: "庫存" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "品項" })).toBeVisible();
  await expect(page.getByText("SKU-E2E")).toBeVisible();
  await expect(page.getByText("agv-e2e-01").first()).toBeVisible();
  await expect(
    page.getByText("receiving-01 → storage-01 · available", { exact: true }),
  ).toBeVisible();

  const mainSnapshot = await page.locator("#main-content").ariaSnapshot();
  expect(mainSnapshot).toContain('heading "聚焦營運投影" [level=1]');
  expect(mainSnapshot).toContain('table "庫存"');
  expect(mainSnapshot).toContain('columnheader "品項"');

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("completed inbound scenario projects stored inventory", async ({
  page,
}) => {
  await loadScenario(page, "inbound-completed");
  await signIn(page, "/operations/projections");

  const task = page
    .getByText("task-inbound-completed")
    .locator("..")
    .locator("..");
  await expect(task).toContainText("completed");
  await expect(task).toContainText("RECEIVING-01 → STORAGE-01");
  const inventoryRow = page.getByRole("row").filter({
    hasText: "SKU-INBOUND-E2E",
  });
  await expect(inventoryRow).toContainText("24");
  await expect(inventoryRow).toContainText("STORAGE-01");
  await expect(inventoryRow).toContainText("available");
});

test("completed outbound scenario projects shipping and remaining inventory", async ({
  page,
}) => {
  await loadScenario(page, "outbound-completed");
  await signIn(page, "/operations/projections");

  const task = page
    .getByText("task-outbound-completed")
    .locator("..")
    .locator("..");
  await expect(task).toContainText("completed");
  await expect(task).toContainText("STORAGE-01 → SHIPPING-01");
  const inventoryRow = page.getByRole("row").filter({
    hasText: "SKU-OUTBOUND-E2E",
  });
  await expect(inventoryRow).toContainText("14");
  await expect(inventoryRow).toContainText("available");
});

test("fault scenario requires acknowledgement then releases task for reassignment", async ({
  page,
}) => {
  await loadScenario(page, "faulted");
  await signIn(page, "/operations/projections");

  await expect(page.getByText("task-fault-e2e", { exact: true })).toBeVisible();
  await expect(page.getByText("blocked", { exact: true })).toBeVisible();
  await expect(page.getByText("DRIVE_BLOCKED")).toBeVisible();
  await expect(page.getByText("critical · active")).toBeVisible();

  const acknowledgement = await page.request.post(
    `${scenarioApi}/api/v1/alarms/alarm-fault-e2e/acknowledge`,
    { headers: serviceHeaders },
  );
  expect(acknowledgement.ok()).toBe(true);
  const recovery = await page.request.post(
    `${scenarioApi}/api/v1/alarms/alarm-fault-e2e/recover`,
    {
      headers: serviceHeaders,
      data: {
        strategy: "release",
        resolution: "Vehicle isolated; task returned for reassignment.",
        confirmedAction: "release_task",
        confirmationReason: "Supervisor approved deterministic E2E drill.",
      },
    },
  );
  expect(recovery.ok()).toBe(true);
  await page.reload();

  await expect(page.getByText("queued", { exact: true })).toBeVisible();
  await expect(page.getByText("尚未指派")).toBeVisible();
  await expect(page.getByText("critical · cleared")).toBeVisible();
  await expect(
    page.getByText("Vehicle isolated; task returned for reassignment."),
  ).toBeVisible();
});
