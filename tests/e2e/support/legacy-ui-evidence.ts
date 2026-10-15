import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";

async function evidence(page: Page, name: string) {
  const directory = process.env.SWP_LEGACY_EVIDENCE_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}.png`) });
}

for (const width of [375, 1440]) {
  test(`legacy dialogs preserve cancel, Escape, focus and local dispatch at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/legacy");
    const map = page.getByRole("button", { name: "地圖細節", exact: true });
    await map.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeAttached();
    await expect(
      dialog.getByRole("heading", { name: "地圖細節" }),
    ).toBeVisible();
    await expect(dialog.getByText("目前樓層：1")).toBeVisible();
    const cancel = dialog.getByRole("button", { name: "取消" });
    await expect(cancel).toBeFocused();
    expect(
      (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
        .violations,
    ).toEqual([]);
    await page.keyboard.press("Tab");
    await expect(cancel).toBeFocused();
    await evidence(page, `map-${width}`);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(map).toBeFocused();
    await page.locator("svg.cursor-pointer").click();
    await expect(
      dialog.getByRole("heading", { name: "車體資訊" }),
    ).toBeVisible();
    await expect(dialog.getByText("車輛編號：")).toBeVisible();
    await expect(dialog.getByText("閒置中")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
        .violations,
    ).toEqual([]);
    await evidence(page, `equipment-${width}`);
    await dialog.getByRole("button", { name: "取消" }).click();
    await expect(dialog).not.toBeAttached();
    const dispatch = page.getByRole("button", {
      name: "任務派車",
      exact: true,
    });
    await dispatch.focus();
    await dispatch.press("Enter");
    await expect(
      dialog.getByRole("heading", { name: "任務派車" }),
    ).toBeVisible();
    await expect(dialog.getByRole("combobox")).toHaveCount(2);
    await expect(dialog.getByRole("textbox")).toHaveCount(2);
    page.once("dialog", async (alert) => {
      expect(alert.message()).toBe("入庫輸入框不得為空");
      await alert.accept();
    });
    await dialog.getByRole("button", { name: "入庫", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "任務派車" }),
    ).toBeVisible();
    await dialog.getByRole("combobox").nth(0).selectOption("工作站1");
    await dialog.getByRole("textbox").nth(0).fill("LEGACY-TEST-LOAD");
    expect(
      (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
        .violations,
    ).toEqual([]);
    await evidence(page, `dispatch-${width}`);
    await dialog.getByRole("button", { name: "入庫", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(dispatch).toBeFocused();
    await expect(
      page.getByText("貨品編號：LEGACY-TEST-LOAD", { exact: true }).first(),
    ).toBeVisible();
    await dispatch.focus();
    await dispatch.press("Enter");
    page.once("dialog", async (alert) => {
      expect(alert.message()).toBe("出庫輸入框不得為空");
      await alert.accept();
    });
    await dialog.getByRole("button", { name: "出庫", exact: true }).click();
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("combobox", { name: "出庫工站" })
      .selectOption("工作站2");
    await dialog
      .getByRole("textbox", { name: "出庫貨號" })
      .fill("LEGACY-TEST-OUT");
    await dialog.getByRole("button", { name: "出庫", exact: true }).click();
    await expect(dialog).not.toBeAttached();
    await expect(
      page.getByText("貨品編號：LEGACY-TEST-OUT", { exact: true }).first(),
    ).toBeVisible();
  });
}

test("legacy navigation and unauthenticated login retain destinations and credentials flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/legacy/fdp");
  const menu = page.getByRole("button", { name: "Open main menu" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(
    page
      .locator('a[href="/legacy/engineering-mode"]')
      .filter({ visible: true }),
  ).toBeVisible();
  await evidence(page, "menu-375");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeAttached();
  await expect(dialog.getByPlaceholder("請輸入帳號")).toBeVisible();
  await expect(dialog.getByPlaceholder("請輸入密碼")).toHaveAttribute(
    "type",
    "password",
  );
  await evidence(page, "login-375");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.goto("/legacy/engineering-mode");
  await expect(page.getByPlaceholder("請輸入帳號")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("請輸入帳號")).toBeVisible();
  await page.getByText("取消", { exact: true }).click();
  await expect(page).toHaveURL(/\/legacy\/fdp$/);
});

test("legacy credential submission retains the server's allowed redirect and authenticated gate", async ({
  page,
}) => {
  await page.goto("/legacy/engineering-mode");
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("請輸入帳號").fill("e2e-operator");
  await dialog.getByPlaceholder("請輸入密碼").fill("e2e-password");
  await dialog.getByRole("button", { name: "登入", exact: true }).click();
  // Existing auth policy deliberately rejects legacy callbacks. Do not widen it.
  await expect(page).toHaveURL(/\/operations$/);
  await page.goto("/legacy/engineering-mode");
  await expect(page.getByRole("dialog")).not.toBeAttached();
  await expect(
    page.getByRole("button", { name: "登出", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("全部設備緊急停止", { exact: true }),
  ).toBeVisible();
  // Read-only inspection only: never execute a legacy engineering command.
  await page.getByRole("button", { name: "登出", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?/);
  await page.goto("/legacy/engineering-mode");
  await expect(page.getByPlaceholder("請輸入帳號")).toBeVisible();
});

test("invalid legacy credentials still fail through the existing login boundary", async ({
  page,
}) => {
  await page.goto("/legacy/fdp");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("請輸入帳號").fill("e2e-operator");
  await dialog.getByPlaceholder("請輸入密碼").fill("not-the-test-password");
  await dialog.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?.*error=CredentialsSignin/);
  await page.goto("/legacy/engineering-mode");
  await expect(page.getByPlaceholder("請輸入帳號")).toBeVisible();
});

test("dormant About remains reachable with its existing content", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.locator("main article")).toHaveCount(3);
  await expect(page.locator("main article svg")).toHaveCount(3);
  await expect(page.locator('main a[href="/contact"]')).toBeVisible();
  await evidence(page, "about-1280");
});

test("migrated disclosure and dialogs keep keyboard focus, dismissal, draft and small-landscape bounds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/legacy");
  const menu = page.getByRole("button", { name: "Open main menu" });
  await menu.focus();
  await menu.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "登入", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.locator('#legacy-mobile-navigation a[href="/legacy"]'),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  const login = page.getByRole("button", { name: "登入", exact: true });
  await login.click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: "取消" })).toBeFocused();
  await dialog
    .getByRole("textbox", { name: "帳號", exact: true })
    .fill("draft-only");
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
    expect(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeAttached();
  await expect(login).toBeFocused();
  await login.click();
  await expect(
    dialog.getByRole("textbox", { name: "帳號", exact: true }),
  ).toHaveValue("draft-only");
  const field = await dialog
    .getByRole("textbox", { name: "帳號", exact: true })
    .boundingBox();
  expect(field).not.toBeNull();
  await page.mouse.move(field!.x + 8, field!.y + 8);
  await page.mouse.down();
  await page.mouse.move(3, 3);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.mouse.click(3, 3, { button: "right" });
  await expect(dialog).toBeVisible();
  await page.mouse.click(3, 3);
  await expect(dialog).not.toBeAttached();
  await expect(login).toBeFocused();
  await page.setViewportSize({ width: 667, height: 375 });
  await page.getByRole("button", { name: "地圖細節", exact: true }).click();
  dialog = page.getByRole("dialog");
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(667);
  expect(bounds!.height).toBeLessThanOrEqual(375);
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).not.toBeAttached();
});
