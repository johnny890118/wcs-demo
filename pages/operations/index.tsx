import {
  BoltIcon,
  CircleStackIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { OperationsShell } from "../../components/platform/OperationsShell";
import type { OperationsSummary } from "../../src/application/operations/operations-summary";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  summary: OperationsSummary | null;
};

export default function OperationsPage({ summary }: PageProps) {
  const { locale, t } = useLocale();
  const cards = [
    {
      label: t("activeTasks"),
      value: summary?.counts.activeTasks ?? "—",
      Icon: BoltIcon,
    },
    {
      label: t("storedInventory"),
      value: summary?.counts.storedInventory ?? "—",
      Icon: CircleStackIcon,
    },
    {
      label: t("openReceipts"),
      value: summary?.counts.openReceipts ?? "—",
      Icon: CubeIcon,
    },
    {
      label: t("configuredEquipment"),
      value: summary?.counts.configuredEquipment ?? "—",
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
        {summary ? (
          <p className="text-xs text-[var(--text-muted)]">
            {t("refreshedAt")} ·{" "}
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(summary.generatedAt))}
          </p>
        ) : null}
      </div>

      {!summary ? (
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
            {t("activeTopology")}: {summary?.topology?.topologyId ?? "—"}
            {summary?.topology
              ? ` · ${t("revision")} ${summary.topology.revision}`
              : ""}
          </p>
        </div>
        {summary?.recentTasks.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="text-xs text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t("taskId")}</th>
                  <th className="px-5 py-3 font-semibold">{t("route")}</th>
                  <th className="px-5 py-3 font-semibold">{t("status")}</th>
                  <th className="px-5 py-3 font-semibold">
                    {t("equipmentLabel")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTasks.map((task) => (
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
  if (!session) {
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          "/operations",
        )}`,
        permanent: false,
      },
    };
  }

  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  let summary: OperationsSummary | null = null;
  if (token) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/operations/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok) summary = (await response.json()) as OperationsSummary;
    } catch {
      summary = null;
    }
  }

  return { props: { session, summary } };
};
