import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OperationsShell } from "../../../../components/platform/OperationsShell";
import { WarehouseLiveView } from "../../../../components/platform/WarehouseLiveView";
import { AlarmRecoveryPanel } from "../../../../components/platform/AlarmRecoveryPanel";
import {
  contextPath,
  contextSurfaces,
  isContextSurface,
  type ContextSurface,
  type ExactContext,
} from "../../../../src/application/operations/exact-context";
import { workPath } from "../../../../src/application/operations/work-projection";
import type { AuditEventPage } from "../../../../src/application/audit/audit-projection";
import { hasUserPermission } from "../../../../src/application/access/operational-access";
import {
  fetchExactContext,
  fetchAuditEvents,
  WcsProjectionError,
} from "../../../../src/infrastructure/http/wcs-api-client";
import { withReadOnlyOperationalNavigation } from "../../../../src/infrastructure/http/operational-request-context";
import { operationalPageAccess } from "../../../../src/ui/auth/operational-page-access";
import { useLocale } from "../../../../src/ui/i18n/locale-provider";
import { authOptions } from "../../../api/auth/[...nextauth]";
import type { MessageKey } from "../../../../src/ui/i18n/catalogs";
type Props = {
  context: ExactContext | null;
  surface: ContextSurface;
  events: AuditEventPage | null;
  cursor: string | null;
  alarmId: string | null;
  canViewAudit: boolean;
  canAcknowledge: boolean;
  canRecover: boolean;
};
const control =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
const labels: Record<ContextSurface, MessageKey> = {
  load: "loads",
  inventory: "inventory",
  source: "source",
  destination: "destination",
  live: "liveView",
  exception: "taskException",
  history: "auditHistory",
};
export default function ExactContextPage(props: Props) {
  const { t, locale } = useLocale();
  const { context, surface } = props;
  const [now, setNow] = useState(context ? Date.parse(context.generatedAt) : 0);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [context?.generatedAt]);
  if (!context)
    return (
      <OperationsShell current="tasks">
        <h1 className="text-2xl font-bold">{t("taskDataUnavailable")}</h1>
      </OperationsShell>
    );
  const task = context.detail.task;
  const liveEquipmentId =
    props.alarmId && context.alarm
      ? context.alarm.equipmentId
      : task.equipmentId;
  const time = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const field = (label: MessageKey, value: string | number) => (
    <div key={label}>
      <dt className="text-sm text-[var(--text-muted)]">{t(label)}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
  const location = surface === "source" ? context.source : context.destination;
  return (
    <OperationsShell
      titleKey={labels[surface]}
      current={
        surface === "live"
          ? "warehouse"
          : surface === "history"
            ? "audit"
            : surface === "exception"
              ? "alarms"
              : surface === "inventory" || surface === "load"
                ? "inventory"
                : "tasks"
      }
    >
      <nav
        aria-label={t("exactContextNavigation")}
        className="mb-4 flex flex-wrap gap-2"
      >
        <Link
          className={control}
          href={workPath(task.flow, context.detail.originResource.id)}
        >
          {t("openWorkContext")} · {task.externalReference}
        </Link>
        <Link className={control} href={`/operations/tasks/${task.taskId}`}>
          {t("openTask")}
        </Link>
      </nav>
      <p className="break-words text-sm text-[var(--text-muted)]">
        {task.source} → {task.destination} ·{" "}
        {t(`homeTask_${task.status}` as MessageKey)}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t(labels[surface])}</h1>
      <nav
        aria-label={t("exactContextSurfaces")}
        className="mt-4 flex flex-wrap gap-1"
      >
        {contextSurfaces
          .filter((x) => x !== "history" || props.canViewAudit)
          .map((x) => (
            <Link
              key={x}
              className={control}
              aria-current={x === surface ? "page" : undefined}
              href={contextPath(task.taskId, x, props.alarmId ?? undefined)}
            >
              {t(labels[x])}
            </Link>
          ))}
      </nav>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t("refreshedAt")} · {time(context.generatedAt)}
      </p>
      <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        {surface === "load" ? (
          <>
            <h2 className="break-words text-xl font-bold">
              {context.load.externalId}
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {field("sku", context.load.sku)}
              {field("quantity", context.load.receivedQuantity)}
              {field("taskLoadLocation", context.load.location)}
              {field(
                "inventoryBalance",
                context.load.inventory?.quantity ?? t("exactContextUnresolved"),
              )}
            </dl>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("workContentsNotice")}
            </p>
          </>
        ) : null}
        {surface === "inventory" ? (
          context.inventory ? (
            <>
              <h2 className="text-xl font-bold">
                {context.inventory.sku} · {context.inventory.location}
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {field("inventoryBalance", context.inventory.quantity)}
                {field("reservedQuantity", context.inventory.reservedQuantity)}
                {field(
                  "unreservedQuantity",
                  context.inventory.unreservedQuantity,
                )}
                {field("externalLoadId", context.inventory.loadExternalId)}
              </dl>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                {t("inventoryQuantityNotice")}
              </p>
            </>
          ) : (
            <p role="status">{t("exactContextNoStock")}</p>
          )
        ) : null}
        {surface === "source" || surface === "destination" ? (
          <>
            <h2 className="text-xl font-bold">{location.code}</h2>
            <p className="mt-2">
              {t(
                location.status === "available"
                  ? "locationAvailable"
                  : location.status === "blocked"
                    ? "locationBlocked"
                    : "locationDisabled",
              )}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {field("locationRecordedLoads", location.recordedLoads)}
              {field("locationStockRecords", location.stockRecords)}
            </dl>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("exactContextLocationNotice")}
            </p>
          </>
        ) : null}
        {surface === "live" ? (
          context.live && liveEquipmentId ? (
            <WarehouseLiveView
              view={context.live}
              projectionCurrent={true}
              now={now}
              exactEquipmentId={liveEquipmentId}
              equipmentHref={contextPath(
                task.taskId,
                "live",
                props.alarmId ?? undefined,
              )}
            />
          ) : (
            <p role="status">{t("exactContextUnresolved")}</p>
          )
        ) : null}
        {surface === "exception" ? (
          context.alarm?.status === "cleared" ? (
            <>
              <h2 className="text-xl font-bold">
                {t("exactContextClearedAlarm")}
              </h2>
              <p className="mt-3">{context.alarm.message}</p>
              <p className="mt-2">
                {context.alarm.resolution ?? t("exactContextUnresolved")}
              </p>
              {props.canViewAudit ? (
                <Link
                  className={control}
                  href={contextPath(
                    task.taskId,
                    "history",
                    context.alarm.alarmId,
                  )}
                >
                  {t("viewAlarmAuditEvidence")}
                </Link>
              ) : null}
            </>
          ) : context.alarm ? (
            <AlarmRecoveryPanel
              key={`${context.alarm.alarmId}:${context.generatedAt}`}
              details={{
                tasks: [task],
                equipment: [],
                inventory: [],
                alarms: [context.alarm],
                locations: [],
                topology: null,
                generatedAt: context.generatedAt,
              }}
              canAcknowledge={props.canAcknowledge}
              canRecover={props.canRecover}
              canViewAudit={props.canViewAudit}
            />
          ) : (
            <p role="status">
              {t(
                task.status === "unknown"
                  ? "homeReason_unknown_task"
                  : task.status === "blocked"
                    ? "taskBlockingEvidenceMissing"
                    : "taskNoOpenAlarm",
              )}
            </p>
          )
        ) : null}
        {surface === "history" ? (
          <>
            <p className="text-sm text-[var(--text-muted)]">
              {t("exactContextHistoryNotice")}
            </p>
            {props.events ? (
              props.events.events.length ? (
                <ul className="mt-4 space-y-4">
                  {props.events.events.map((event) => (
                    <li
                      key={event.eventId}
                      className="border-t border-[var(--border)] pt-4"
                    >
                      <h2 className="font-bold">{event.action}</h2>
                      <p className="mt-1 text-sm">{time(event.occurredAt)}</p>
                      <details>
                        <summary className="min-h-11 cursor-pointer py-3">
                          {t("homeTechnicalDetails")}
                        </summary>
                        <pre className="whitespace-pre-wrap break-all text-xs">
                          {JSON.stringify(
                            {
                              actor: event.actor,
                              correlation: event.correlationId,
                              evidence: event.evidence,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4">{t("noAuditEvents")}</p>
              )
            ) : (
              <p role="alert">{t("auditUnavailable")}</p>
            )}
            {props.events?.nextCursor ? (
              <Link
                className={control}
                href={`${contextPath(
                  task.taskId,
                  "history",
                )}?${new URLSearchParams({
                  cursor: props.events.nextCursor,
                  ...(props.alarmId ? { alarmId: props.alarmId } : {}),
                })}`}
              >
                {t("loadOlderEvents")}
              </Link>
            ) : null}
          </>
        ) : null}
      </section>
      <Link
        className={`${control} mt-4`}
        href={contextPath(task.taskId, surface, props.alarmId ?? undefined)}
      >
        {t("exactContextRefresh")}
      </Link>
    </OperationsShell>
  );
}
export const getServerSideProps: GetServerSideProps<Props> =
  withReadOnlyOperationalNavigation<Props>(async (request) => {
    const session = await getServerSession(
      request.req,
      request.res,
      authOptions,
    );
    const taskId = request.params?.taskId;
    const surface = request.params?.surface;
    if (typeof taskId !== "string" || !isContextSurface(surface))
      return { notFound: true };
    const alarmId = request.query.alarmId;
    const cursor = request.query.cursor;
    if (
      (alarmId !== undefined && typeof alarmId !== "string") ||
      (cursor !== undefined &&
        (typeof cursor !== "string" || surface !== "history"))
    )
      return { notFound: true };
    const destination = contextPath(
      taskId,
      surface,
      typeof alarmId === "string" ? alarmId : undefined,
    );
    const access = operationalPageAccess(
      session,
      surface === "history" ? "audit.view" : "operations.view",
      destination,
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    // History's separate permission cannot replace the Work/Task read permission.
    if (!hasUserPermission(access.access, "operations.view"))
      return { notFound: true };
    let context: ExactContext | null = null;
    let events: AuditEventPage | null = null;
    try {
      context = await fetchExactContext(
        access.access,
        taskId,
        surface,
        typeof alarmId === "string" ? alarmId : undefined,
      );
    } catch (error) {
      if (
        error instanceof WcsProjectionError &&
        [400, 404].includes(error.status)
      )
        return { notFound: true };
    }
    if (context && surface === "history")
      try {
        events = await fetchAuditEvents(access.access, {
          resourceType: typeof alarmId === "string" ? "Alarm" : "TransportTask",
          resourceId:
            typeof alarmId === "string"
              ? context.alarm!.alarmId
              : context.detail.task.taskId,
          cursor: typeof cursor === "string" ? cursor : undefined,
        });
      } catch {
        events = null;
      }
    return {
      props: {
        session,
        context,
        surface,
        events,
        cursor: typeof cursor === "string" ? cursor : null,
        alarmId: typeof alarmId === "string" ? alarmId : null,
        canViewAudit: hasUserPermission(access.access, "audit.view"),
        canAcknowledge: hasUserPermission(access.access, "alarm.acknowledge"),
        canRecover: hasUserPermission(access.access, "alarm.recover"),
      },
    };
  });
