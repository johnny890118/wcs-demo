import {
  ArrowLeftIcon,
  ArrowRightStartOnRectangleIcon,
  BuildingStorefrontIcon,
  MapIcon,
  InboxArrowDownIcon,
  QueueListIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { LocaleControl } from "./LocaleControl";
import { ThemeControl } from "./ThemeControl";

export function OperationsShell({
  children,
  current = "overview",
}: {
  children: ReactNode;
  current?: "overview" | "warehouse" | "inbound" | "projections";
}) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-50 -translate-y-20 rounded-md bg-[var(--text)] px-3 py-2 text-sm font-semibold text-[var(--surface)] focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 md:flex md:flex-col">
          <Link
            href="/platform"
            className="ui-pressable mb-8 flex items-center gap-3 rounded-lg p-1"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-sm font-black text-[var(--on-accent)]">
              W
            </span>
            <span className="font-bold tracking-tight">{t("brand")}</span>
          </Link>
          <nav aria-label={t("desktopNavigation")} className="space-y-1">
            <Link
              href="/operations"
              aria-current={current === "overview" ? "page" : undefined}
              className={`ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                current === "overview"
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
              {t("overview")}
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
              {t("warehouseMap")}
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
            <Link
              href="/"
              className="ui-pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)]"
            >
              <BuildingStorefrontIcon className="h-5 w-5" aria-hidden="true" />
              {t("legacyWorkspace")}
            </Link>
          </nav>
          <div className="mt-auto border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/platform" })}
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
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 md:hidden">
                <Link
                  href="/platform"
                  aria-label={t("platform")}
                  className="ui-pressable rounded-lg p-2 text-[var(--text-muted)]"
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <span className="text-sm font-bold">{t("operations")}</span>
              </div>
              <p className="hidden text-xs font-medium text-[var(--text-muted)] md:block">
                {t("securedSession")}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <LocaleControl />
                <ThemeControl />
              </div>
            </div>
            <nav
              aria-label={t("mobileNavigation")}
              className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden"
            >
              <Link
                href="/operations"
                aria-current={current === "overview" ? "page" : undefined}
                className={`ui-pressable rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "overview"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("overview")}
              </Link>
              <Link
                href="/operations/warehouse"
                aria-current={current === "warehouse" ? "page" : undefined}
                className={`ui-pressable rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "warehouse"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("warehouseMap")}
              </Link>
              <Link
                href="/operations/inbound"
                aria-current={current === "inbound" ? "page" : undefined}
                className={`ui-pressable rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "inbound"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("inbound")}
              </Link>
              <Link
                href="/operations/projections"
                aria-current={current === "projections" ? "page" : undefined}
                className={`ui-pressable rounded-md px-3 py-2 text-xs font-semibold ${
                  current === "projections"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t("projections")}
              </Link>
              <Link
                href="/"
                className="ui-pressable rounded-md px-3 py-2 text-xs font-semibold text-[var(--text-muted)]"
              >
                {t("legacyWorkspace")}
              </Link>
            </nav>
          </header>
          <main id="main-content" className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
