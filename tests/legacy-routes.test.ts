import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isLegacyRouteCurrent,
  legacyNavigationRoutes,
} from "../src/application/navigation/legacy-routes";

function pagePath(href: string): string {
  const pageName = href === "/" ? "index" : href.slice(1);
  return fileURLToPath(new URL(`../pages/${pageName}.js`, import.meta.url));
}

describe("legacy route characterization", () => {
  it("keeps each primary navigation destination backed by a page", () => {
    expect(legacyNavigationRoutes).toHaveLength(3);
    for (const route of legacyNavigationRoutes) {
      expect(existsSync(pagePath(route.href)), route.href).toBe(true);
    }
  });

  it.each(legacyNavigationRoutes)(
    "marks only $href as current for its exact pathname",
    ({ href }) => {
      const currentRoutes = legacyNavigationRoutes.filter((route) =>
        isLegacyRouteCurrent(route.href, href),
      );

      expect(currentRoutes.map((route) => route.href)).toEqual([href]);
    },
  );

  it("does not mark a route current for an unknown pathname", () => {
    expect(
      legacyNavigationRoutes.some((route) =>
        isLegacyRouteCurrent(route.href, "/missing"),
      ),
    ).toBe(false);
  });
});
