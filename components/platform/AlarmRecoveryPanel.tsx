import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { contextPath } from "../../src/application/operations/exact-context";
import { useMemo, useState } from "react";
import {
  isAlarmAcknowledged,
  isAlarmRecovered,
  type AlarmRecovered,
} from "../../src/application/operations/alarm-workflow";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { PermissionNotice } from "./PermissionNotice";

type Props = Readonly<{
  details: OperationsDetails;
  canAcknowledge: boolean;
  canRecover: boolean;
  canViewAudit: boolean;
}>;
type AlarmItem = OperationsDetails["alarms"][number];
type RequestState = "idle" | "acknowledging" | "recovering" | "complete";

async function errorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return `HTTP ${response.status}`;
}

export function AlarmRecoveryPanel({
  details,
  canAcknowledge,
  canRecover,
  canViewAudit,
}: Props) {
  const { t } = useLocale();
  const alarmState = (status: string) =>
    status === "active"
      ? t("alarmStateActive")
      : status === "acknowledged"
        ? t("alarmStateAcknowledged")
        : t("alarmStateUnknown");
  const severity = (value: string) =>
    value === "critical"
      ? t("alarmSeverityCritical")
      : value === "warning"
        ? t("alarmSeverityWarning")
        : value === "info"
          ? t("alarmSeverityInfo")
          : t("alarmSeverityUnknown");
  const [alarms, setAlarms] = useState<AlarmItem[]>([...details.alarms]);
  const actionable = useMemo(
    () => alarms.filter((alarm) => alarm.status !== "cleared"),
    [alarms],
  );
  const [selectedAlarmId, setSelectedAlarmId] = useState(
    actionable[0]?.alarmId ?? "",
  );
  const [state, setState] = useState<RequestState>("idle");
  const [confirmationReason, setConfirmationReason] = useState("");
  const [resolution, setResolution] = useState("");
  const [strategy, setStrategy] = useState<"" | "resume" | "release">("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<AlarmRecovered | null>(null);

  const selected = alarms.find((alarm) => alarm.alarmId === selectedAlarmId);
  const affectedTask = details.tasks.find(
    (task) => task.taskId === selected?.taskId,
  );
  const canAct =
    selected?.status === "active"
      ? canAcknowledge
      : selected?.status === "acknowledged"
        ? canRecover
        : false;

  function resetConfirmation() {
    setConfirmationReason("");
    setConfirmed(false);
    setError(null);
  }

  async function acknowledge() {
    if (!canAcknowledge || !selected || !confirmed) return;
    setState("acknowledging");
    setError(null);
    try {
      const response = await fetch(
        `/api/operations/alarms/${encodeURIComponent(
          selected.alarmId,
        )}/acknowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmedAction: "acknowledge_alarm",
            confirmationReason,
          }),
        },
      );
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isAlarmAcknowledged(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      setAlarms((current) =>
        current.map((alarm) =>
          alarm.alarmId === payload.alarmId
            ? {
                ...alarm,
                status: "acknowledged",
                acknowledgedAt: new Date().toISOString(),
              }
            : alarm,
        ),
      );
      resetConfirmation();
      setState("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("idle");
    }
  }

  async function recover() {
    if (!canRecover || !selected || !strategy || !confirmed) return;
    setState("recovering");
    setError(null);
    try {
      const response = await fetch(
        `/api/operations/alarms/${encodeURIComponent(
          selected.alarmId,
        )}/recover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy,
            resolution,
            confirmedAction: `${strategy}_task`,
            confirmationReason,
          }),
        },
      );
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isAlarmRecovered(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      setCompleted(payload);
      setState("complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("idle");
    }
  }

  if (actionable.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)]"
      >
        <InformationCircleIcon
          className="h-6 w-6 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <p className="mt-3 font-bold">{t("noActionableAlarms")}</p>
        <Link
          href="/operations/tasks"
          className="ui-pressable mt-4 inline-flex min-h-11 items-center rounded-md text-sm font-bold text-[var(--accent-strong)]"
        >
          {t("returnToTaskQueue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("actionableAlarms")}
        </p>
        <label className="mt-5 block text-sm font-semibold">
          {t("selectAlarm")}
          <select
            value={selectedAlarmId}
            onChange={(event) => {
              setSelectedAlarmId(event.target.value);
              setState("idle");
              setCompleted(null);
              setStrategy("");
              setResolution("");
              resetConfirmation();
            }}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
          >
            {actionable.map((alarm) => (
              <option key={alarm.alarmId} value={alarm.alarmId}>
                {severity(alarm.severity)} · {alarm.code} ·{" "}
                {alarmState(alarm.status)}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <dl className="mt-5 space-y-3 rounded-lg bg-[var(--surface-muted)] p-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">{t("alarmCode")}</dt>
              <dd className="mt-1 font-bold">{selected.code}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("status")}</dt>
              <dd className="mt-1 font-semibold">
                {severity(selected.severity)} · {alarmState(selected.status)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">
                {t("alarmAffectedWork")}
              </dt>
              <dd className="mt-1 break-words font-semibold">
                {affectedTask
                  ? `${affectedTask.source} → ${affectedTask.destination}`
                  : t("alarmTaskContextMissing")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">
                {t("equipmentLabel")}
              </dt>
              <dd className="mt-1 font-semibold">
                {selected.equipmentId ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{t("alarmEvidence")}</dt>
              <dd className="mt-1 leading-6">{selected.message}</dd>
            </div>
          </dl>
        ) : null}
        {selected ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {t("alarmContextNotice")}
            </p>
            <Link
              href={`/operations/tasks/${encodeURIComponent(selected.taskId)}`}
              target={state === "complete" ? undefined : "_blank"}
              rel={state === "complete" ? undefined : "noopener noreferrer"}
              className="ui-pressable inline-flex min-h-11 items-center rounded-md text-sm font-bold text-[var(--accent-strong)]"
            >
              {t("inspectCreatedTask")}
              {state !== "complete" ? ` · ${t("opensNewTab")}` : ""}
            </Link>
            <Link
              className="ui-pressable inline-flex min-h-11 items-center rounded-md text-sm font-bold text-[var(--accent-strong)]"
              href={contextPath(selected.taskId, "exception", selected.alarmId)}
            >
              {t("openExactException")}
            </Link>
            <details className="border-t border-[var(--border)] pt-2">
              <summary className="ui-pressable min-h-11 cursor-pointer rounded-md py-2 text-sm font-semibold">
                {t("workflowReferences")}
              </summary>
              <dl className="space-y-2 break-all text-xs text-[var(--text-muted)]">
                <div>
                  <dt>{t("alarmReference")}</dt>
                  <dd>{selected.alarmId}</dd>
                </div>
                <div>
                  <dt>{t("taskId")}</dt>
                  <dd>{selected.taskId}</dd>
                </div>
                <div>
                  <dt>{t("status")}</dt>
                  <dd>
                    {selected.severity} · {selected.status}
                  </dd>
                </div>
              </dl>
            </details>
          </div>
        ) : null}
      </section>

      <section
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6"
        aria-labelledby="alarm-action-title"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("confirmation")}
        </p>
        <h2 id="alarm-action-title" className="mt-2 text-xl font-black">
          {selected?.status === "active"
            ? t("acknowledgeAlarm")
            : t("recoverAlarm")}
        </h2>
        {state === "complete" && completed ? (
          <div
            role="status"
            className={`mt-5 rounded-lg border p-4 ${
              completed.status === "unknown"
                ? "border-[var(--warning)] bg-[var(--surface-muted)]"
                : "border-[color:color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_8%,var(--surface))]"
            }`}
          >
            <div className="flex gap-3">
              {completed.status === "unknown" ? (
                <ExclamationTriangleIcon
                  className="h-5 w-5 shrink-0 text-[var(--warning)]"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircleIcon
                  className="h-5 w-5 shrink-0 text-[var(--success)]"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="text-sm font-bold">
                  {completed.status === "unknown"
                    ? t("alarmRecoveryUnknown")
                    : t("recoveryCompleted")}
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {completed.status === "unknown"
                    ? t("alarmRecoveryUnknownHelp")
                    : completed.status === "queued"
                      ? t("taskReleased")
                      : t("taskResumed")}
                </p>
              </div>
            </div>
            <Link
              href={`/operations/tasks/${encodeURIComponent(completed.taskId)}`}
              className="mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
            >
              {t("viewRecoveryOutcome")}
            </Link>
            {selected && canViewAudit ? (
              <>
                <Link
                  href={contextPath(selected.taskId, "history")}
                  className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                >
                  {t("viewTaskAuditEvidence")}
                </Link>
                <Link
                  href={contextPath(
                    selected.taskId,
                    "history",
                    selected.alarmId,
                  )}
                  className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                >
                  {t("viewAlarmAuditEvidence")}
                </Link>
              </>
            ) : null}
          </div>
        ) : selected ? (
          <div className="mt-5 space-y-5">
            {!canAct ? (
              <PermissionNotice>
                {selected.status !== "active" &&
                selected.status !== "acknowledged"
                  ? t("alarmStateUnknown")
                  : selected.status === "active"
                    ? t("alarmAcknowledgePermissionRequired")
                    : t("alarmRecoverPermissionRequired")}
              </PermissionNotice>
            ) : null}
            {selected.status === "acknowledged" ? (
              <>
                <label className="block text-sm font-semibold">
                  {t("recoveryStrategy")}
                  <select
                    value={strategy}
                    onChange={(event) =>
                      setStrategy(
                        event.target.value as "" | "resume" | "release",
                      )
                    }
                    disabled={!canAct || state === "recovering"}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
                  >
                    <option value="">{t("chooseRecoveryStrategy")}</option>
                    <option value="resume">{t("resumeTask")}</option>
                    <option value="release">{t("releaseTask")}</option>
                  </select>
                </label>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {strategy === "resume"
                    ? t("alarmResumeImpact")
                    : strategy === "release"
                      ? t("alarmReleaseImpact")
                      : t("alarmChooseImpact")}
                </p>
                <label className="block text-sm font-semibold">
                  {t("recoveryResolution")}
                  <textarea
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    required
                    maxLength={500}
                    rows={3}
                    disabled={!canAct || state === "recovering"}
                    className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
                  />
                </label>
              </>
            ) : (
              <div className="flex gap-3 rounded-lg bg-[var(--surface-muted)] p-4">
                <ExclamationTriangleIcon
                  className="h-5 w-5 shrink-0 text-[var(--warning)]"
                  aria-hidden="true"
                />
                <p className="text-sm leading-6">
                  {t("acknowledgementDescription")}
                </p>
              </div>
            )}
            <label className="block text-sm font-semibold">
              {t("confirmationReason")}
              <textarea
                value={confirmationReason}
                onChange={(event) => setConfirmationReason(event.target.value)}
                required
                minLength={8}
                maxLength={500}
                rows={3}
                disabled={!canAct || state !== "idle"}
                className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={!canAct || state !== "idle"}
                className="mt-1 h-4 w-4"
              />
              <span>
                {selected.status === "active"
                  ? t("acknowledgeStatement")
                  : t("recoveryStatement")}
              </span>
            </label>
            <button
              type="button"
              onClick={() =>
                void (selected.status === "active" ? acknowledge() : recover())
              }
              disabled={
                !confirmed ||
                !canAct ||
                confirmationReason.trim().length < 8 ||
                state !== "idle" ||
                (selected.status === "acknowledged" &&
                  (!strategy || !resolution.trim()))
              }
              className="ui-pressable w-full rounded-lg bg-[var(--danger)] px-4 py-2.5 text-sm font-bold text-[var(--on-danger)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "acknowledging"
                ? t("acknowledgingAlarm")
                : state === "recovering"
                  ? t("recoveringAlarm")
                  : selected.status === "active"
                    ? t("acknowledgeAlarm")
                    : t("recoverAlarm")}
            </button>
          </div>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[color:color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-4 text-sm"
          >
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
