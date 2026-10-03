import {
  ArrowLeftIcon,
  ArrowRightStartOnRectangleIcon,
  MapIcon,
  InboxArrowDownIcon,
  TruckIcon,
  BellAlertIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
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

export function OperationsShell({
  children,
  current = "overview",
  titleKey,
}: {
  children: ReactNode;
  titleKey?: MessageKey;
  current?:
    | "overview"
    | "tasks"
    | "inventory"
    | "warehouse"
    | "inbound"
    | "outbound"
    | "alarms"
    | "audit"
    | "help"
    | "projections";
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const access = isOperationalAccess(session?.access) ? session.access : null;
  const runtime = isOperationalRuntime(session?.runtime)
    ? session.runtime
    : null;
  const canViewAudit = access ? hasUserPermission(access, "audit.view") : false;
  const environmentLabel = runtime
    ? t(
        {
          development: "environmentDevelopment",
          test: "environmentTest",
          staging: "environmentStaging",
          production: "environmentProduction",
        }[runtime.environment] as Parameters<typeof t>[0],
      )
    : null;
  const deploymentProfileLabel = runtime
    ? t(
        {
          public_demo: "deploymentProfilePublicDemo",
          private_demo: "deploymentProfilePrivateDemo",
          pilot: "deploymentProfilePilot",
          production: "deploymentProfileProduction",
        }[runtime.deploymentProfile] as Parameters<typeof t>[0],
      )
    : null;
  const equipmentSourceLabel = runtime
    ? t(
        {
          simulation: "equipmentSourceSimulation",
          hardware: "equipmentSourceHardware",
          hybrid: "equipmentSourceHybrid",
        }[runtime.equipmentSource] as Parameters<typeof t>[0],
      )
    : null;
  const title = `${t(
    titleKey ??
      ({
        overview: "operationsHome",
        tasks: "taskQueueTitle",
        inventory: "inventory",
        warehouse: "liveView",
        inbound: "inbound",
        outbound: "outbound",
        alarms: "alarmWorkflowTitle",
        audit: "auditHistory",
        help: "helpTitle",
        projections: "projectionsTitle",
      }[current] as MessageKey),
  )} | ${t("brand")}`;

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
            href="/"
            className="ui-pressable mb-8 flex items-center gap-3 rounded-lg p-1"
          >
            <ProductMark />
            <span className="font-bold tracking-tight">{t("brand")}</span>
          </Link>
          <nav aria-label={t("desktopNavigation")} className="space-y-1">
            <Link
              href="/operations"
              aria-current={current === "overview" ? "page" : undefined}
              className={`ui-pressable flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "overview"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
              {t("overview")}
            </Link>
            <Link
              href="/operations/tasks"
              aria-current={current === "tasks" ? "page" : undefined}
              className={`ui-pressable flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "tasks"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <QueueListIcon className="h-5 w-5" aria-hidden="true" />
              {t("taskQueueTitle")}
            </Link>
            <Link
              href="/operations/inventory"
              aria-current={current === "inventory" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "inventory"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <ClipboardDocumentListIcon
                className="h-5 w-5"
                aria-hidden="true"
              />
              {t("inventory")}
            </Link>
            <Link
              href="/operations/warehouse"
              aria-current={current === "warehouse" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "warehouse"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <MapIcon className="h-5 w-5" aria-hidden="true" />
              {t("liveView")}
            </Link>
            <Link
              href="/operations/inbound"
              aria-current={current === "inbound" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "inbound"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <InboxArrowDownIcon className="h-5 w-5" aria-hidden="true" />
              {t("inbound")}
            </Link>
            <Link
              href="/operations/outbound"
              aria-current={current === "outbound" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "outbound"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <TruckIcon className="h-5 w-5" aria-hidden="true" />
              {t("outbound")}
            </Link>
            <Link
              href="/operations/alarms"
              aria-current={current === "alarms" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "alarms"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <BellAlertIcon className="h-5 w-5" aria-hidden="true" />
              {t("alarmOperations")}
            </Link>
            <Link
              href="/operations/projections"
              aria-current={current === "projections" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "projections"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <QueueListIcon className="h-5 w-5" aria-hidden="true" />
              {t("projections")}
            </Link>
            {canViewAudit ? (
              <Link
                href="/operations/audit"
                aria-current={current === "audit" ? "page" : undefined}
                className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  current === "audit"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <ClipboardDocumentListIcon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                {t("auditHistory")}
              </Link>
            ) : null}
          </nav>
          <div className="mt-auto border-t border-[var(--border)] pt-4">
            <Link
              href="/operations/help"
              aria-current={current === "help" ? "page" : undefined}
              className="ui-pressable flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
            >
              {t("helpTitle")}
            </Link>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="ui-pressable flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-muted)]"
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
              <div className="flex items-center gap-3 md:hidden">
                <Link
                  href="/"
                  aria-label={t("platform")}
                  className="ui-pressable rounded-lg p-2 text-[var(--text-muted)]"
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <span className="text-sm font-bold">{t("operations")}</span>
              </div>
              <div
                aria-label={t("operationalContext")}
                className="order-3 flex w-full min-w-0 items-center gap-2 pb-3 text-xs md:order-none md:w-auto md:pb-0"
              >
                {access ? (
                  <WarehouseContextControl access={access} />
                ) : (
                  <span>{t("warehouseContextUnavailable")}</span>
                )}
                {environmentLabel ? (
                  <span className="hidden rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)] lg:inline">
                    {environmentLabel}
                  </span>
                ) : null}
                {deploymentProfileLabel ? (
                  <span className="hidden rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)] lg:inline">
                    {deploymentProfileLabel}
                  </span>
                ) : null}
                {equipmentSourceLabel ? (
                  <span className="hidden rounded-md border border-[var(--border)] px-2 py-1 font-semibold text-[var(--text-muted)] lg:inline">
                    {equipmentSourceLabel}
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
              <Link
                href="/operations/help"
                aria-current={current === "help" ? "page" : undefined}
                className="ui-pressable inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold text-[var(--accent-strong)]"
              >
                {t("helpTitle")}
              </Link>
              <Link
                href="/operations"
                aria-current={current === "overview" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "overview"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("overview")}
              </Link>
              <Link
                href="/operations/tasks"
                aria-current={current === "tasks" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "tasks"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("taskQueueTitle")}
              </Link>
              <Link
                href="/operations/inventory"
                aria-current={current === "inventory" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "inventory"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("inventory")}
              </Link>
              <Link
                href="/operations/warehouse"
                aria-current={current === "warehouse" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "warehouse"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("liveView")}
              </Link>
              <Link
                href="/operations/inbound"
                aria-current={current === "inbound" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "inbound"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("inbound")}
              </Link>
              <Link
                href="/operations/outbound"
                aria-current={current === "outbound" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "outbound"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("outbound")}
              </Link>
              <Link
                href="/operations/alarms"
                aria-current={current === "alarms" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "alarms"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("alarmOperations")}
              </Link>
              <Link
                href="/operations/projections"
                aria-current={current === "projections" ? "page" : undefined}
                className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "projections"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("projections")}
              </Link>
              {canViewAudit ? (
                <Link
                  href="/operations/audit"
                  aria-current={current === "audit" ? "page" : undefined}
                  className={`ui-pressable shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${
                    current === "audit"
                      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {t("auditHistory")}
                </Link>
              ) : null}
            </nav>
          </header>
          <main id="main-content" className="px-4 py-8 sm:px-6 lg:px-8">
            {current !== "help" && (
              <Link
                href={`/operations/help?topic=${
                  {
                    overview: "daily-work",
                    tasks: "daily-work",
                    inventory: "inventory",
                    warehouse: "live-view",
                    inbound: "inbound-outbound",
                    outbound: "inbound-outbound",
                    alarms: "exceptions",
                    audit: "audit",
                    projections: "troubleshooting",
                  }[current]
                }`}
                className="ui-pressable mb-4 inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-[var(--accent-strong)]"
              >
                {t("helpContextual")}
              </Link>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
