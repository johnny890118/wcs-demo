import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { WarehouseTopologyMap } from "../../components/platform/WarehouseTopologyMap";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "../../src/application/operations/operations-details";
import { fetchOperationsDetails } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = { details: OperationsDetails | null; warehouseId?: string };

export default function WarehouseOperationsPage(props: PageProps) {
  return (
    <WarehouseView
      key={`${props.warehouseId ?? "unavailable"}:${
        props.details?.generatedAt ?? "none"
      }`}
      {...props}
    />
  );
}

function WarehouseView({ details }: PageProps) {
  const { t } = useLocale();
  const [liveDetails, setLiveDetails] = useState(details);
  const [isLive, setIsLive] = useState(details !== null);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/operations/details", {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isOperationsDetails(payload)) throw new Error();
        if (active) {
          setLiveDetails(payload);
          setIsLive(true);
        }
      } catch {
        if (active) setIsLive(false);
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

  return (
    <OperationsShell current="warehouse">
      <div className="mb-4 flex items-center justify-end gap-2 text-xs text-[var(--text-muted)]">
        <span
          className={`h-2 w-2 rounded-full ${
            isLive ? "bg-[var(--success)]" : "bg-[var(--warning)]"
          }`}
          aria-hidden="true"
        />
        <span aria-live="polite">
          {isLive ? t("liveData") : t("staleData")}
        </span>
      </div>
      {liveDetails ? (
        <WarehouseTopologyMap
          details={liveDetails}
          projectionCurrent={isLive}
        />
      ) : (
        <section
          role="status"
          className="rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_10%,var(--surface))] p-5"
        >
          <h1 className="text-lg font-bold">{t("serviceUnavailable")}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {t("serviceUnavailableDescription")}
          </p>
        </section>
      )}
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
    "/operations/warehouse",
  );
  if (!access.allowed) {
    return {
      redirect: {
        destination: access.destination,
        permanent: false,
      },
    };
  }
  let details: OperationsDetails | null = null;
  try {
    details = await fetchOperationsDetails(access.access);
  } catch {
    details = null;
  }
  return {
    props: { session, details, warehouseId: access.access.currentWarehouseId },
  };
};
