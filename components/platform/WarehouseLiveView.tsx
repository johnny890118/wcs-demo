import Link from "next/link";
import { useState } from "react";
import type {
  LiveEquipment,
  OperationsLiveView,
} from "../../src/application/operations/operations-live-view";
import type { MessageKey } from "../../src/ui/i18n/catalogs";
import { useLocale } from "../../src/ui/i18n/locale-provider";

const contextLink =
  "ui-pressable inline-flex min-h-11 items-center break-words rounded-md text-sm font-semibold text-[var(--accent-strong)]";
export function WarehouseLiveView({
  view,
  projectionCurrent,
  now,
}: {
  view: OperationsLiveView;
  projectionCurrent: boolean;
  now: number;
}) {
  const { locale, t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    view.equipment.find((item) => item.equipmentId === selectedId) ??
    view.equipment[0];
  const positionState = (item: LiveEquipment) =>
    item.position.state === "current" &&
    (!projectionCurrent || now >= Date.parse(item.position.validUntil!))
      ? "last_known"
      : item.position.state;
  const stateText = (item: LiveEquipment) =>
    t(`liveState_${item.status ?? "unobserved"}` as MessageKey);
  const observedWork = selected?.observedTaskId
    ? view.work.find((task) => task.taskId === selected.observedTaskId)
    : null;
  const assignedWork = selected
    ? view.work.filter((task) => selected.assignedTaskIds.includes(task.taskId))
    : [];
  const affectedAlarms = selected
    ? view.alarms.filter(
        (alarm) =>
          alarm.equipmentId === selected.equipmentId ||
          selected.assignedTaskIds.includes(alarm.taskId) ||
          alarm.taskId === selected.observedTaskId,
      )
    : [];
  const time = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(value));
  return (
    <div className="space-y-5">
      <p className="max-w-4xl text-sm leading-6 text-[var(--text-muted)]">
        {t("liveScopeNotice")}
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        {t("refreshedAt")}:{" "}
        <time dateTime={view.generatedAt}>{time(view.generatedAt)} UTC</time>
      </p>
      {!projectionCurrent && (
        <p
          role="status"
          className="rounded-lg border border-[var(--warning)] bg-[var(--surface)] p-4 text-sm leading-6"
        >
          {t("homeStaleDescription")}
        </p>
      )}
      {Object.values(view.coverage).some(Boolean) && (
        <p className="rounded-lg border border-[var(--warning)] bg-[var(--surface)] p-4 text-sm leading-6">
          {t("liveCoverageNotice")}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
        <section
          aria-labelledby="live-equipment-heading"
          className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <h2 id="live-equipment-heading" className="text-lg font-bold">
            {t("equipmentLabel")}
          </h2>
          {!view.equipment.length ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("liveNoEquipment")}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {view.equipment.map((item) => (
                <li key={item.equipmentId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.equipmentId)}
                    aria-pressed={item.equipmentId === selected?.equipmentId}
                    className={`ui-pressable flex min-h-11 w-full flex-col gap-1 rounded-lg border p-3 text-left ${
                      item.equipmentId === selected?.equipmentId
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span className="break-all text-sm font-bold">
                      {item.equipmentId}
                    </span>
                    <span className="text-xs">
                      {!item.active ? t("liveInactive") : stateText(item)} ·{" "}
                      {t(`livePosition_${positionState(item)}` as MessageKey)}
                    </span>
                    <span className="break-words text-xs">
                      {item.position.locations.join(" · ") ||
                        t("liveNoBoundLocation")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          aria-labelledby="live-context-heading"
          className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <h2 id="live-context-heading" className="text-lg font-bold">
            {t("liveEquipmentContext")}
          </h2>
          {selected ? (
            <div className="mt-4 space-y-5">
              <p className="break-all font-bold">{selected.equipmentId}</p>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {t("liveRecordedState")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {!selected.active ? t("liveInactive") : stateText(selected)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">
                    {t("currentPosition")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {t(`livePosition_${positionState(selected)}` as MessageKey)}{" "}
                    ·{" "}
                    {selected.position.locations.join(" · ") ||
                      t("liveNoBoundLocation")}
                  </dd>
                </div>
              </dl>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                {selected.position.state === "current" &&
                positionState(selected) !== "current"
                  ? t("liveReason_expired")
                  : t(`liveReason_${selected.position.reason}` as MessageKey)}
              </p>
              {selected.observation && (
                <p className="text-xs text-[var(--text-muted)]">
                  {t("observedAt")}:{" "}
                  <time dateTime={selected.observation.observedAt}>
                    {time(selected.observation.observedAt)} UTC
                  </time>
                </p>
              )}
              <div>
                <h3 className="text-sm font-bold">{t("liveObservedWork")}</h3>
                {observedWork ? (
                  <Link
                    href={`/operations/tasks/${encodeURIComponent(
                      observedWork.taskId,
                    )}`}
                    className={contextLink}
                  >
                    {observedWork.source} → {observedWork.destination} ·{" "}
                    {t(`homeTask_${observedWork.status}` as MessageKey)}
                  </Link>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    {selected.observedTaskContext === "unresolved"
                      ? t("liveObservedUnresolved")
                      : t("liveObservedNone")}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">{t("liveAssignedWork")}</h3>
                <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">
                  {t("liveAssignmentNotice")}
                </p>
                {assignedWork.length ? (
                  <ul className="mt-2 space-y-2">
                    {assignedWork.map((task) => (
                      <li key={task.taskId}>
                        <Link
                          href={`/operations/tasks/${encodeURIComponent(
                            task.taskId,
                          )}`}
                          className={contextLink}
                        >
                          {task.source} → {task.destination} ·{" "}
                          {t(`homeTask_${task.status}` as MessageKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {t("liveNoAssignedWork")}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">{t("liveAffectedAlarms")}</h3>
                {affectedAlarms.length ? (
                  <ul className="mt-2 space-y-2">
                    {affectedAlarms.map((alarm) => (
                      <li key={alarm.alarmId}>
                        <Link
                          href={`/operations/tasks/${encodeURIComponent(
                            alarm.taskId,
                          )}`}
                          className={contextLink}
                        >
                          {t(
                            alarm.status === "active"
                              ? "homeReason_active_alarm"
                              : "homeReason_acknowledged_alarm",
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {t("liveNoAlarms")}
                  </p>
                )}
                <Link href="/operations/alarms" className={contextLink}>
                  {t("liveOpenAlarms")}
                </Link>
              </div>
              <details className="border-t border-[var(--border)] pt-4">
                <summary className="ui-pressable min-h-11 cursor-pointer rounded-md py-2 text-sm font-semibold">
                  {t("liveDiagnostics")}
                </summary>
                <dl className="mt-3 space-y-2 break-all text-xs text-[var(--text-muted)]">
                  <div>
                    <dt>{t("liveNode")}</dt>
                    <dd>{selected.position.nodeId ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("observationQuality")}</dt>
                    <dd>{selected.observation?.quality ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("liveConnection")}</dt>
                    <dd>{selected.observation?.connectionStatus ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("nodeCapabilities")}</dt>
                    <dd>{selected.capabilities.join(", ") || "—"}</dd>
                  </div>
                </dl>
              </details>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {t("liveSelectEquipment")}
            </p>
          )}
        </section>
      </div>
      <section
        aria-labelledby="live-work-heading"
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <h2 id="live-work-heading" className="text-lg font-bold">
          {t("activeWork")}
        </h2>
        {view.work.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {view.work.map((task) => (
              <li key={task.taskId}>
                <Link
                  href={`/operations/tasks/${encodeURIComponent(task.taskId)}`}
                  className="ui-pressable block min-h-11 rounded-lg border border-[var(--border)] p-3"
                >
                  <span className="break-words text-sm font-bold">
                    {task.source} → {task.destination}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">
                    {t(`homeTask_${task.status}` as MessageKey)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {projectionCurrent ? t("noCurrentWork") : t("liveWorkUnavailable")}
          </p>
        )}
      </section>
    </div>
  );
}
