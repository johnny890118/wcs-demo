import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, destination: string) {
  await page.goto(destination);
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  await page.getByLabel("使用者名稱").fill("e2e-operator");
  await page.getByLabel("密碼").fill("e2e-password");
  await page.getByRole("button", { name: "登入" }).click();
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
  await expect(page).toHaveURL("/");
  const siteOrigin = new URL(page.url()).origin;

  await expect(page).toHaveTitle(/Smart Warehouse Platform/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteOrigin}/`,
  );

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /login");
  expect(await robots.text()).toContain("Disallow: /operations");
  expect(await robots.text()).toContain("Disallow: /legacy");
  const sitemap = await page.request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain(`<loc>${siteOrigin}/</loc>`);
  expect(await sitemap.text()).not.toContain(`${siteOrigin}/platform`);
  expect(await sitemap.text()).not.toContain(`${siteOrigin}/contact`);
});

test("the public root is a thin unauthenticated system entry", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Smart Warehouse Platform" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "進入系統" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.getByRole("link", { name: "關於" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "聯絡" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /舊版/ })).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

test("login and every operations route enforce the private surface boundary", async ({
  page,
}) => {
  for (const path of [
    "/operations",
    "/operations/warehouse",
    "/operations/projections",
    "/operations/inbound",
    "/operations/outbound",
    "/operations/alarms",
    "/operations/audit",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      `/login?callbackUrl=${encodeURIComponent(path)}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  }

  await page.goto("/login?callbackUrl=https%3A%2F%2Fevil.example%2Foperations");
  await page.getByLabel("使用者名稱").fill("e2e-operator");
  await page.getByLabel("密碼").fill("e2e-password");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page).toHaveURL("/operations");

  await page.goto("/");
  await expect(page.getByRole("link", { name: "進入系統" })).toHaveAttribute(
    "href",
    "/operations",
  );
});

test("public entry reflows at a 200%-equivalent CSS viewport", async ({
  page,
}) => {
  // 640 CSS px represents a 1280 px browser viewport zoomed to 200%.
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "進入系統" })).toBeVisible();
});

