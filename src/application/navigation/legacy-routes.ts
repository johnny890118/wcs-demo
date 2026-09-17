export const legacyNavigationRoutes = [
  { name: "派車系統", href: "/" },
  { name: "戰情看板", href: "/fdp" },
  { name: "工程模式", href: "/engineeringMode" },
] as const;

export type LegacyRoute = (typeof legacyNavigationRoutes)[number]["href"];

export function isLegacyRouteCurrent(
  route: LegacyRoute,
  pathname: string,
): boolean {
  return route === pathname;
}
