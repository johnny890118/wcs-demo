import {
  ArrowRightStartOnRectangleIcon,
  MapIcon,
  BellAlertIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import type { ReactNode } from "react";
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
}: {
  children: ReactNode;
  current?: Surface;
  titleKey?: MessageKey;
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const access = isOperationalAccess(session?.access) ? session.access : null;
  const runtime = isOperationalRuntime(session?.runtime)
    ? session.runtime
    : null;
  const canViewAudit = access ? hasUserPermission(access, "audit.view") : false;
  const title = t(titleKey ?? titleKeys[current]) + " | " + t("brand");
  const group = workSurfaces.includes(current) ? "work" : current;
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
  const navLinks = (mobile: boolean) =>
    primary.map(({ key, href, label, Icon }) => (
      <Link
        key={key}
        href={href}
        aria-current={group === key ? "page" : undefined}
        className={
          "ui-pressable flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold " +
          (mobile ? "shrink-0 whitespace-nowrap " : "") +
          (group === key ? "ui-current-selection" : "text-[var(--text-muted)]")
        }
      >
        {!mobile ? (
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : null}
        {t(label)}
      </Link>
    ));
  return (
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
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 self-start overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] p-4 md:flex md:flex-col">
          <Link
            href="/operations"
            className="ui-pressable mb-8 flex items-center gap-3 rounded-lg p-1"
          >
            <ProductMark />
            <span className="font-bold tracking-tight">{t("brand")}</span>
          </Link>
          <nav aria-label={t("desktopNavigation")} className="space-y-1">
            {navLinks(false)}
          </nav>
          <div className="mt-auto border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="ui-pressable flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-muted)]"
            >
              <ArrowRightStartOnRectangleIcon
                className="h-5 w-5"
                aria-hidden="true"
              />
              {t("signOut")}
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <Link
                href="/operations"
                className="ui-pressable flex min-h-11 items-center gap-2 md:hidden"
              >
                <ProductMark />
                <span className="text-sm font-bold">SWP</span>
              </Link>
              <div
                aria-label={t("operationalContext")}
                className="order-3 flex w-full min-w-0 flex-wrap items-center gap-2 pb-3 text-xs md:order-none md:w-auto md:pb-0"
              >
                {access ? (
                  <WarehouseContextControl access={access} />
                ) : (
                  <span>{t("warehouseContextUnavailable")}</span>
                )}
                {environmentLabel ? (
                  <span className="rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)]">
                    {environmentLabel}
                  </span>
                ) : null}
                {profileLabel ? (
                  <span className="rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)]">
                    {profileLabel}
                  </span>
                ) : null}
                {sourceLabel ? (
                  <span className="rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)]">
                    {sourceLabel}
                  </span>
                ) : null}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {access ? (
                  <span className="hidden max-w-40 truncate text-xs font-medium text-[var(--text-muted)] xl:inline">
                    {access.principal.displayName}
                  </span>
                ) : null}
                <LocaleControl />
                <ThemeControl />
              </div>
            </div>
            <nav
              aria-label={t("mobileNavigation")}
              className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden"
            >
              {navLinks(true)}
            </nav>
          </header>
          <main id="main-content" className="px-4 py-8 sm:px-6 lg:px-8">
            {workSurfaces.includes(current) ? (
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
  );
}
