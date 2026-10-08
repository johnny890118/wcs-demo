import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { useState } from "react";
import { OperationsShell } from "../../../components/platform/OperationsShell";
import {
  isTaskQueuePage,
  type TaskQueuePage,
} from "../../../src/application/operations/task-projection";
import { fetchTaskQueue } from "../../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../../src/ui/auth/operational-page-access";
import type { MessageKey } from "../../../src/ui/i18n/catalogs";
import { useLocale } from "../../../src/ui/i18n/locale-provider";
import { authOptions } from "../../api/auth/[...nextauth]";

type Props = {
  initialPage: TaskQueuePage | null;
  view: "active" | "all";
  warehouseId: string;
};
const linkClass =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
function Queue({ initialPage, view }: Omit<Props, "warehouseId">) {
  const { t, locale } = useLocale();
  const [tasks, setTasks] = useState(initialPage?.tasks ?? []);
  const [cursor, setCursor] = useState(initialPage?.nextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initialPage === null);
  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/operations/tasks?${new URLSearchParams({ view, cursor })}`,
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isTaskQueuePage(payload)) throw new Error();
      setTasks((current) => {
        const ids = new Set(current.map((task) => task.taskId));
        return [
          ...current,
          ...payload.tasks.filter((task) => !ids.has(task.taskId)),
        ];
      });
      setCursor(payload.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <h1 className="text-3xl font-black">{t("taskQueueTitle")}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("taskQueueDescription")}
      </p>
      <nav aria-label={t("taskQueueView")} className="mt-5 flex gap-2">
        {(["active", "all"] as const).map((option) => (
          <Link
            key={option}
            className={linkClass}
            aria-current={view === option ? "page" : undefined}
            href={`/operations/tasks?view=${option}`}
          >
            {t(option === "active" ? "taskActiveView" : "taskAllView")}
          </Link>
        ))}
      </nav>
      {failed ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          {t("taskDataUnavailable")}
        </p>
      ) : null}
      {initialPage ? (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {t("refreshedAt")} ·{" "}
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(initialPage.generatedAt))}
        </p>
      ) : null}
      <ul className="mt-5 space-y-3">
        {tasks.map((task) => (
          <li
            key={task.taskId}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words font-bold">
                  {task.source} → {task.destination}
                </h2>
                <p className="mt-2 text-sm">
                  {t(task.flow)} · {task.externalReference}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {task.sku} · {task.quantity} ·{" "}
                  {t(`homeTask_${task.status}` as MessageKey)}
                </p>
              </div>
              <Link
                className={`${linkClass} self-start`}
                href={`/operations/tasks/${encodeURIComponent(task.taskId)}`}
              >
                {t("openTaskDetail")}
                <span className="sr-only">
                  {" "}
                  · {task.source} → {task.destination} ·{" "}
                  {task.externalReference}
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {!failed && tasks.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          {t("noCurrentWork")}
        </p>
      ) : null}
      {cursor ? (
        <button
          type="button"
          className={`${linkClass} mt-5`}
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? t("loadingAudit") : t("loadMoreTasks")}
        </button>
      ) : null}
      <p className="mt-6 text-xs leading-5 text-[var(--text-muted)]">
        {t("taskQueueCurrency")}
      </p>
      <Link href={`/operations/tasks?view=${view}`} className={linkClass}>
        {t("refreshTaskQueue")}
      </Link>
    </>
  );
}
export default function TaskQueuePageView(props: Props) {
  return (
    <OperationsShell current="tasks">
      <Queue
        key={`${props.warehouseId}:${props.view}:${
          props.initialPage?.generatedAt ?? "none"
        }`}
        initialPage={props.initialPage}
        view={props.view}
      />
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
      "/operations/tasks",
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    const view = context.query.view ?? "active";
    if (view !== "active" && view !== "all") return { notFound: true };
    let initialPage: TaskQueuePage | null = null;
    try {
      initialPage = await fetchTaskQueue(access.access, { view });
    } catch {
      initialPage = null;
    }
    return {
      props: {
        session,
        initialPage,
        view,
        warehouseId: access.access.currentWarehouseId,
      },
    };
  });
