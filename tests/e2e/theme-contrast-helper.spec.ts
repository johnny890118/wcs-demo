import { expect, test } from "@playwright/test";
import { visibleTextContrastFailures } from "./support/theme-contrast";

test("rendered contrast resolves normalized sRGB and ancestor alpha honestly", async ({
  page,
}) => {
  await page.setContent(
    `<body style="background:black"><p style="color:color(srgb 1 1 1)">Normalized white</p><section style="background:rgba(255,255,255,.5)"><p style="color:white">Alpha background</p></section></body>`,
  );
  const failures = await visibleTextContrastFailures(page);
  expect(failures).toHaveLength(1);
  expect(failures[0].text).toBe("Alpha background");
  expect(failures[0].ratio).toBeCloseTo(3.98, 1);
  await page.setContent(`<p style="opacity:.5">Unsupported opacity</p>`);
  await expect(visibleTextContrastFailures(page)).rejects.toThrow(
    "Unsupported opacity",
  );
  await page.setContent(
    `<p style="background:linear-gradient(white,black)">Unsupported gradient</p>`,
  );
  await expect(visibleTextContrastFailures(page)).rejects.toThrow(
    "Unsupported opacity/painted background",
  );
});
