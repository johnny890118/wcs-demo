import Link from "next/link";
import { useEffect, useState } from "react";
import { equipmentObservationFreshAfterMs } from "../../src/application/equipment/observation-freshness";
import type { TaskDetail } from "../../src/application/operations/task-projection";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { canOfferWorkExecution } from "../../src/application/operations/work-continuation";
import { workPath } from "../../src/application/operations/work-projection";
import { contextPath } from "../../src/application/operations/exact-context";
import { isInboundExecutionCompleted } from "../../src/application/operations/inbound-workflow";
import { isOutboundExecutionCompleted } from "../../src/application/operations/outbound-workflow";
import { useLocale } from "../../src/ui/i18n/locale-provider";

export function WorkExecutionPanel({
  detail,
  equipment,
  canExecute,
}: {
  detail: TaskDetail;
  equipment: OperationsDetails["equipment"];
  canExecute: boolean;
}) {
  const { t } = useLocale();
  const task = detail.task;
  const [now, setNow] = useState(Date.parse(detail.generatedAt));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [detail.generatedAt]);
  const root = workPath(task.flow, detail.originResource.id);
  const available = equipment.filter(
    (item) =>
      item.active &&
      ["transport.move", "load.pickup", "load.dropoff"].every((capability) =>
        item.capabilities.includes(capability),
      ) &&
      item.telemetry?.status === "idle" &&
      item.telemetry.connectionStatus === "connected" &&
      item.telemetry.quality === "good" &&
      item.telemetry.freshness === "current" &&
      Number.isFinite(Date.parse(item.telemetry.receivedAt)) &&
      Math.max(
        item.telemetry.ageMs,
        now - Date.parse(item.telemetry.receivedAt),
      ) <= equipmentObservationFreshAfterMs &&
      item.telemetry.nodeId !== null,
  );
  const [equipmentId, setEquipmentId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const link =
    "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 font-semibold ui-link";
  async function execute() {
    if (
      !canExecute ||
      !canOfferWorkExecution(task) ||
      pending ||
      attempted ||
      !confirmed ||
      reason.trim().length < 8 ||
      !available.some((item) => item.equipmentId === equipmentId)
    )
      return;
    setPending(true);
    setAttempted(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/operations/${task.flow}/${encodeURIComponent(
          task.taskId,
        )}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId,
            confirmedAction: `execute_${task.flow}_task`,
            confirmationReason: reason,
          }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (
        !isInboundExecutionCompleted(payload) ||
        (task.flow === "outbound" && !isOutboundExecutionCompleted(payload)) ||
        payload.taskId !== task.taskId ||
        payload.equipmentId !== equipmentId
      )
        throw new Error(t("invalidServerResponse"));
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
    } finally {
      setPending(false);
      setConfirmed(false);
    }
  }
  return (
    <section className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-xl font-bold">{t("reviewAndExecute")}</h2>
      <p>
        {task.source} → {task.destination} · {task.sku} · {task.quantity}
      </p>
      <p className="text-sm text-[var(--text-muted)]">
        {t("workResumeSafetyNotice")}
      </p>
      {pending ? <p role="status">{t("workExecutionPending")}</p> : null}
      {complete ? (
        <p role="status">{t("workExecutionRecorded")}</p>
      ) : error ? (
        <div role="alert">
          <p>{t("workAttemptNeedsEvidence")}</p>
          <details>
            <summary className="min-h-11 cursor-pointer py-3">
              {t("homeTechnicalDetails")}
            </summary>
            <p className="break-words text-sm">{error}</p>
          </details>
        </div>
      ) : null}
      {canExecute && canOfferWorkExecution(task) && !attempted ? (
        <>
          <label className="block font-semibold">
            {t("equipmentLabel")}
            <select
              aria-label={t("equipmentLabel")}
              className="mt-2 min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--canvas)] p-3"
              value={equipmentId}
              onChange={(event) => {
                setEquipmentId(event.target.value);
                setConfirmed(false);
              }}
              disabled={pending}
            >
              <option value="">{t("workSelectEquipment")}</option>
              {available.map((item) => (
                <option key={item.equipmentId} value={item.equipmentId}>
                  {item.equipmentId}
                </option>
              ))}
            </select>
          </label>
          {!available.length ? (
            <p role="status">{t("workNoQualifiedEquipment")}</p>
          ) : null}
          <label className="block font-semibold">
            {t("confirmationReason")}
            <textarea
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-[var(--canvas)] p-3"
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setConfirmed(false);
              }}
              maxLength={500}
              disabled={pending}
            />
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={pending}
            />
            {t("workConfirmExactExecution")}
          </label>
          <button
            className="ui-pressable min-h-11 rounded-md bg-[var(--accent)] px-4 py-3 font-bold text-[var(--on-accent)] disabled:opacity-50"
            onClick={execute}
            disabled={
              pending ||
              !confirmed ||
              reason.trim().length < 8 ||
              !available.some((item) => item.equipmentId === equipmentId)
            }
          >
            {t(task.flow === "inbound" ? "executeInbound" : "executeOutbound")}
          </button>
        </>
      ) : !attempted ? (
        <p role="status">{t("workInspectBeforeAction")}</p>
      ) : null}
      <nav
        aria-label={t("workContinuationLinks")}
        className="flex flex-wrap gap-2"
      >
        <Link className={link} href={root}>
          {t("openWorkContext")}
        </Link>
        <Link className={link} href={`/operations/tasks/${task.taskId}`}>
          {t("openTaskDetail")}
        </Link>
        <Link className={link} href={contextPath(task.taskId, "inventory")}>
          {t("inventory")}
        </Link>
      </nav>
    </section>
  );
}
