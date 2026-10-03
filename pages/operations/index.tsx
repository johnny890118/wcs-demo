import {
  BoltIcon,
  CircleStackIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { OperationsShell } from "../../components/platform/OperationsShell";
import type { OperationsSummary } from "../../src/application/operations/operations-summary";
import { type OperationsHome } from "../../src/application/operations/operations-home";
import { isOperationsOverview } from "../../src/application/operations/operations-overview";
import { fetchOperationsOverview } from "../../src/infrastructure/http/wcs-api-client";
import type { MessageKey } from "../../src/ui/i18n/catalogs";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";
import { homeInvestigationDestination } from "../../src/ui/operations/home-investigation";

type PageProps = {
  summary: OperationsSummary | null;
  home: OperationsHome | null;
  warehouseId: string;
};

export default function OperationsPage(props: PageProps) {
  return (
    <OperationsHomeView
      key={`${props.warehouseId}:${props.home?.generatedAt ?? "none"}:${
        props.summary?.generatedAt ?? "none"
      }`}
      {...props}
    />
  );
}
function OperationsHomeView({ summary, home }: PageProps) {
  const { locale, t } = useLocale();
  const [liveSummary, setLiveSummary] = useState(summary);
  const [isLive, setIsLive] = useState(summary !== null);
  const [liveHome, setLiveHome] = useState(home);
  const [homeLive, setHomeLive] = useState(home !== null);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/operations/overview", {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isOperationsOverview(payload)) throw new Error();
        if (active) {
          if (payload.home) setLiveHome(payload.home);
          if (payload.summary) setLiveSummary(payload.summary);
          setHomeLive(payload.home !== null);
          setIsLive(payload.summary !== null);
        }
      } catch {
        if (active) {
          setHomeLive(false);
          setIsLive(false);
        }
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const cards = [
    {
      label: t("activeTasks"),
      value: liveSummary?.counts.activeTasks ?? "—",
      Icon: BoltIcon,
    },
    {
      label: t("storedInventory"),
      value: liveSummary?.counts.storedInventory ?? "—",
      Icon: CircleStackIcon,
    },
    {
      label: t("openReceipts"),
      value: liveSummary?.counts.openReceipts ?? "—",
      Icon: CubeIcon,
    },
    {
      label: t("configuredEquipment"),
      value: liveSummary?.counts.configuredEquipment ?? "—",
      Icon: CubeIcon,
    },
  ];

  return (
    <OperationsShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
            {t("overview")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
            {t("operationsHome")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            {t("homeDescription")}
          </p>
        </div>
        {liveSummary ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? "bg-[var(--success)]" : "bg-[var(--warning)]"
              }`}
              aria-hidden="true"
            />
            <span>{isLive ? t("liveData") : t("staleData")}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t("refreshedAt")} ·{" "}
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(liveSummary.generatedAt))}
            </span>
          </div>
        ) : null}
      </div>

      {!isLive ? (
        <div
          role="status"
          className="mt-8 flex gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface))] p-4"
        >
          <ExclamationTriangleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-bold">{t("serviceUnavailable")}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              {t("serviceUnavailableDescription")}
            </p>
          </div>
        </div>
      ) : null}

      <section
        aria-labelledby="home-attention"
        className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 id="home-attention" className="text-xl font-bold">
          {t("attentionRequired")}
        </h2>
        {liveHome ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t("refreshedAt")} ·{" "}
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(liveHome.generatedAt))}
          </p>
        ) : null}
        {!homeLive ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]" role="status">
            {t("homeStaleDescription")}
          </p>
        ) : null}
        {liveHome && Object.values(liveHome.coverage).some(Boolean) ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t("homeCoverageNotice")}
          </p>
        ) : null}
        {liveHome ? (
          liveHome.attention.length ? (
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {liveHome.attention.map((item, index) => (
                <li
                  key={`${item.kind}-${item.reference}-${index}`}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {t(`homeReason_${item.reason}` as MessageKey)}
                    </p>
                    <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                      {item.reference}
                    </p>
                  </div>
                  <Link
                    className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                    href={homeInvestigationDestination(item)}
                  >
                    {t("reviewOperationalEvidence")}
                  </Link>
                </li>
              ))}
            </ul>
          ) : homeLive ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("noAttentionRequired")}
            </p>
          ) : null
        ) : null}
      </section>
      <section
        aria-labelledby="home-work"
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 id="home-work" className="text-xl font-bold">
          {t("currentWork")}
        </h2>
        {liveHome ? (
          liveHome.work.length ? (
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {liveHome.work.map((task) => (
                <li key={task.taskId} className="py-4">
                  <h3 className="break-words font-bold">
                    {task.source} → {task.destination}
                  </h3>
                  <p className="mt-2 text-sm">
                    {t(`homeTask_${task.status}` as MessageKey)} ·{" "}
                    {task.equipmentId ?? t("unassigned")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {t(`homeNext_${task.nextStep}` as MessageKey)}
                  </p>
                  <Link
                    className="ui-pressable mt-2 inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                    href={`/operations/tasks/${encodeURIComponent(
                      task.taskId,
                    )}`}
                  >
                    {t("openTaskDetail")}
                  </Link>
                  <details className="mt-2 text-xs text-[var(--text-muted)]">
                    <summary className="min-h-8 cursor-pointer py-2">
                      {t("homeTechnicalDetails")}
                    </summary>
                    <p className="break-all py-2">
                      {t("taskId")}: {task.taskId}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          ) : homeLive ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("noCurrentWork")}
            </p>
          ) : null
        ) : null}
      </section>
      <nav
        aria-label={t("homeWorkNavigation")}
        className="mt-6 flex flex-wrap gap-3"
      >
        {[
          ["/operations/tasks", "taskQueueTitle"],
          ["/operations/inbound", "inbound"],
          ["/operations/outbound", "outbound"],
          ["/operations/inventory", "inventory"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="ui-pressable inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          >
            {t(label as MessageKey)}
          </Link>
        ))}
      </nav>
      <section aria-label={t("systemStatus")} className="mt-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, Icon }) => (
            <article
              key={label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-muted)]">
                  {label}
                </p>
                <Icon
                  className="h-5 w-5 text-[var(--accent)]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-8 text-3xl font-black tabular-nums">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <details className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <summary className="min-h-11 cursor-pointer px-5 py-4 font-semibold">
          {t("homeTechnicalDetails")}
        </summary>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-bold">{t("recentTasks")}</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {t("activeTopology")}: {liveSummary?.topology?.topologyId ?? "—"}
            {liveSummary?.topology
              ? ` · ${t("revision")} ${liveSummary.topology.revision}`
              : ""}
          </p>
        </div>
        {liveSummary?.recentTasks.length ? (
          <div
            role="region"
            aria-label={t("recentTasks")}
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">{t("recentTasks")}</caption>
              <thead className="text-xs text-[var(--text-muted)]">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t("taskId")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t("route")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t("status")}
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t("equipmentLabel")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {liveSummary.recentTasks.map((task) => (
                  <tr
                    key={task.taskId}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-5 py-4 font-mono text-xs">
                      {task.taskId}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      {task.sourceLocationId} → {task.destinationLocationId}
                    </td>
                    <td className="px-5 py-4 font-semibold">{task.status}</td>
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      {task.equipmentId ?? t("unassigned")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">
            {t("noTasks")}
          </p>
        )}
      </details>
    </OperationsShell>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const access = operationalPageAccess(
    session,
    "operations.view",
    "/operations",
  );
  if (!access.allowed) {
    return {
      redirect: {
        destination: access.destination,
        permanent: false,
      },
    };
  }

  try {
    const { summary, home } = await fetchOperationsOverview(access.access);
    return {
      props: {
        session,
        summary,
        home,
        warehouseId: access.access.currentWarehouseId,
      },
    };
  } catch {
    return {
      props: {
        session,
        summary: null,
        home: null,
        warehouseId: access.access.currentWarehouseId,
      },
    };
  }
};
