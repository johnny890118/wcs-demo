import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { useCallback, useEffect, useRef, useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { WarehouseNavigation } from "../../components/platform/WarehouseNavigation";
import { WarehouseLiveView } from "../../components/platform/WarehouseLiveView";
import {
  isOperationsLiveView,
  type OperationsLiveView,
} from "../../src/application/operations/operations-live-view";
import { fetchOperationsLiveView } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type Props = { view: OperationsLiveView | null; warehouseId: string };
export default function WarehousePage(props: Props) {
  return (
    <LiveWorkspace
      key={`${props.warehouseId}:${props.view?.generatedAt ?? "none"}`}
      {...props}
    />
  );
}
function LiveWorkspace({ view }: Props) {
  const { t } = useLocale();
  const [liveView, setLiveView] = useState(view);
  const [current, setCurrent] = useState(view !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(view ? Date.parse(view.generatedAt) : 0);
  const active = useRef(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (pending.current || !active.current || !controller.current) return;
    pending.current = true;
    setRefreshing(true);
    try {
      const response = await fetch("/api/operations/live-view", {
        signal: AbortSignal.any([
          controller.current.signal,
          AbortSignal.timeout(15_000),
        ]),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isOperationsLiveView(payload)) throw new Error();
      if (active.current) {
        setLiveView(payload);
        setCurrent(true);
        setNow(Date.now());
      }
    } catch {
      if (active.current) setCurrent(false);
    } finally {
      pending.current = false;
      if (active.current) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    active.current = true;
    controller.current = new AbortController();
    const refreshTimer = window.setInterval(() => void refresh(), 10_000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      active.current = false;
      controller.current?.abort();
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [refresh]);
  return (
    <OperationsShell current="warehouse" titleKey="liveView">
      <WarehouseNavigation current="live" />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight">{t("liveView")}</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="ui-pressable min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {refreshing ? t("liveRefreshing") : t("liveRefresh")}
        </button>
      </div>
      {liveView ? (
        <WarehouseLiveView
          view={liveView}
          projectionCurrent={current}
          now={now}
        />
      ) : (
        <section
          role="status"
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <h2 className="text-lg font-bold">{t("serviceUnavailable")}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {t("serviceUnavailableDescription")}
          </p>
        </section>
      )}
    </OperationsShell>
  );
}
export const getServerSideProps: GetServerSideProps<Props> =
  withReadOnlyOperationalNavigation<Props>(async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const access = operationalPageAccess(
      session,
      "operations.view",
      "/operations/warehouse",
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    let view: OperationsLiveView | null = null;
    try {
      view = await fetchOperationsLiveView(access.access);
    } catch {
      view = null;
    }
    return {
      props: { session, view, warehouseId: access.access.currentWarehouseId },
    };
  });
