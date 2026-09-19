import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Theme = Record<string, string>;

const stylesheet = readFileSync(resolve("styles/globals.css"), "utf8");

function themeVariables(selector: string): Theme {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = stylesheet.match(
    new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`),
  )?.[1];
  if (!block) throw new Error(`Missing ${selector} theme block.`);

  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(
      ([, name, value]) => [name, value.toLowerCase()],
    ),
  );
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) throw new Error(`Invalid ${hex}.`);

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const normalTextPairs = [
  ["text", "canvas"],
  ["text", "surface"],
  ["text-muted", "canvas"],
  ["text-muted", "surface"],
  ["text-muted", "surface-muted"],
  ["accent", "canvas"],
  ["accent", "surface"],
  ["accent-strong", "accent-soft"],
  ["on-accent", "accent"],
  ["on-danger", "danger"],
  ["warning", "surface"],
  ["danger", "surface"],
  ["success", "surface"],
] as const;

describe.each([
  ["light", themeVariables(":root")],
  ["dark", themeVariables(".dark")],
])("%s design-token contrast", (_name, theme) => {
  it.each(normalTextPairs)(
    "%s on %s meets WCAG AA for normal text",
    (foreground, background) => {
      expect(
        contrastRatio(theme[foreground], theme[background]),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});
