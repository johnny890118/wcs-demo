import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync("styles/globals.css", "utf8");
function tokens(selector: string): Record<string, string> {
  const block = css.slice(css.indexOf(`${selector} {`)).split("}")[0];
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*(#[a-f0-9]{6})/gi)].map((match) => [
      match[1],
      match[2].toLowerCase(),
    ]),
  );
}
function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
describe("neutral-first SWP theme contract", () => {
  it("uses contrast-safe foreground tokens in actual product components", () => {
    function inspect(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) inspect(path);
        else if (/\.tsx$/.test(path)) {
          expect(readFileSync(path, "utf8"), path).not.toContain(
            "text-[var(--accent)]",
          );
          expect(readFileSync(path, "utf8"), path).not.toMatch(
            /var\(--accent-(strong|soft)\)/,
          );
        }
      }
    }
    inspect("pages");
    inspect("components");
    const map = readFileSync(
      "components/platform/WarehouseTopologyMap.tsx",
      "utf8",
    );
    expect(map).toContain('stroke="var(--accent)"');
    expect(map).not.toContain('fill="var(--accent)"');
  });
  it.each([":root", ".dark"])(
    "shares brand accent and preserves readable/status meaning in %s",
    (selector) => {
      const palette = tokens(selector);
      expect(palette.accent).toBe("#e6f000");
      expect(palette.success).not.toBe(palette.accent);
      for (const background of [
        "canvas",
        "surface",
        "surface-raised",
        "surface-muted",
      ])
        for (const foreground of [
          "text",
          "text-muted",
          "link",
          "info",
          "offline",
          "success",
          "danger",
          "warning",
        ])
          expect(
            contrast(palette[foreground], palette[background]),
            `${selector} ${foreground}/${background}`,
          ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(palette["on-accent"], palette.accent),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(palette["selection-text"], palette["selection-background"]),
      ).toBeGreaterThanOrEqual(4.5);
      expect(palette["selection-background"]).toBe(palette.accent);
      expect(palette.warning).not.toBe(palette.accent);
      expect(
        contrast(palette["selection-edge"], palette["selection-background"]),
      ).toBeGreaterThanOrEqual(3);
      for (const background of [
        "canvas",
        "surface",
        "surface-raised",
        "surface-muted",
      ])
        for (const foreground of ["focus", "border-strong", "selection-edge"])
          expect(
            contrast(palette[foreground], palette[background]),
            `${selector} ${foreground}/${background}`,
          ).toBeGreaterThanOrEqual(3);
    },
  );
});
