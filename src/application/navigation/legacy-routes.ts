export const legacyNavigationRoutes = [
  { name: "派車系統", href: "/legacy" },
  { name: "戰情看板", href: "/legacy/fdp" },
  { name: "工程模式", href: "/legacy/engineering-mode" },
] as const;

export type LegacyRoute = (typeof legacyNavigationRoutes)[number]["href"];

export function isLegacyRouteCurrent(
  route: LegacyRoute,
  pathname: string,
): boolean {
  return route === pathname;
}
