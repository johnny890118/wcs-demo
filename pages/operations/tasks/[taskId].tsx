import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { OperationsShell } from "../../../components/platform/OperationsShell";
import { hasUserPermission } from "../../../src/application/access/operational-access";
import type { TaskDetail } from "../../../src/application/operations/task-projection";
import { workPath } from "../../../src/application/operations/work-projection";
import { contextPath } from "../../../src/application/operations/exact-context";
import {
  fetchTaskDetail,
  WcsProjectionError,
} from "../../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../../src/ui/auth/operational-page-access";
import type { MessageKey } from "../../../src/ui/i18n/catalogs";
import { useLocale } from "../../../src/ui/i18n/locale-provider";
import { authOptions } from "../../api/auth/[...nextauth]";

type Props = { detail: TaskDetail | null; canViewAudit: boolean };
const linkClass =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]";
const panel =
  "mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5";
export default function TaskDetailPage({ detail, canViewAudit }: Props) {
  const { t, locale } = useLocale();
  if (!detail)
    return (
      <OperationsShell current="tasks">
        <h1 className="text-2xl font-bold">{t("taskDataUnavailable")}</h1>
        <Link className={linkClass} href="/operations/tasks">
          {t("returnToTaskQueue")}
        </Link>
      </OperationsShell>
    );
  const task = detail.task;
  const stateHelp =
    task.status === "blocked" || task.status === "unknown"
      ? "homeNext_review_exception"
      : task.status === "queued"
        ? "homeNext_await_assignment"
        : task.status === "completed"
          ? "taskCompletedHelp"
          : task.status === "cancelled"
            ? "taskCancelledHelp"
            : "homeNext_monitor";
  const auditUrl = (type: string, id: string) =>
    `/operations/audit?${new URLSearchParams({
      resourceType: type,
      resourceId: id,
    })}`;
  return (
    <OperationsShell current="tasks">
      <Link className={linkClass} href="/operations/tasks">
        {t("returnToTaskQueue")}
      </Link>
      <h1 className="mt-3 break-words text-3xl font-black">
        {task.source} → {task.destination}
      </h1>
      <Link
        className={linkClass}
        href={workPath(task.flow, detail.originResource.id)}
      >
        {t("openWorkContext")}
      </Link>
      <p className="mt-3 text-lg font-semibold">
        {t(`homeTask_${task.status}` as MessageKey)}
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t(stateHelp)}
      </p>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("refreshedAt")} ·{" "}
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(detail.generatedAt))}
      </p>
      <section className={panel} aria-labelledby="task-context">
        <h2 id="task-context" className="text-xl font-bold">
          {t("taskContext")}
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["taskOrigin", `${t(task.flow)} · ${task.externalReference}`],
              ["sku", task.sku],
              ["quantity", task.quantity],
              ["externalLoadId", detail.load.externalId],
              ["taskLoadLocation", detail.load.location],
              ["taskAssignedEquipment", task.equipmentId ?? t("unassigned")],
            ] as const
          ).map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm text-[var(--text-muted)]">{t(key)}</dt>
              <dd className="mt-1 break-words font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
          {t("taskAssignmentNotice")}
        </p>
        <nav
          aria-label={t("exactContextSurfaces")}
          className="mt-3 flex flex-wrap gap-2"
        >
          <Link className={linkClass} href={contextPath(task.taskId, "load")}>
            {t("loads")}
          </Link>
          <Link
            className={linkClass}
            href={contextPath(task.taskId, "inventory")}
          >
            {t("inventory")}
          </Link>
          <Link className={linkClass} href={contextPath(task.taskId, "source")}>
            {t("source")}
          </Link>
          <Link
            className={linkClass}
            href={contextPath(task.taskId, "destination")}
          >
            {t("destination")}
          </Link>
        </nav>
      </section>
      <section className={panel} aria-labelledby="task-exception">
        <h2 id="task-exception" className="text-xl font-bold">
          {t("taskException")}
        </h2>
        {detail.alarm ? (
          <>
            <p className="mt-3 text-sm">{detail.alarm.message}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {t(
                detail.alarm.status === "active"
                  ? "homeReason_active_alarm"
                  : "homeReason_acknowledged_alarm",
              )}
            </p>
            <Link
              className={linkClass}
              href={contextPath(task.taskId, "exception", detail.alarm.alarmId)}
            >
              {t("alarmOperations")}
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {task.status === "unknown"
              ? t("homeReason_unknown_task")
              : task.status === "blocked"
                ? t("taskBlockingEvidenceMissing")
                : t("taskNoOpenAlarm")}
          </p>
        )}
      </section>
      <section className={panel} aria-labelledby="task-route">
        <h2 id="task-route" className="text-xl font-bold">
          {t("taskRecordedRoute")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {detail.route ? t("taskRecordedRouteNotice") : t("taskRoutePending")}
        </p>
        <Link className={linkClass} href={contextPath(task.taskId, "live")}>
          {t("warehouseMap")}
        </Link>
        {detail.route ? (
          <details className="mt-3 text-xs text-[var(--text-muted)]">
            <summary className="min-h-11 cursor-pointer py-3">
              {t("homeTechnicalDetails")}
            </summary>
            <p className="break-all">
              {t("activeTopology")}: {detail.route.topologyId} · {t("revision")}{" "}
              {detail.route.revision}
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-1">
              {detail.route.edges.map((edge, index) => (
                <li key={`${index}-${edge}`} className="break-all">
                  {edge}
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </section>
      <section className={panel} aria-labelledby="task-history">
        <h2 id="task-history" className="text-xl font-bold">
          {t("auditHistory")}
        </h2>
        {canViewAudit ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className={linkClass}
              href={contextPath(task.taskId, "history")}
            >
              {t("viewTaskAuditEvidence")}
            </Link>
            <Link
              className={linkClass}
              href={auditUrl(
                detail.originResource.type,
                detail.originResource.id,
              )}
            >
              {t(
                task.flow === "inbound"
                  ? "viewReceiptAuditEvidence"
                  : "viewOrderAuditEvidence",
              )}
            </Link>
            {detail.alarm ? (
              <Link
                className={linkClass}
                href={auditUrl("Alarm", detail.alarm.alarmId)}
              >
                {t("viewAlarmAuditEvidence")}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t("taskAuditPermissionNotice")}
          </p>
        )}
      </section>
      <details className={panel}>
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">
          {t("homeTechnicalDetails")}
        </summary>
        <p className="mt-2 break-all text-xs">
          {t("taskId")}: {task.taskId}
        </p>
      </details>
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
    const taskId = context.params?.taskId;
    const access = operationalPageAccess(
      session,
      "operations.view",
      `/operations/tasks/${
        typeof taskId === "string" ? encodeURIComponent(taskId) : ""
      }`,
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    if (typeof taskId !== "string") return { notFound: true };
    let detail: TaskDetail | null = null;
    try {
      detail = await fetchTaskDetail(access.access, taskId);
    } catch (error) {
      if (
        error instanceof WcsProjectionError &&
        [400, 404].includes(error.status)
      )
        return { notFound: true };
    }
    return {
      props: {
        session,
        detail,
        canViewAudit: hasUserPermission(access.access, "audit.view"),
      },
    };
  });
