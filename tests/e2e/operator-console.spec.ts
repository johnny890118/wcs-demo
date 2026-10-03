import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
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

async function reviewCreatedWorkflow(page: Page, name: string) {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const locale of ["zh-TW", "en"] as const) {
    await page
      .getByRole("button", {
        name: locale === "en" ? "EN" : "繁中",
        exact: true,
      })
      .click();
    for (const mode of ["light", "dark"] as const) {
      const theme =
        locale === "en"
          ? mode === "light"
            ? "Light"
            : "Dark"
          : mode === "light"
            ? "淺色"
            : "深色";
      await page.getByRole("button", { name: theme, exact: true }).click();
      await expect(page.locator("html")).toHaveClass(new RegExp(mode));
      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({
        path: test.info().outputPath(`${name}-${locale}-${mode}.png`),
        fullPage: true,
      });
    }
  }
  await page.getByRole("button", { name: "繁中", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
}

test("active surfaces share SWP identity and owned browser icons", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Smart Warehouse Platform");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "Smart Warehouse Platform",
  );
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute("href", "/swp-icon.svg");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/swp-apple-touch-icon.png",
  );
  await expect(page.locator('img[src="/swp-icon.svg"]')).toBeVisible();
  for (const asset of [
    "/swp-icon.svg",
    "/swp-icon-32.png",
    "/swp-apple-touch-icon.png",
    "/favicon.ico",
  ]) {
    expect((await page.request.get(asset)).status()).toBe(200);
  }
  await page.goto("/login");
  await expect(page).toHaveTitle(/Smart Warehouse Platform/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    await page.title(),
  );
  await signIn(page, "/operations");
  for (const destination of [
    "/operations",
    "/operations/tasks",
    "/operations/inventory",
    "/operations/loads",
    "/operations/locations",
    "/operations/warehouse",
    "/operations/warehouse/topology",
    "/operations/help",
    "/operations/inbound",
    "/operations/outbound",
    "/operations/alarms",
    "/operations/audit",
    "/operations/projections",
  ]) {
    await page.goto(destination);
    await expect(page).toHaveTitle(/Smart Warehouse Platform/);
    expect(await page.title()).not.toMatch(/wcs.?demo/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      await page.title(),
    );
    await expect(
      page.locator('link[rel="icon"][href="/female.png"]'),
    ).toHaveCount(0);
  }
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page).toHaveTitle(/Smart Warehouse Platform/);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.screenshot({
    path: test.info().outputPath("swp-identity-operations-dark.png"),
    fullPage: true,
  });
});

test("Live View separates observations from assignments and expires retained position", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-18T08:00:00.000Z") });
  await signIn(page, "/operations/warehouse");
  await expect(
    page.getByRole("heading", { name: "倉庫即時觀測", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("本次觀測沒有回報任務 reference；系統指派的工作另列。", {
      exact: true,
    }),
  ).toBeVisible();
  const payload = await (
    await page.request.get("/api/operations/live-view")
  ).json();
  const taskLink = page
    .locator(`a[href="/operations/tasks/${payload.work[0].taskId}"]`)
    .first();
  await expect(taskLink).toBeVisible();
  await taskLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`/operations/tasks/${payload.work[0].taskId}`);
  await page.goto("/operations/warehouse");
  const disclosure = page.locator("summary").last();
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(payload.equipment[0].position.nodeId, { exact: true }),
  ).toBeVisible();
  await page.route("**/api/operations/live-view", (route) =>
    route.fulfill({ status: 503, json: { code: "LIVE_VIEW_UNAVAILABLE" } }),
  );
  await page.clock.fastForward(31_000);
  await expect(
    page.getByText("目前證據已過期或更新失敗；畫面上的位置現在僅為最後已知。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("合格的目前觀測", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page
      .locator(`a[href="/operations/tasks/${payload.work[0].taskId}"]`)
      .first(),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("live-view-desktop-last-known.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  for (const theme of ["Dark", "Light"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test
        .info()
        .outputPath(`live-view-mobile-${theme.toLowerCase()}.png`),
      fullPage: true,
    });
  }
  await page.unroute("**/api/operations/live-view");
  await page
    .getByLabel("Current warehouse")
    .selectOption("20000000-0000-4000-8000-000000000010");
  await expect(
    page.getByText("No equipment in this scoped projection.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: new RegExp(payload.equipment[0].equipmentId),
    }),
  ).toHaveCount(0);
});