test("public entry supports both locales in explicit light and dark themes", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "淺色" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect(page.locator("html")).toHaveClass(/light/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Smart Warehouse Platform",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("One operational truth, from dock to device."),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("theme preference has exactly one selection and persists across refresh", async ({
  page,
}) => {
  await page.goto("/");
  const themeChoices = page.locator("[data-theme-preference]");
  const selectedChoices = page.locator(
    '[data-theme-preference][aria-pressed="true"]',
  );

  await expect(page.getByRole("button", { name: "系統" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(themeChoices).toHaveCount(3);
  await expect(selectedChoices).toHaveCount(1);

  await page.getByRole("button", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "深色" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(selectedChoices).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole("button", { name: "深色" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(selectedChoices).toHaveCount(1);

  await page.getByRole("button", { name: "系統" }).click();
  await expect(page.getByRole("button", { name: "系統" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(selectedChoices).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole("button", { name: "系統" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(selectedChoices).toHaveCount(1);
});

test("login reflows and remains accessible on mobile in all theme modes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  for (const theme of ["淺色", "深色", "系統"]) {
    await page.getByRole("button", { name: theme }).click();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await expect(page.getByRole("button", { name: "登入" })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }

  await page.reload();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
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
  await expect(
    page.getByLabel("目前營運情境").getByText("Deterministic Demo Warehouse"),
  ).toBeVisible();
  await expect(
    page.getByLabel("目前營運情境").getByText("DEMO", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("目前營運情境").getByText("示範環境"),
  ).toBeVisible();
  await expect(
    page.getByLabel("目前營運情境").getByText("模擬設備"),
  ).toBeVisible();
  await expect(page.getByText("e2e-operator", { exact: true })).toBeVisible();
  await expect(page.locator('a[href="/legacy"]')).toHaveCount(0);
  const sidebar = page.locator("aside");
  await expect(sidebar).toHaveCSS("position", "sticky");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await sidebar.boundingBox())?.y).toBe(0);
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

test("operator can read redacted, bilingual audit history", async ({
  page,
}) => {
  await signIn(page, "/operations/audit");
  await expect(
    page.getByRole("heading", { level: 1, name: "可歸責的營運歷程" }),
  ).toBeVisible();
  await expect(page.getByText("transport_task.complete")).toBeVisible();
  await expect(page.getByText("e2e-operator").first()).toBeVisible();
  await expect(page.getByText("未知動作")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Accountable operational history",
    }),
  ).toBeVisible();
  await expect(page.getByText("Unknown action")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("warehouse map renders timestamped equipment observation without using assignment", async ({
  page,
}) => {
  await signIn(page, "/operations/warehouse");

  await expect(
    page.getByRole("heading", { level: 1, name: "即時倉庫拓撲" }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "即時倉庫拓撲" })).toBeVisible();
  await expect(page.getByText("設定座標", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "receiving-01" }),
  ).toBeVisible();
  await expect(
    page.getByText("設備標記來自帶有時間戳的後端觀測。"),
  ).toBeVisible();
  await expect(page.getByText("agv-e2e-01").first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("warehouse map reflows without horizontal page overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/operations/warehouse");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("img", { name: "即時倉庫拓撲" })).toBeVisible();
  await expect(page.getByRole("button", { name: "storage-01" })).toBeVisible();
});

test("operator creates, confirms, and executes an inbound workflow", async ({
  page,
}) => {
  await signIn(page, "/operations/inbound");

  await page.getByLabel("外部參考編號").fill("ASN-UI-E2E-01");
  await page.getByLabel("外部載具編號").fill("PALLET-UI-E2E-01");
  await page.getByLabel("品項").fill("SKU-UI-E2E");
  await page.getByLabel("數量").fill("6");
  await page.getByRole("button", { name: "建立入庫單" }).click();

  await expect(
    page.getByText("50000000-0000-4000-8000-000000000099"),
  ).toBeVisible();
  await page
    .getByLabel("確認理由")
    .fill("已確認收貨資料、路線與即時設備狀態。");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "確認並執行入庫任務" }).click();

  await expect(page.getByText("入庫執行完成")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("link", { name: "查看任務稽核證據" }).click();
  await expect(page).toHaveURL(/resourceType=TransportTask/);
  await expect(page.getByText("transport_task.complete")).toBeVisible();
});

test("inbound workflow reflows without horizontal page overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/operations/inbound");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(
    page.getByRole("heading", { level: 1, name: "建立並執行入庫作業" }),
  ).toBeVisible();
  await expect(page.getByLabel("外部參考編號")).toBeVisible();
  await expect(page.getByRole("button", { name: "建立入庫單" })).toBeVisible();
});

test("operator allocates, confirms, and executes an outbound workflow", async ({
  page,
}) => {
  await signIn(page, "/operations/outbound");

  await page.getByLabel("外部參考編號").fill("SO-UI-E2E-01");
  await page.getByLabel("數量").fill("2");
  await page.getByRole("button", { name: "建立並配貨出庫單" }).click();

  await expect(
    page.getByText("a0000000-0000-4000-8000-000000000099"),
  ).toBeVisible();
  await page
    .getByLabel("確認理由")
    .fill("已確認配貨、出貨終點與即時設備狀態。");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "確認並執行出庫任務" }).click();

  await expect(page.getByText("出庫作業已完成")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("link", { name: "查看出庫單稽核證據" }).click();
  await expect(page.getByText("outbound_order.allocate")).toBeVisible();
});

test("outbound workflow reflows without horizontal page overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/operations/outbound");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(
    page.getByRole("heading", { level: 1, name: "建立並執行出庫作業" }),
  ).toBeVisible();
  await expect(page.getByLabel("外部參考編號")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "建立並配貨出庫單" }),
  ).toBeVisible();
});

test("operator acknowledges and releases a faulted task", async ({ page }) => {
  await loadScenario(page, "faulted");
  await signIn(page, "/operations/alarms");

  await expect(
    page.getByRole("heading", { level: 1, name: "確認警報並復原受阻作業" }),
  ).toBeVisible();
  await page.getByLabel("確認理由").fill("已檢視警報、任務與設備證據。");
  await page
    .getByLabel("我已檢視警報、受影響任務、設備與目前營運證據。")
    .check();
  await page.getByRole("button", { name: "確認警報" }).click();

  await page.getByLabel("復原策略").selectOption("release");
  await page.getByLabel("處置結果").fill("車輛已隔離，任務釋放回待指派佇列。");
  await page.getByLabel("確認理由").fill("主管已確認車輛隔離與任務釋放條件。");
  await page.getByLabel("我已確認復原條件，並授權所選的任務狀態轉換。").check();
  await page.getByRole("button", { name: "確認並復原任務" }).click();

  await expect(page.getByText("警報復原完成")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("link", { name: "查看警報稽核證據" }).click();
  await expect(page.getByText("alarm.acknowledge")).toBeVisible();
});

test("alarm workflow reflows without horizontal page overflow on mobile", async ({
  page,
}) => {
  await loadScenario(page, "faulted");
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/operations/alarms");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(
    page.getByRole("heading", { level: 1, name: "確認警報並復原受阻作業" }),
  ).toBeVisible();
  await expect(page.getByLabel("選擇警報")).toBeVisible();
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

  await expect(
    page.getByText("50000000-0000-4000-8000-000000000098", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("blocked", { exact: true })).toBeVisible();
  await expect(page.getByText("DRIVE_BLOCKED")).toBeVisible();
  await expect(page.getByText("critical · active")).toBeVisible();

  const acknowledgement = await page.request.post(
    `${scenarioApi}/api/v1/alarms/80000000-0000-4000-8000-000000000098/acknowledge`,
    {
      headers: { ...serviceHeaders, "X-Operator-Id": "e2e-operator" },
      data: {
        confirmedAction: "acknowledge_alarm",
        confirmationReason: "Operator reviewed deterministic fault evidence.",
      },
    },
  );
  expect(acknowledgement.ok()).toBe(true);
  const recovery = await page.request.post(
    `${scenarioApi}/api/v1/alarms/80000000-0000-4000-8000-000000000098/recover`,
    {
      headers: { ...serviceHeaders, "X-Operator-Id": "e2e-operator" },
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
