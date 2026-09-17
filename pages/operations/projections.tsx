import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "../../src/application/operations/operations-details";
import { fetchOperationsDetails } from "../../src/infrastructure/http/wcs-api-client";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = { details: OperationsDetails | null };

function Empty({ children }: { children: string }) {
  return (
    <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function CapabilityList({
  values,
  label,
}: {
  values: readonly string[];
  label: string;
}) {
  return values.length > 0 ? (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {values.map((value) => (
        <li
          key={value}
          className="rounded-md bg-[var(--surface-muted)] px-2 py-1 font-mono text-[11px] text-[var(--text-muted)]"
        >
          {value}
        </li>
      ))}
    </ul>
  ) : (
    <span>—</span>
  );
}

export default function OperationsProjectionsPage({ details }: PageProps) {
  const { t } = useLocale();
  const [liveDetails, setLiveDetails] = useState(details);
  const [isLive, setIsLive] = useState(details !== null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/operations/details");
        const payload: unknown = await response.json();
        if (!response.ok || !isOperationsDetails(payload)) throw new Error();
        if (active) {
          setLiveDetails(payload);
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

  return (
    <OperationsShell current="projections">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
            {t("projections")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
            {t("projectionsTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            {t("projectionsDescription")}
          </p>
        </div>
        <p
          className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
          aria-live="polite"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? "bg-[var(--success)]" : "bg-[var(--warning)]"
            }`}
            aria-hidden="true"
          />
          {isLive ? t("liveData") : t("staleData")}
        </p>
      </header>

      {!isLive ? (
        <div
          role="status"
          className="mt-8 rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface))] p-4"
        >
          <p className="text-sm font-bold">{t("serviceUnavailable")}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {t("serviceUnavailableDescription")}
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <h2 className="border-b border-[var(--border)] px-5 py-4 font-bold">
            {t("tasks")} · {liveDetails?.tasks.length ?? 0}
          </h2>
          {liveDetails?.tasks.length ? (
            <ul className="divide-y divide-[var(--border)]">
              {liveDetails.tasks.map((task) => (
                <li key={task.taskId} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="text-xs font-semibold">{task.taskId}</code>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">
                    {task.source} → {task.destination}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("equipmentLabel")}: {task.equipmentId ?? t("unassigned")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t("noTasks")}</Empty>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <h2 className="border-b border-[var(--border)] px-5 py-4 font-bold">
            {t("equipment")} · {liveDetails?.equipment.length ?? 0}
          </h2>
          {liveDetails?.equipment.length ? (
            <ul className="divide-y divide-[var(--border)]">
              {liveDetails.equipment.map((item) => (
                <li key={item.equipmentId} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{item.equipmentId}</p>
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {item.active ? t("active") : t("inactive")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {t("adapter")}: {item.adapterKey}
                  </p>
                  <div className="mt-3">
                    <CapabilityList
                      values={item.capabilities}
                      label={t("capabilities")}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{t("noEquipment")}</Empty>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <h2 className="border-b border-[var(--border)] px-5 py-4 font-bold">
            {t("inventory")} · {liveDetails?.inventory.length ?? 0}
          </h2>
          {liveDetails?.inventory.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">{t("inventory")}</caption>
                <thead className="text-xs text-[var(--text-muted)]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      {t("sku")}
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      {t("quantity")}
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      {t("location")}
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      {t("status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liveDetails.inventory.map((item) => (
                    <tr
                      key={item.inventoryUnitId}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="px-5 py-4 font-semibold">{item.sku}</td>
                      <td className="px-5 py-4 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-muted)]">
                        {item.location}
                      </td>
                      <td className="px-5 py-4">{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>{t("noInventory")}</Empty>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-bold">{t("activeTopology")}</h2>
            <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
              {liveDetails?.topology
                ? `${liveDetails.topology.topologyId} · ${t("revision")} ${
                    liveDetails.topology.revision
                  }`
                : "—"}
            </p>
          </div>
          {liveDetails?.topology ? (
            <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
              <div className="bg-[var(--surface)] p-5">
                <h3 className="text-sm font-bold">
                  {t("topologyNodes")} · {liveDetails.topology.nodes.length}
                </h3>
                <ul className="mt-4 space-y-3">
                  {liveDetails.topology.nodes.map((node) => (
                    <li key={node.nodeId}>
                      <p className="font-mono text-xs font-semibold">
                        {node.nodeId}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {node.kind}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[var(--surface)] p-5">
                <h3 className="text-sm font-bold">
                  {t("topologyEdges")} · {liveDetails.topology.edges.length}
                </h3>
                <ul className="mt-4 space-y-3">
                  {liveDetails.topology.edges.map((edge) => (
                    <li key={edge.edgeId}>
                      <p className="font-mono text-xs font-semibold">
                        {edge.edgeId}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {edge.fromNodeId} → {edge.toNodeId} · {edge.status}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <Empty>{t("noTopology")}</Empty>
          )}
        </section>
      </div>
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
          "/operations/projections",
        )}`,
        permanent: false,
      },
    };
  }
  let details: OperationsDetails | null = null;
  try {
    details = await fetchOperationsDetails();
  } catch {
    details = null;
  }
  return { props: { session, details } };
};