test("contextual manual supports bilingual literal search, keyboard links and accessible mobile themes", async ({
  page,
}) => {
  await signIn(page, "/operations/warehouse");
  await page
    .getByRole("link", { name: "此工作區的操作說明", exact: true })
    .click();
  await expect(page).toHaveURL("/operations/help?topic=live-view");
  await expect(page.locator("main section").first()).toHaveAttribute(
    "id",
    "live-view",
  );
  await page.getByLabel("搜尋操作手冊").fill("未知");
  await expect(
    page.getByRole("heading", { name: "警報與未知結果", exact: true }),
  ).toBeVisible();
  await page.getByLabel("搜尋操作手冊").fill(".*");
  await expect(
    page.getByText("沒有符合的主題，請改用流程或狀態名稱搜尋。", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("搜尋操作手冊").fill("");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Search the operation manual").fill("last-known");
  await expect(
    page.getByRole("heading", {
      name: "Live View and trustworthy observations",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Search the operation manual")
    .fill("no matching phrase");
  await expect(
    page.getByText("No matching topics. Try a workflow or state name.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Search the operation manual").fill("");
  await page.screenshot({
    path: test.info().outputPath("manual-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["Dark", "Light"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`manual-mobile-${theme.toLowerCase()}.png`),
      fullPage: true,
    });
  }
  const sectionLink = page
    .getByRole("navigation", { name: "Manual contents" })
    .getByRole("link", { name: "Accountable history", exact: true });
  await sectionLink.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#audit$/);
  await page
    .getByRole("link", { name: "Open audit history", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/operations/audit");
});

test("versioned manual downloads are authenticated bilingual PDFs present in standalone output", async ({
  page,
}) => {
  expect((await page.request.get("/api/operations/manual/en")).status()).toBe(
    401,
  );
  await signIn(page, "/operations/help");
  for (const locale of ["zh-TW", "en"]) {
    if (locale === "en")
      await page.getByRole("button", { name: "EN", exact: true }).click();
    const link = page.getByRole("link", {
      name:
        locale === "en"
          ? "Download versioned PDF manual"
          : "下載版本化 PDF 手冊",
      exact: true,
    });
    await expect(link).toHaveAttribute(
      "href",
      `/api/operations/manual/${locale}`,
    );
    const response = await page.request.get(`/api/operations/manual/${locale}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    expect(response.headers()["content-disposition"]).toContain(
      `2026-10-03.1-${locale}.pdf`,
    );
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
    expect(
      readFileSync(
        `.next/standalone/output/pdf/swp-operation-manual-${locale}.pdf`,
      )
        .subarray(0, 5)
        .toString(),
    ).toBe("%PDF-");
  }
});

test("navigation signals SSR waiting and Home refresh uses one bounded read", async ({
  page,
}) => {
  await page.clock.install();
  await signIn(page, "/operations");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      [
        "/api/operations/overview",
        "/api/operations/home",
        "/api/operations/summary",
      ].some((path) => request.url().endsWith(path))
    )
      requests.push(new URL(request.url()).pathname);
  });
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/operations/overview") &&
      response.status() === 200,
  );
  await page.clock.fastForward(10010);
  const initialResponse = await response;
  expect(requests).toEqual(["/api/operations/overview"]);
  const initialPayload = await initialResponse.json();
  await page.route("**/api/operations/overview", (route) =>
    route.fulfill({
      status: 200,
      json: { home: null, summary: initialPayload.summary },
    }),
  );
  await page.clock.fastForward(10010);
  await expect(
    page.getByRole("status").filter({ hasText: "目前觀測無法更新" }),
  ).toBeVisible();
  await expect(
    page.getByText("目前投影沒有待處理事項。", { exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/operations/overview");
  let release: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/data/**/operations/tasks.json*", async (route) => {
    await ready;
    await route.continue();
  });
  const navigation = page
    .getByRole("navigation", { name: "操作台桌面版導覽" })
    .getByRole("link", { name: "任務", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "正在開啟工作區" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("navigation-pending.png"),
    fullPage: true,
  });
  release();
  await navigation;
  await expect(page).toHaveURL("/operations/tasks");
  await expect(
    page.getByRole("status").filter({ hasText: "正在開啟工作區" }),
  ).toHaveCount(0);
});

test("locations explain configured states and record counts without occupancy claims", async ({
  page,
}) => {
  await signIn(page, "/operations/locations");
  await expect(
    page.getByText("設定為阻擋 — 需要檢查", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("未綁定有效路由版本 — 需要檢查", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("載具紀錄筆數（含歷史）", { exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByText("未出庫的庫存紀錄筆數", { exact: true }),
  ).toHaveCount(2);
  await page.route("**/api/operations/locations?*", (route) =>
    route.fulfill({ status: 503, json: { code: "LOCATIONS_UNAVAILABLE" } }),
  );
  await page.getByRole("button", { name: "載入更多位置", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "位置資料暫時無法取得" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "STORAGE-01", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/operations/locations?*");
  await page.getByRole("button", { name: "載入更多位置", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "載入更多位置", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "STORAGE-01", exact: true }),
  ).toHaveCount(1);
  await page.screenshot({
    path: test.info().outputPath("locations-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("搜尋位置或類型").fill("missing");
  await page.getByLabel("搜尋位置或類型").press("Enter");
  await expect(
    page.getByText("目前倉庫與搜尋條件沒有符合的位置。"),
  ).toBeVisible();
  await page.getByRole("link", { name: "清除", exact: true }).click();
  const disclosure = page.locator("summary").first();
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/routing-storage-node/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("locations-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Light", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("link", { name: "Search related loads", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/operations\/loads\?search=STORAGE-01/);
  await page
    .getByRole("navigation", { name: "Inventory workspace" })
    .getByRole("link", { name: "Locations", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Search related inventory", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/operations\/inventory\?search=STORAGE-01/);
  await page
    .getByRole("navigation", { name: "Inventory workspace" })
    .getByRole("link", { name: "Locations", exact: true })
    .click();
  await page
    .getByRole("combobox")
    .selectOption("20000000-0000-4000-8000-000000000010");
  await expect(
    page.getByRole("heading", { name: "STORAGE-01", exact: true }),
  ).toHaveCount(0);
});

test("loads preserve unknown inventory and zero shipped stock across readable bilingual views", async ({
  page,
}) => {
  await signIn(page, "/operations/loads");
  await expect(page.getByText("尚未記錄庫存", { exact: true })).toBeVisible();
  await expect(
    page.getByText("已出庫 — 無現存庫存", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("loads-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("搜尋 SKU、載具或位置").fill("missing");
  await page.getByLabel("搜尋 SKU、載具或位置").press("Enter");
  await expect(
    page.getByText("目前倉庫與搜尋條件沒有符合的載具。"),
  ).toBeVisible();
  await page.getByRole("link", { name: "清除", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("loads-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Light", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("link", { name: "View inventory context" })
    .first()
    .click();
  await expect(page).toHaveURL(
    /\/operations\/inventory\?search=PALLET-RECEIVED-001/,
  );
  await page
    .getByRole("navigation", { name: "Inventory workspace" })
    .getByRole("link", { name: "Loads", exact: true })
    .click();
  await page
    .getByRole("combobox")
    .selectOption("20000000-0000-4000-8000-000000000010");
  await expect(
    page.getByRole("heading", { name: "PALLET-RECEIVED-001" }),
  ).toHaveCount(0);
});

test("inventory explains partial reservations with searchable accessible warehouse context", async ({
  page,
}) => {
  await signIn(page, "/operations/inventory");
  await expect(
    page.getByRole("heading", { name: "SKU-STOCK-001 · STORAGE-01" }),
  ).toBeVisible();
  await expect(
    page.getByText("出庫保留量", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("已出庫 — 無現存庫存", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "查看入庫單稽核證據" }).first(),
  ).toHaveAttribute("href", /resourceType=InboundReceipt/);
  await page.getByLabel("搜尋 SKU、載具或位置").fill("missing");
  await page.getByLabel("搜尋 SKU、載具或位置").press("Enter");
  await expect(
    page.getByText("目前倉庫與搜尋條件沒有符合的庫存。"),
  ).toBeVisible();
  await page.getByRole("link", { name: "清除", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("inventory-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Light", exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("combobox")
    .selectOption("20000000-0000-4000-8000-000000000010");
  await expect(
    page.getByRole("heading", { name: "SKU-STOCK-001 · STORAGE-01" }),
  ).toHaveCount(0);
});

test("task queue and detail expose contextual evidence across accessible warehouse views", async ({
  page,
}) => {
  await signIn(page, "/operations/tasks");
  await expect(
    page.getByRole("heading", { name: "任務", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /開啟任務/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "工作與載具情境" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "查看任務稽核證據" }),
  ).toHaveAttribute("href", /resourceType=TransportTask&resourceId=50000000/);
  await page.screenshot({
    path: test.info().outputPath("task-detail-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Work and load context" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("task-detail-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Return to tasks" }).click();
  await page.getByRole("link", { name: "All work", exact: true }).click();
  await expect(page).toHaveURL(/view=all/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("combobox")
    .selectOption("20000000-0000-4000-8000-000000000010");
  await expect(page.getByRole("link", { name: /Open task/ })).toHaveCount(0);
});

test("operations home prioritizes readable work and supports bilingual mobile accessibility", async ({
  page,
}) => {
  await signIn(page, "/operations");
  await expect(page.getByRole("heading", { name: "營運首頁" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "需要注意" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "等待中與進行中工作" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("home-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "深色" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("heading", { name: "Operations Home" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("home-mobile-dark.png"),
    fullPage: true,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Light" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
const serviceHeaders = {
  Authorization: "Bearer e2e-service-token",
  "X-SWP-Principal": "legacy-demo-admin",
  "X-SWP-User-Permissions":
    "operations.view,audit.view,inbound.create,outbound.create,transport.execute,alarm.acknowledge,alarm.recover",
  "X-SWP-Warehouse-Scopes":
    "10000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000010",
  "X-SWP-Warehouse": "10000000-0000-4000-8000-000000000001",
};

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

test("dormant contact exposes only the approved email, not private repository channels", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "johnny0929560027@gmail.com" }),
  ).toHaveAttribute("href", "mailto:johnny0929560027@gmail.com");
  expect(await page.content()).not.toMatch(
    /github\.com|wcs-demo\/issues|issue tracker/i,
  );
  await page.getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("heading", { name: "Email contact" }),
  ).toBeVisible();
  expect(await page.content()).not.toMatch(
    /github\.com|wcs-demo\/issues|issue tracker/i,
  );
  await page.goto("/");
  await expect(page.locator('a[href="/contact"]')).toHaveCount(0);
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
    "/operations/tasks",
    "/operations/inventory",
    "/operations/loads",
    "/operations/locations",
    "/operations/tasks/50000000-0000-4000-8000-000000000001",
    "/operations/help",
    "/operations/warehouse",
    "/operations/warehouse/topology",
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

test("operator switches only between authorized warehouse contexts", async ({
  page,
}) => {
  await signIn(page, "/operations");
  const selector = page.getByRole("combobox", { name: "目前倉庫" });
  await expect(selector).toHaveValue("10000000-0000-4000-8000-000000000001");
  await selector.selectOption("20000000-0000-4000-8000-000000000010");
  await expect(selector).toHaveValue("20000000-0000-4000-8000-000000000010");
  await expect(page).toHaveURL("/operations");
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
  const warehouseContext = page.getByRole("combobox", { name: "目前倉庫" });
  await expect(warehouseContext).toHaveValue(
    "10000000-0000-4000-8000-000000000001",
  );
  await expect(warehouseContext.locator("option:checked")).toHaveText(
    "Deterministic Demo Warehouse · DEMO",
  );
  await expect(
    page.getByLabel("目前營運情境").getByText("私人示範／訓練"),
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
  await page.clock.install();
  await signIn(page, "/operations/warehouse/topology");

  await expect(
    page.getByRole("heading", { level: 1, name: "拓撲檢視" }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "拓撲檢視" })).toBeVisible();
  await expect(page.getByText("設定座標", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "receiving-01" }),
  ).toBeVisible();
  await expect(
    page.getByText("設備標記來自帶有時間戳的後端觀測。"),
  ).toBeVisible();
  await expect(page.getByText("agv-e2e-01").first()).toBeVisible();
  await expect(page.getByText("RECEIVING-01", { exact: true })).toBeVisible();
  await expect(page.getByText("task-e2e-001", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "storage-01" }).click();
  await expect(page.getByText("STORAGE-01", { exact: true })).toBeVisible();
  await expect(page.getByText("已記錄庫存筆數", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/topology-inspector-binding.png",
    fullPage: true,
  });

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "receiving-01" }).click();
  await expect(page.getByText("目前遙測", { exact: true })).toBeVisible();
  await page.route("**/api/operations/details", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  const failedRefresh = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/operations/details") &&
      response.status() === 503,
  );
  await page.clock.fastForward(10_000);
  await failedRefresh;
  await expect(page.getByText("過期遙測", { exact: true })).toBeVisible();
  await expect(page.getByText("目前遙測", { exact: true })).toHaveCount(0);
});

test("warehouse map reflows without horizontal page overflow on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/operations/warehouse/topology");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("img", { name: "拓撲檢視" })).toBeVisible();
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

  await expect(page.getByText("ASN-UI-E2E-01", { exact: true })).toBeVisible();
  await expect(page.getByText("SKU-UI-E2E · 6", { exact: true })).toBeVisible();
  await reviewCreatedWorkflow(page, "inbound-review");
  const inboundTask = page.getByRole("link", {
    name: "追查相關任務 · 開啟新分頁",
    exact: true,
  });
  const inboundPopup = page.waitForEvent("popup");
  await inboundTask.focus();
  await page.keyboard.press("Enter");
  const taskPage = await inboundPopup;
  await expect(taskPage).toHaveURL(
    "/operations/tasks/50000000-0000-4000-8000-000000000099",
  );
  await expect(taskPage.locator("main h1")).toBeVisible();
  await taskPage.close();
  await page
    .locator("summary")
    .getByText("技術追蹤識別碼", { exact: true })
    .click();

  await expect(
    page.getByText("50000000-0000-4000-8000-000000000099"),
  ).toBeVisible();
  await page
    .getByLabel("確認理由")
    .fill("已確認收貨資料、路線與即時設備狀態。");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "確認並執行入庫任務" }).click();

  await expect(page.getByText("入庫執行完成")).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "入庫執行完成" })
      .getByRole("link", { name: "倉庫即時觀測", exact: true }),
  ).toHaveAttribute("href", "/operations/warehouse");
  await expect(
    page.getByRole("link", { name: "追查相關任務", exact: true }),
  ).not.toHaveAttribute("target", "_blank");
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

  await expect(page.getByText("SO-UI-E2E-01", { exact: true })).toBeVisible();
  await reviewCreatedWorkflow(page, "outbound-review");
  const outboundTask = page.getByRole("link", {
    name: "追查相關任務 1 · 開啟新分頁",
    exact: true,
  });
  await expect(outboundTask).toHaveAttribute(
    "href",
    "/operations/tasks/c0000000-0000-4000-8000-000000000099",
  );
  await expect(outboundTask).toHaveAttribute("target", "_blank");
  await expect(
    page.getByRole("combobox", { name: "任務", exact: true }),
  ).toHaveText("已配置任務 1");
  await page
    .locator("summary")
    .getByText("技術追蹤識別碼", { exact: true })
    .click();

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
