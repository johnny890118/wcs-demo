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
import { useState, useSyncExternalStore, type ReactNode } from "react";
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
  const showDeploymentProfile =
    workSurfaces.includes(current) || current === "alarms";
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
          <aside className="operations-sidebar sticky top-0 hidden h-dvh shrink-0 self-start overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-3 md:flex md:flex-col">
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
              className="ui-pressable order-last mt-2 hidden min-h-11 items-center justify-center rounded-lg text-[var(--text-muted)] lg:flex"
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
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label={t("navigationMenu")}
                title={t("navigationMenu")}
                aria-expanded={menuOpen}
                className="tablet-navigation ui-pressable min-h-11 w-full items-center justify-center rounded-lg text-[var(--text-muted)]"
              >
                <Bars3Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="mobile-navigation-header border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="operations-topbar flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
                <Link
                  href="/operations"
                  className="ui-pressable flex min-h-11 items-center gap-2 md:hidden"
                >
                  <ProductMark />
                  <span className="text-sm font-bold">SWP</span>
                </Link>
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
                      <span className="compact-menu-title">
                        {t("navigationMenu")}
                      </span>
                      <span className="desktop-menu-title">
                        {t("preferencesMenu")}
                      </span>
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
              <section
                aria-label={t("operationalContext")}
                className="operations-page-context mb-4 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
              >
                <div className="min-w-0">
                  {access ? (
                    <WarehouseContextControl access={access} />
                  ) : (
                    <span>{t("warehouseContextUnavailable")}</span>
                  )}
                </div>
                <details className="swp-runtime-context min-w-0 text-[var(--text-muted)]">
                  <summary>
                    <span>
                      {sourceLabel ?? t("warehouseContextUnavailable")}
                    </span>
                    {environmentLabel ? <span>{environmentLabel}</span> : null}
                    {showDeploymentProfile && profileLabel ? (
                      <span>{profileLabel}</span>
                    ) : null}
                  </summary>
                  <div>
                    <p className="flex flex-wrap gap-x-3 text-xs">
                      {!showDeploymentProfile && profileLabel ? (
                        <span>{profileLabel}</span>
                      ) : null}
                    </p>
                  </div>
                </details>
              </section>
              {workSurfaces.includes(current) && !workNavigationAfterHeader ? (
                <WorkNavigation
                  current={current as "work" | "tasks" | "inbound" | "outbound"}
                />
              ) : null}
              {children}
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
