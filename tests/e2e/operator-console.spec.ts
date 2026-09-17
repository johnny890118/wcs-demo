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

test("public entry supports keyboard skip navigation and automated accessibility", async ({
  page,
}) => {
  await page.goto("/platform");

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
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
