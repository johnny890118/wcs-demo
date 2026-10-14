import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { visibleTextContrastFailures } from "./theme-contrast";

// Imported by operator-console.spec.ts so mutable scenarios share its serial
// worker, never a competing worker mutating the same isolated fixture server.

const task = "50000000-0000-4000-8000-000000000001";
const epoch = Date.parse("2026-09-18T08:00:00.000Z");
const cases = [
  { name: "context-live", route: `/operations/context/${task}/live` },
  { name: "context-load", route: `/operations/context/${task}/load` },
  { name: "history", route: "/operations/audit" },
  { name: "exceptions", route: "/operations/alarms", fault: true },
  { name: "live-current", route: "/operations/warehouse" },
  { name: "live-stale", route: "/operations/warehouse", stale: true },
  { name: "live-error", route: "/operations/warehouse", failed: true },
  { name: "home", route: "/operations" },
] as const;

async function preference(page: Page, label: string) {
  await page
    .getByRole("button", {
      name: /^(偏好設定與帳號|Preferences and account|導覽與偏好設定|Navigation and preferences)$/,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: label, exact: true }).click();
  await dialog
    .getByRole("button", {
      name: /^(關閉導覽|Close navigation|關閉偏好設定|Close preferences)$/,
    })
    .click();
}

test("bounded visual review retains exact evidence and captures comparable native views", async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto("/operations");
  await page.getByLabel("使用者名稱").fill("e2e-operator");
  await page.getByLabel("密碼").fill("e2e-password");
  await page.getByRole("button", { name: "登入", exact: true }).click();
  await expect(page).toHaveURL(/\/operations$/);
  await page.clock.setFixedTime(new Date(epoch));
  const fixture = async (name: string) => {
    const response = await page.request.post(
      `http://127.0.0.1:3101/test/scenarios/${name}`,
      { headers: { Authorization: "Bearer e2e-service-token" } },
    );
    expect(response.ok()).toBe(true);
  };
  try {
    for (const width of [375, 820, 1440]) {
      await page.setViewportSize({
        width,
        height: width === 820 ? 1180 : width === 1440 ? 900 : 812,
      });
      for (const [locale, theme] of [
        ["zh-TW", "light"],
        ["en", "dark"],
      ] as const) {
        await preference(page, locale === "en" ? "EN" : "繁中");
        await preference(page, locale === "en" ? "Dark" : "淺色");
        for (const scenario of cases) {
          await fixture(
            "fault" in scenario ? "visual-faulted" : "visual-baseline",
          );
          await page.clock.setFixedTime(
            new Date(epoch + ("stale" in scenario ? 31_000 : 0)),
          );
          await page.goto(scenario.route);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          if ("stale" in scenario)
            await expect(
              page
                .locator(".swp-observation-context")
                .getByText(
                  locale === "en"
                    ? /Last-known observation only/
                    : /僅最後已知/,
                ),
            ).toBeVisible();
          if ("failed" in scenario) {
            await page.route("**/api/operations/live-view**", (route) =>
              route.fulfill({ status: 503, body: "{}" }),
            );
            await page
              .getByRole("button", {
                name: locale === "en" ? "Refresh observations" : "重新整理觀測",
              })
              .click();
            await expect(
              page
                .locator(".swp-observation-context")
                .getByText(
                  locale === "en"
                    ? /Last-known observation only/
                    : /僅最後已知/,
                ),
            ).toBeVisible();
          }
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
            [],
          );
          expect(await visibleTextContrastFailures(page)).toEqual([]);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          const metrics = await page.evaluate(() => ({
            viewport: [innerWidth, innerHeight],
            equipmentTop:
              document
                .querySelector("#live-context-heading")
                ?.getBoundingClientRect().top ?? null,
            records: [...document.querySelectorAll("article")].map((item) => ({
              title: item.querySelector("h2")?.textContent,
              top: item.getBoundingClientRect().top,
              height: item.getBoundingClientRect().height,
            })),
            destinations: [...document.querySelectorAll("#main-content a")].map(
              (item) => ({
                href: item.getAttribute("href"),
                name: item.getAttribute("aria-label") ?? item.textContent,
              }),
            ),
          }));
          if (scenario.name.startsWith("context-")) {
            const navigation = page.locator(".swp-context-navigation");
            await expect(navigation.locator("a")).toHaveCount(7);
            await expect(
              navigation.locator("a[aria-current='page']"),
            ).toHaveCount(1);
            expect(
              await navigation.locator("a").evaluateAll((items) =>
                items.every((item) => {
                  const bounds = item.getBoundingClientRect();
                  return bounds.height >= 44 && bounds.width >= 44;
                }),
              ),
            ).toBe(true);
            const destinations = await navigation
              .locator("a")
              .evaluateAll((items) =>
                items.map((item) => item.getAttribute("href")),
              );
            expect(destinations).toEqual(
              [
                "load",
                "inventory",
                "source",
                "destination",
                "live",
                "exception",
                "history",
              ].map((surface) => `/operations/context/${task}/${surface}`),
            );
            if (scenario.name === "context-live" && width === 375) {
              expect(metrics.equipmentTop).not.toBeNull();
              expect(metrics.equipmentTop!).toBeLessThan(660);
            }
          }
          if (scenario.name === "history") {
            expect(metrics.records).toHaveLength(5);
            if (width === 375)
              for (const record of metrics.records.slice(0, 4))
                expect(record.height).toBeLessThan(175);
            const disclosure = page.locator("article summary").first();
            expect(
              await disclosure.evaluate(
                (item) => item.getBoundingClientRect().height,
              ),
            ).toBeGreaterThanOrEqual(44);
          }
          if (scenario.name === "exceptions") {
            const investigation = page
              .getByRole("region", {
                name: locale === "en" ? "Attention required" : "需要注意",
              })
              .getByRole("link");
            const names = await investigation.evaluateAll((items) =>
              items.map((item) => item.getAttribute("aria-label")),
            );
            expect(names).toHaveLength(3);
            expect(new Set(names).size).toBe(3);
            expect(
              names.every(
                (name) =>
                  name &&
                  !name.startsWith("Review operational evidence") &&
                  !name.startsWith("檢視營運證據"),
              ),
            ).toBe(true);
          }
          const stem = `${scenario.name}-${width}-${locale}-${theme}`;
          const metricsPath = test.info().outputPath(`${stem}.json`);
          writeFileSync(
            metricsPath,
            JSON.stringify(
              {
                route: scenario.route,
                state: scenario.name,
                fixture: "fixed-2026-09-18",
                ...metrics,
              },
              null,
              2,
            ),
          );
          await test.info().attach(`${stem}.json`, {
            path: metricsPath,
            contentType: "application/json",
          });
          await page.screenshot({
            path: test.info().outputPath(`${stem}.png`),
            fullPage: false,
          });
          await page.unroute("**/api/operations/live-view**");
        }
      }
    }
  } finally {
    await fixture("baseline");
  }
});
