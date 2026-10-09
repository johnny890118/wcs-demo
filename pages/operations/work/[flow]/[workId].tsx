import { formatOperationalTime } from "../../../../src/ui/format-operational-time";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { OperationsShell } from "../../../../components/platform/OperationsShell";
import { hasUserPermission } from "../../../../src/application/access/operational-access";
import {
  workIdPattern,
  workPath,
  type WorkDetail,
  type WorkFlow,
} from "../../../../src/application/operations/work-projection";
import {
  fetchWorkDetail,
  WcsProjectionError,
} from "../../../../src/infrastructure/http/wcs-api-client";
import { withReadOnlyOperationalNavigation } from "../../../../src/infrastructure/http/operational-request-context";
import { operationalPageAccess } from "../../../../src/ui/auth/operational-page-access";
import { useLocale } from "../../../../src/ui/i18n/locale-provider";
import type { MessageKey } from "../../../../src/ui/i18n/catalogs";
import {
  canOfferWorkExecution,
  workAttention,
  workResumePath,
} from "../../../../src/application/operations/work-continuation";
import { authOptions } from "../../../api/auth/[...nextauth]";

type Props = {
  detail: WorkDetail | null;
  canViewAudit: boolean;
  canExecute?: boolean;
};
const linkClass =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
export default function WorkPage({
  detail,
  canViewAudit,
  canExecute = false,
}: Props) {
  const { t, locale } = useLocale();
  if (!detail)
    return (
      <OperationsShell current="work">
        <h1 className="text-2xl font-bold">{t("workUnavailable")}</h1>
        <Link className={linkClass} href="/operations/work">
          {t("returnToWorkQueue")}
        </Link>
      </OperationsShell>
    );
  const { work, execution } = detail;
  const path = workPath(work.flow, work.workId);
  return (
    <OperationsShell current="work" titleKey="workCase">
      <Link className={linkClass} href="/operations/work">
        {t("returnToWorkQueue")}
      </Link>
      <p className="mt-4 font-semibold text-[var(--text)]">
        {t("workCase")} · {t(work.flow)}
      </p>
      <h1 className="mt-2 break-words text-3xl font-black">
        {work.externalReference}
      </h1>
      <p className="mt-4 max-w-3xl font-semibold">
        {t(`workAttention_${workAttention(detail)}` as MessageKey)}
      </p>
      <p className="mt-4 text-lg font-semibold">
        {t("workRecordedStatus")}:{" "}
        {t(`workStatus_${work.status}` as MessageKey)}
      </p>
      <section
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        aria-labelledby="work-request"
      >
        <h2 id="work-request" className="text-xl font-bold">
          {t("workRequestContents")}
        </h2>
        <ul className="mt-3 space-y-2">
          {work.contents.map((item) => (
            <li key={item.sku} className="break-words font-semibold">
              {item.sku} · {item.quantity}
            </li>
          ))}
        </ul>
        {work.destination ? (
          <p className="mt-3 font-semibold">
            {t("destinationLocation")}: {work.destination}
          </p>
        ) : null}
        {!work.contents.length || work.contentsMayBeLimited ? (
          <p className="mt-3 text-sm text-[var(--warning)]">
            {t("workContentsLimited")}
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          {t("workContentsNotice")}
        </p>
      </section>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("workStatusNotice")}
      </p>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("refreshedAt")} · {formatOperationalTime(execution.page.generatedAt)}
      </p>
      <section
        className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        aria-labelledby="work-execution"
      >
        <h2 id="work-execution" className="text-xl font-bold">
          {t("workExecution")}
        </h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {t("workTaskCounts")}: {execution.qualifiedTaskCount} /{" "}
          {execution.referencedTaskCount}
        </p>
        {execution.qualifiedTaskCount < execution.referencedTaskCount ? (
          <p
            role="status"
            className="mt-3 text-sm font-semibold text-[var(--warning)]"
          >
            {t("workIncompleteEvidence")}
          </p>
        ) : null}
        <dl className="mt-4 flex flex-wrap gap-4">
          {Object.entries(execution.counts)
            .filter(([, count]) => count > 0)
            .map(([status, count]) => (
              <div key={status}>
                <dt className="text-sm text-[var(--text-muted)]">
                  {t(`homeTask_${status}` as MessageKey)}
                </dt>
                <dd className="mt-1 font-bold">{count}</dd>
              </div>
            ))}
        </dl>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          {t("workCountsNotice")}
        </p>
        <ul className="mt-4 space-y-3">
          {execution.page.tasks.map((task) => (
            <li
              key={task.taskId}
              className="rounded-lg border border-[var(--border)] p-4"
            >
              <h3 className="break-words font-bold">
                {task.source} → {task.destination}
              </h3>
              <p className="mt-2 break-words text-sm">
                {task.sku} · {task.quantity} ·{" "}
                {t(`homeTask_${task.status}` as MessageKey)}
              </p>
              <p className="mt-2 break-words text-sm text-[var(--text-muted)]">
                {t("taskAssignedEquipment")}:{" "}
                {task.equipmentId ?? t("unassigned")}
              </p>
              <Link
                className={linkClass}
                href={`/operations/tasks/${encodeURIComponent(task.taskId)}`}
              >
                {t("openTaskDetail")}
              </Link>
              {canExecute && canOfferWorkExecution(task) ? (
                <Link
                  className={linkClass}
                  href={workResumePath(work.flow, work.workId, task.taskId)}
                >
                  {t("workResume")}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
        {!execution.page.tasks.length ? (
          <p className="mt-4 text-sm">{t("workNoTasks")}</p>
        ) : null}
        {execution.page.nextCursor ? (
          <Link
            className={linkClass}
            href={`${path}?${new URLSearchParams({
              cursor: execution.page.nextCursor,
            })}`}
          >
            {t("workNextTasks")}
          </Link>
        ) : null}
        <Link className={linkClass} href={path}>
          {t("workRefresh")}
        </Link>
      </section>
      {canViewAudit ? (
        <Link
          className={`${linkClass} mt-6`}
          href={`/operations/audit?${new URLSearchParams({
            resourceType:
              work.flow === "inbound" ? "InboundReceipt" : "OutboundOrder",
            resourceId: work.workId,
          })}`}
        >
          {t(
            work.flow === "inbound"
              ? "viewReceiptAuditEvidence"
              : "viewOrderAuditEvidence",
          )}
        </Link>
      ) : null}
      <details className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">
          {t("homeTechnicalDetails")}
        </summary>
        <p className="mt-3 break-all text-xs">{work.workId}</p>
      </details>
    </OperationsShell>
  );
}
export const getServerSideProps: GetServerSideProps<Props> =
  withReadOnlyOperationalNavigation<Props>(async (context) => {
    const { flow, workId } = context.params ?? {};
    if (
      typeof flow !== "string" ||
      !["inbound", "outbound"].includes(flow) ||
      typeof workId !== "string" ||
      !workIdPattern.test(workId)
    )
      return { notFound: true };
    const path = workPath(flow as WorkFlow, workId);
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const access = operationalPageAccess(session, "operations.view", path);
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    const cursor = context.query.cursor;
    if (
      cursor !== undefined &&
      (typeof cursor !== "string" || cursor.length > 1000)
    )
      return { notFound: true };
    let detail: WorkDetail | null = null;
    try {
      detail = await fetchWorkDetail(access.access, flow as WorkFlow, workId, {
        cursor,
      });
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
        canExecute: hasUserPermission(access.access, "transport.execute"),
        canViewAudit: hasUserPermission(access.access, "audit.view"),
      },
    };
  });
