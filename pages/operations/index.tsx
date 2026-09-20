import {
  BoltIcon,
  CircleStackIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import type { OperationsSummary } from "../../src/application/operations/operations-summary";
import { isOperationsSummary } from "../../src/application/operations/operations-summary";
import { fetchOperationsSummary } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  summary: OperationsSummary | null;
};

export default function OperationsPage({ summary }: PageProps) {
  const { locale, t } = useLocale();
  const [liveSummary, setLiveSummary] = useState(summary);
  const [isLive, setIsLive] = useState(summary !== null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/operations/summary");
        const payload: unknown = await response.json();
        if (!response.ok || !isOperationsSummary(payload)) throw new Error();
        if (active) {
          setLiveSummary(payload);
          setIsLive(true);
        }
      } catch {
        if (active) setIsLive(false);
      }
    };
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => {
      active = false;
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
            {t("operationsOverview")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            {t("overviewDescription")}
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

      <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
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
      </section>
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

  let summary: OperationsSummary | null = null;
  try {
    summary = await fetchOperationsSummary(access.access);
  } catch {
    summary = null;
  }

  return { props: { session, summary } };
};
