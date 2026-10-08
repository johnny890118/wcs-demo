import type { Page } from "@playwright/test";

// HTML text on solid sRGB ancestor backgrounds, including color-mix/alpha.
// SVG painted scenes require token/non-text tests and visual review separately.
// Disabled controls and visually hidden content are WCAG contrast exceptions.
export async function visibleTextContrastFailures(page: Page) {
  return page.evaluate(() => {
    const rgba = (value: string) => {
      if (!/^(rgba?\(|color\(srgb )/.test(value) || value.includes("%"))
        throw new Error(`Unsupported color: ${value}`);
      const numbers = value.match(/[\d.]+/g)?.map(Number);
      if (!numbers || numbers.length < 3)
        throw new Error(`Unsupported color: ${value}`);
      const scale = value.startsWith("color(srgb ") ? 255 : 1;
      return [
        numbers[0] * scale,
        numbers[1] * scale,
        numbers[2] * scale,
        numbers[3] ?? 1,
      ];
    };
    const blend = (top: number[], bottom: number[]) =>
      top.slice(0, 3).map((v, i) => v * top[3] + bottom[i] * (1 - top[3]));
    const luminance = (channels: number[]) => {
      const linear = channels
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const checked = new Set<Element>();
    const failures: { text: string; foreground: string; ratio: number }[] = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim();
      const element = walker.currentNode.parentElement;
      if (
        !text ||
        !element ||
        checked.has(element) ||
        element instanceof SVGElement ||
        element.closest(
          "script,style,[hidden],.sr-only,:disabled,[aria-disabled='true']",
        )
      )
        continue;
      checked.add(element);
      if (!element.getClientRects().length) continue;
      const ancestors: Element[] = [];
      let current: Element | null = element;
      let visible = true;
      while (current) {
        const style = getComputedStyle(current);
        if (
          style.display === "none" ||
          style.visibility !== "visible" ||
          Number(style.opacity) === 0
        )
          visible = false;
        ancestors.push(current);
        current = current.parentElement;
      }
      if (!visible) continue;
      for (const ancestor of ancestors) {
        const style = getComputedStyle(ancestor);
        if (Number(style.opacity) !== 1 || style.backgroundImage !== "none")
          throw new Error(
            `Unsupported opacity/painted background: ${text.slice(0, 100)}`,
          );
      }
      let background = [255, 255, 255];
      for (const ancestor of ancestors.reverse())
        background = blend(
          rgba(getComputedStyle(ancestor).backgroundColor),
          background,
        );
      const style = getComputedStyle(element);
      const foreground = style.color;
      const first = luminance(blend(rgba(foreground), background));
      const second = luminance(background);
      const ratio =
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      // Use the normal-text threshold even for headings (conservative).
      if (ratio < 4.5)
        failures.push({ text: text.slice(0, 100), foreground, ratio });
    }
    return failures;
  });
}
