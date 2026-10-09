import {
  ArrowRightStartOnRectangleIcon,
  MapIcon,
  BellAlertIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  hasUserPermission,
  isOperationalAccess,
  isOperationalRuntime,
} from "../../src/application/access/operational-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import type { MessageKey } from "../../src/ui/i18n/catalogs";
import { LocaleControl } from "./LocaleControl";
import { ThemeControl } from "./ThemeControl";
import { WarehouseContextControl } from "./WarehouseContextControl";
import { OperationTargetLabels } from "./OperationTargetContext";
import { NavigationProgress } from "./NavigationProgress";
import { ProductMark } from "./ProductMark";
import { WorkNavigation } from "./WorkNavigation";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "../ui/popover";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
type Surface =
  | "overview"
  | "work"
  | "tasks"
  | "inventory"
  | "warehouse"
  | "inbound"
  | "outbound"
  | "alarms"
  | "audit"
  | "help"
  | "projections";
const workSurfaces = ["work", "tasks", "inbound", "outbound"];
const navigationPreferenceKey = "swp-navigation-collapsed";
function subscribeNavigation(listener: () => void) {
  const update = () => {
    document.documentElement.dataset.swpNavigation = navigationSnapshot()
      ? "collapsed"
      : "expanded";
    listener();
  };
  window.addEventListener("storage", update);
  window.addEventListener("swp-navigation-preference", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("swp-navigation-preference", update);
  };
}
function navigationSnapshot() {
  try {
    return localStorage.getItem(navigationPreferenceKey) === "true";
  } catch {
    return false;
  }
}
const primary = [
  {
    key: "overview",
    href: "/operations",
    label: "operatorHome",
    Icon: Squares2X2Icon,
  },
  {
    key: "work",
    href: "/operations/work",
    label: "operatorWork",
    Icon: QueueListIcon,
  },
  {
    key: "warehouse",
    href: "/operations/warehouse",
    label: "operatorLive",
    Icon: MapIcon,
  },
  {
    key: "alarms",
    href: "/operations/alarms",
    label: "operatorExceptions",
    Icon: BellAlertIcon,
  },
  {
    key: "inventory",
    href: "/operations/inventory",
    label: "inventory",
    Icon: ClipboardDocumentListIcon,
  },
  {
    key: "help",
    href: "/operations/help",
    label: "operatorHelp",
    Icon: QuestionMarkCircleIcon,
  },
] as const;
const titleKeys: Record<Surface, MessageKey> = {
  overview: "operationsHome",
  work: "operatorWork",
  tasks: "taskQueueTitle",
  inventory: "inventory",
  warehouse: "liveView",
  inbound: "inbound",
  outbound: "outbound",
  alarms: "operatorExceptions",
  audit: "auditHistory",
  help: "helpTitle",
  projections: "projectionsTitle",
};
const helpTopics: Record<Surface, string> = {
  overview: "daily-work",
  work: "daily-work",
  tasks: "daily-work",
  inventory: "inventory",
  warehouse: "live-view",
  inbound: "inbound-outbound",
  outbound: "inbound-outbound",
  alarms: "exceptions",
  audit: "audit",
  help: "getting-started",
  projections: "troubleshooting",
};
export function OperationsShell({
  children,
  current = "overview",
  titleKey,
  workNavigationAfterHeader = false,
  noCurrentSelection = false,
}: {
  children: ReactNode;
  current?: Surface;
  titleKey?: MessageKey;
  workNavigationAfterHeader?: boolean;
  noCurrentSelection?: boolean;
}) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [warehouseMenu, setWarehouseMenu] = useState<
    "sidebar" | "topbar" | null
  >(null);
  useEffect(() => {
    if (!window.matchMedia) return;
    const layout = window.matchMedia(
      "(min-width: 1024px) and (min-height: 600px) and (orientation: landscape)",
    );
    const change = () => {
      const restoreFocus =
        menuOpen ||
        preferencesOpen ||
        warehouseMenu !== null ||
        Boolean(
          document.activeElement?.closest(
            layout.matches
              ? ".mobile-navigation-header"
              : ".operations-sidebar",
          ),
        );
      if (!restoreFocus) return;
      setMenuOpen(false);
      setPreferencesOpen(false);
      setWarehouseMenu(null);
      if (restoreFocus)
        requestAnimationFrame(() => {
          const destination = layout.matches
            ? document.querySelector<HTMLElement>(
                ".operations-sidebar nav a[aria-current='page'], .operations-sidebar nav a",
              )
            : document.querySelector<HTMLElement>(
                ".mobile-navigation-header button[aria-expanded]",
              );
          destination?.focus();
        });
    };
    layout.addEventListener("change", change);
    return () => layout.removeEventListener("change", change);
  }, [menuOpen, preferencesOpen, warehouseMenu]);
  const [temporaryCollapsed, setTemporaryCollapsed] = useState<boolean | null>(
    null,
  );
  const persistedCollapsed = useSyncExternalStore(
    subscribeNavigation,
    navigationSnapshot,
    () => false,
  );
  const collapsed = temporaryCollapsed ?? persistedCollapsed;
  function toggleNavigation() {
    document.documentElement.dataset.swpNavigation = !collapsed
      ? "collapsed"
      : "expanded";
    try {
      localStorage.setItem(navigationPreferenceKey, String(!collapsed));
      window.dispatchEvent(new Event("swp-navigation-preference"));
    } catch {
      setTemporaryCollapsed(!collapsed);
    }
  }
  const { data: session } = useSession();
  const access = isOperationalAccess(session?.access) ? session.access : null;
  const runtime = isOperationalRuntime(session?.runtime)
    ? session.runtime
    : null;
  const canViewAudit = access ? hasUserPermission(access, "audit.view") : false;
  const title = t(titleKey ?? titleKeys[current]) + " | " + t("brand");
  const group = noCurrentSelection
    ? null
    : workSurfaces.includes(current)
      ? "work"
      : current;
  const environmentLabel = runtime
    ? t(
        (
          {
            development: "environmentDevelopment",
            test: "environmentTest",
            staging: "environmentStaging",
            production: "environmentProduction",
          } as const
        )[runtime.environment],
      )
    : null;
  const profileLabel = runtime
    ? t(
        (
          {
            public_demo: "deploymentProfilePublicDemo",
            private_demo: "deploymentProfilePrivateDemo",
            pilot: "deploymentProfilePilot",
            production: "deploymentProfileProduction",
          } as const
        )[runtime.deploymentProfile],
      )
    : null;
  const sourceLabel = runtime
    ? t(
        (
          {
            simulation: "equipmentSourceSimulation",
            hardware: "equipmentSourceHardware",
            hybrid: "equipmentSourceHybrid",
          } as const
        )[runtime.equipmentSource],
      )
    : null;
  const currentWarehouse = access?.principal.warehouseScopes.find(
    (scope) => scope.warehouseId === access.currentWarehouseId,
  );
  const warehouseSwitch = (compact: boolean) =>
    access && access.principal.warehouseScopes.length > 1 ? (
      <Popover
        open={warehouseMenu === (compact ? "topbar" : "sidebar")}
        onOpenChange={(open) =>
          setWarehouseMenu(open ? (compact ? "topbar" : "sidebar") : null)
        }
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("warehouseContext")}
            className="warehouse-navigation-trigger ui-pressable flex min-h-11 min-w-11 items-center gap-2 rounded-lg px-3 text-sm"
          >
            <MapIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span
              className={
                compact ? "warehouse-topbar-label" : "operations-nav-label"
              }
            >
              {currentWarehouse?.name ?? t("warehouseContextUnavailable")}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={compact ? "bottom" : "right"}
          aria-label={t("warehouseContext")}
        >
          <h2 className="mb-3 font-semibold">{t("warehouseContext")}</h2>
          <WarehouseContextControl access={access} />
        </PopoverContent>
      </Popover>
    ) : null;
  const navLinks = (mobile: boolean) =>
    primary.map(({ key, href, label, Icon }) => (
      <Tooltip key={key} label={t(label)} disabled={mobile}>
        <Link
          key={key}
          href={href}
          aria-current={group === key ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
          className={
            "ui-pressable flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold " +
            (mobile ? "shrink-0 whitespace-nowrap " : "") +
            (group === key
              ? "ui-current-selection"
              : "text-[var(--text-muted)]")
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className={mobile ? undefined : "operations-nav-label"}>
            {t(label)}
          </span>
        </Link>
      </Tooltip>
    ));
  const preferences = (
    <div className="swp-preferences">
      <section>
        <details className="swp-diagnostics">
          <summary>{t("homeTechnicalDetails")}</summary>
          <div>
            <p>
              {currentWarehouse
                ? `${currentWarehouse.name} · ${currentWarehouse.code}`
                : t("warehouseContextUnavailable")}
            </p>
            <p>{environmentLabel ?? t("warehouseContextUnavailable")}</p>
            <p>{profileLabel ?? t("warehouseContextUnavailable")}</p>
            <p>{sourceLabel ?? t("warehouseContextUnavailable")}</p>
          </div>
        </details>
      </section>
      <section>
        <h3>{t("locale")}</h3>
        <LocaleControl />
      </section>
      <section>
        <h3>{t("theme")}</h3>
        <ThemeControl showLabels />
      </section>
      <section>
        {access ? (
          <p className="swp-account-name">{access.principal.displayName}</p>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <ArrowRightStartOnRectangleIcon
            className="h-5 w-5"
            aria-hidden="true"
          />
          {t("signOut")}
        </Button>
      </section>
    </div>
  );
  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={600}>
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
        <Head>
          <title>{title}</title>
          <meta name="description" content={t("operationsMetaDescription")} />
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:title" content={title} key="product-og-title" />
          <meta
            property="og:description"
            content={t("operationsMetaDescription")}
          />
        </Head>
        <NavigationProgress />
        <a
          href="#main-content"
          className="absolute left-3 top-3 z-50 -translate-y-20 rounded-md bg-[var(--text)] px-3 py-2 text-sm font-semibold text-[var(--surface)] focus:translate-y-0"
        >
          {t("skipToContent")}
        </a>
        <div
          className="operations-frame flex min-h-screen"
          data-collapsed={collapsed}
        >
          <aside className="operations-sidebar sticky top-0 h-dvh shrink-0 self-start overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-3">
            <Link
              href="/operations"
              className="ui-pressable mb-8 flex items-center gap-3 rounded-lg p-1"
            >
              <ProductMark />
              <span className="operations-nav-label text-sm font-semibold tracking-tight">
                {t("brand")}
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleNavigation}
              aria-label={t(
                collapsed ? "expandNavigation" : "collapseNavigation",
              )}
              aria-expanded={!collapsed}
              className="ui-pressable order-last mt-2 flex min-h-11 items-center justify-center rounded-lg text-[var(--text-muted)]"
            >
              {collapsed ? (
                <ChevronDoubleRightIcon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <nav aria-label={t("desktopNavigation")} className="space-y-1">
              {navLinks(false)}
            </nav>
            <div className="mt-4 min-w-0">{warehouseSwitch(false)}</div>
            <div className="mt-auto border-t border-[var(--border)] pt-4">
              <Popover open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <Tooltip label={t("preferencesMenu")}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("preferencesMenu")}
                      aria-expanded={preferencesOpen}
                      className="desktop-preferences ui-pressable min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-muted)]"
                    >
                      <Cog6ToothIcon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="operations-nav-label">
                        {t("preferencesMenu")}
                      </span>
                    </button>
                  </PopoverTrigger>
                </Tooltip>
                <PopoverContent
                  side="right"
                  align="end"
                  aria-label={t("preferencesMenu")}
                >
                  <div className="swp-popover-heading">
                    <h2>{t("preferencesMenu")}</h2>
                    <PopoverClose asChild>
                      <Button
                        variant="ghost"
                        aria-label={t("closePreferences")}
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </PopoverClose>
                  </div>
                  {preferences}
                </PopoverContent>
              </Popover>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="mobile-navigation-header border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="operations-topbar flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
                <Link
                  href="/operations"
                  className="ui-pressable flex min-h-11 items-center gap-2"
                >
                  <ProductMark />
                  <span className="text-sm font-bold">SWP</span>
                </Link>
                {warehouseSwitch(true)}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label={t("navigationMenu")}
                  aria-expanded={menuOpen}
                  className="ui-pressable order-2 ml-auto flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3"
                >
                  <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden text-sm font-medium lg:inline">
                    {t("navigationMenu")}
                  </span>
                </button>
              </div>
            </header>
            <Dialog
              open={menuOpen}
              onClose={setMenuOpen}
              className="fixed inset-0 z-50"
            >
              <div
                className="fixed inset-0 bg-[var(--canvas)] opacity-60"
                aria-hidden="true"
              />
              <div className="fixed inset-0 flex justify-end">
                <DialogPanel className="w-full max-w-sm overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <DialogTitle className="font-semibold">
                      {t("navigationMenu")}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      aria-label={t("closeNavigation")}
                      className="ui-pressable flex min-h-11 min-w-11 items-center justify-center rounded-lg"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <nav
                    aria-label={t("mobileNavigation")}
                    className="compact-menu-navigation space-y-1"
                  >
                    {navLinks(true)}
                  </nav>
                  {preferences}
                </DialogPanel>
              </div>
            </Dialog>
            <main
              id="main-content"
              className="operations-content px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
            >
              {!currentWarehouse ? (
                <p role="alert" className="mb-4 text-[var(--danger)]">
                  {t("warehouseContextUnavailable")}
                </p>
              ) : null}
              {workSurfaces.includes(current) && !workNavigationAfterHeader ? (
                <WorkNavigation
                  current={current as "work" | "tasks" | "inbound" | "outbound"}
                />
              ) : null}
              <OperationTargetLabels.Provider
                value={{
                  warehouse: currentWarehouse
                    ? `${currentWarehouse.name} · ${currentWarehouse.code}`
                    : null,
                  source: sourceLabel,
                }}
              >
                {children}
              </OperationTargetLabels.Provider>
              <div className="mt-8 border-t border-[var(--border)] pt-4">
                {current !== "help" ? (
                  <Link
                    href={"/operations/help?topic=" + helpTopics[current]}
                    className="ui-pressable ui-link mb-3 inline-flex min-h-11 items-center text-sm font-semibold"
                  >
                    {t("helpContextual")}
                  </Link>
                ) : null}
                <details
                  open={current === "projections" || current === "audit"}
                  className="text-sm text-[var(--text-muted)]"
                >
                  <summary className="min-h-11 cursor-pointer py-3 font-semibold">
                    {t("secondaryTools")}
                  </summary>
                  <nav
                    aria-label={t("secondaryTools")}
                    className="flex flex-wrap gap-2"
                  >
                    <Link
                      href="/operations/projections"
                      aria-current={
                        current === "projections" ? "page" : undefined
                      }
                      className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2"
                    >
                      {t("projections")}
                    </Link>
                    <Link
                      href="/operations/warehouse/topology"
                      className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2"
                    >
                      {t("warehouseMapTitle")}
                    </Link>
                    {canViewAudit ? (
                      <Link
                        href="/operations/audit"
                        aria-current={current === "audit" ? "page" : undefined}
                        className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2"
                      >
                        {t("auditHistory")}
                      </Link>
                    ) : null}
                  </nav>
                </details>
              </div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
