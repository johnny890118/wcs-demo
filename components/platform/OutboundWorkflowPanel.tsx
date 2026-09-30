import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  isOutboundExecutionCompleted,
  isOutboundOrderAllocated,
  type OutboundOrderAllocated,
} from "../../src/application/operations/outbound-workflow";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { PermissionNotice } from "./PermissionNotice";

type Props = Readonly<{
  details: OperationsDetails;
  canCreate: boolean;
  canExecute: boolean;
  canViewAudit: boolean;
}>;
type RequestState = "idle" | "creating" | "ready" | "executing" | "complete";

async function errorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return `HTTP ${response.status}`;
}

export function OutboundWorkflowPanel({
  details,
  canCreate,
  canExecute,
  canViewAudit,
}: Props) {
  const { t } = useLocale();
  const inventory = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const item of details.inventory) {
      if (item.status === "available") {
        quantities.set(
          item.sku,
          (quantities.get(item.sku) ?? 0) + item.quantity,
        );
      }
    }
    return [...quantities.entries()]
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((left, right) => left.sku.localeCompare(right.sku));
  }, [details.inventory]);
  const destinations = useMemo(
    () =>
      details.locations.filter(
        (location) =>
          location.status === "available" &&
          location.activeNodeId !== null &&
          location.capabilities.includes("outbound.stage"),
      ),
    [details.locations],
  );
  const equipment = useMemo(
    () =>
      details.equipment.filter(
        (item) =>
          item.active &&
          item.capabilities.includes("transport.move") &&
          item.capabilities.includes("load.pickup") &&
          item.capabilities.includes("load.dropoff") &&
          item.telemetry?.status === "idle" &&
          item.telemetry.connectionStatus === "connected" &&
          item.telemetry.quality === "good" &&
          item.telemetry.freshness === "current" &&
          item.telemetry.nodeId !== null,
      ),
    [details.equipment],
  );

  const [state, setState] = useState<RequestState>("idle");
  const [created, setCreated] = useState<OutboundOrderAllocated | null>(null);
  const [sku, setSku] = useState(inventory[0]?.sku ?? "");
  const [destinationId, setDestinationId] = useState(
    destinations[0]?.locationId ?? "",
  );
  const [equipmentId, setEquipmentId] = useState(
    equipment[0]?.equipmentId ?? "",
  );
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [confirmationReason, setConfirmationReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const configurationReady =
    inventory.length > 0 && destinations.length > 0 && equipment.length > 0;

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;
    setError(null);
    setState("creating");
    idempotencyKey.current ??= crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/operations/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          externalReference: form.get("externalReference"),
          sku,
          quantity: Number(form.get("quantity")),
          destinationLocationId: destinationId,
        }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isOutboundOrderAllocated(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      setCreated(payload);
      setSelectedTaskId(payload.transportTaskIds[0] ?? "");
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("idle");
    }
  }

  async function executeTask() {
    if (!canExecute || !created || !selectedTaskId || !confirmed) return;
    setError(null);
    setState("executing");
    try {
      const response = await fetch(
        `/api/operations/outbound/${encodeURIComponent(
          selectedTaskId,
        )}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId,
            confirmedAction: "execute_outbound_task",
            confirmationReason,
          }),
        },
      );
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isOutboundExecutionCompleted(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      const nextCompleted = [...completedTaskIds, payload.taskId];
      const nextTask = created.transportTaskIds.find(
        (taskId) => !nextCompleted.includes(taskId),
      );
      setCompletedTaskIds(nextCompleted);
      setConfirmed(false);
      setConfirmationReason("");
      if (nextTask) {
        setSelectedTaskId(nextTask);
        setState("ready");
      } else {
        setState("complete");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("ready");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          {t("outboundRequest")}
        </p>
        <h2 className="mt-2 text-xl font-black">{t("outboundRequestTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t("outboundRequestDescription")}
        </p>
        {!configurationReady ? (
          <div
            role="status"
            className="mt-6 flex gap-3 rounded-lg bg-[var(--surface-muted)] p-4"
          >
            <ExclamationTriangleIcon
              className="h-5 w-5 shrink-0 text-[var(--warning)]"
              aria-hidden="true"
            />
            <p className="text-sm leading-6">
              {t("outboundConfigurationUnavailable")}
            </p>
          </div>
        ) : null}
        {!canCreate ? (
          <PermissionNotice>
            {t("outboundCreatePermissionRequired")}
          </PermissionNotice>
        ) : null}
        <form
          onSubmit={createOrder}
          onChange={() => {
            if (state === "idle") idempotencyKey.current = null;
          }}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              {t("externalReference")}
              <input
                name="externalReference"
                required
                maxLength={200}
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("sku")}
              <select
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                required
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              >
                {inventory.map((item) => (
                  <option key={item.sku} value={item.sku}>
                    {item.sku} · {item.quantity}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t("quantity")}
              <input
                name="quantity"
                type="number"
                required
                min="1"
                max={inventory.find((item) => item.sku === sku)?.quantity}
                step="1"
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("destinationLocation")}
              <select
                value={destinationId}
                onChange={(event) => setDestinationId(event.target.value)}
                required
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              >
                {destinations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={!canCreate || !configurationReady || state !== "idle"}
            className="ui-pressable rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "creating" ? t("creatingOutbound") : t("createOutbound")}
          </button>
        </form>
      </section>

      <aside
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6"
        aria-labelledby="outbound-confirmation-title"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          {t("confirmation")}
        </p>
        <h2
          id="outbound-confirmation-title"
          className="mt-2 text-xl font-black"
        >
          {t("reviewAndExecute")}
        </h2>
        {created ? (
          <div className="mt-5 space-y-5">
            <dl className="space-y-3 rounded-lg bg-[var(--surface-muted)] p-4 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">
                  {t("outboundOrder")}
                </dt>
                <dd className="mt-1 break-all font-mono font-semibold">
                  {created.outboundOrderId}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">
                  {t("allocatedTasks")}
                </dt>
                <dd className="mt-1 font-semibold">
                  {created.transportTaskIds.length}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">
                  {t("remainingTasks")}
                </dt>
                <dd className="mt-1 font-semibold">
                  {created.transportTaskIds.length - completedTaskIds.length}
                </dd>
              </div>
            </dl>
            {state === "complete" ? (
              <div
                role="status"
                className="rounded-lg border border-[color:color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_8%,var(--surface))] p-4"
              >
                <div className="flex gap-3">
                  <CheckCircleIcon
                    className="h-5 w-5 shrink-0 text-[var(--success)]"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-bold">{t("outboundCompleted")}</p>
                </div>
                <Link
                  href="/operations/projections"
                  className="mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                >
                  {t("viewInventoryOutcome")}
                </Link>
                {canViewAudit ? (
                  <>
                    <Link
                      href={`/operations/audit?resourceType=OutboundOrder&resourceId=${encodeURIComponent(
                        created.outboundOrderId,
                      )}`}
                      className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                    >
                      {t("viewOrderAuditEvidence")}
                    </Link>
                    {completedTaskIds.map((taskId) => (
                      <Link
                        key={taskId}
                        href={`/operations/audit?resourceType=TransportTask&resourceId=${encodeURIComponent(
                          taskId,
                        )}`}
                        className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                      >
                        {t("viewTaskAuditEvidence")} · {taskId.slice(0, 8)}
                      </Link>
                    ))}
                  </>
                ) : null}
              </div>
            ) : canExecute ? (
              <>
                <label className="block text-sm font-semibold">
                  {t("taskId")}
                  <select
                    value={selectedTaskId}
                    onChange={(event) => setSelectedTaskId(event.target.value)}
                    disabled={state === "executing"}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-mono font-normal"
                  >
                    {created.transportTaskIds
                      .filter((taskId) => !completedTaskIds.includes(taskId))
                      .map((taskId) => (
                        <option key={taskId} value={taskId}>
                          {taskId}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  {t("equipmentLabel")}
                  <select
                    value={equipmentId}
                    onChange={(event) => setEquipmentId(event.target.value)}
                    disabled={state === "executing"}
                    className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
                  >
                    {equipment.map((item) => (
                      <option key={item.equipmentId} value={item.equipmentId}>
                        {item.equipmentId} · {item.telemetry?.nodeId}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  {t("confirmationReason")}
                  <textarea
                    value={confirmationReason}
                    onChange={(event) =>
                      setConfirmationReason(event.target.value)
                    }
                    required
                    minLength={8}
                    maxLength={500}
                    rows={3}
                    disabled={state === "executing"}
                    className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
                  />
                </label>
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={state === "executing"}
                    className="mt-1 h-4 w-4"
                  />
                  <span>{t("confirmOutboundExecution")}</span>
                </label>
                <button
                  type="button"
                  onClick={() => void executeTask()}
                  disabled={
                    !confirmed ||
                    confirmationReason.trim().length < 8 ||
                    !equipmentId ||
                    state === "executing"
                  }
                  className="ui-pressable w-full rounded-lg bg-[var(--danger)] px-4 py-2.5 text-sm font-bold text-[var(--on-danger)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === "executing"
                    ? t("executingOutbound")
                    : t("executeOutbound")}
                </button>
              </>
            ) : (
              <PermissionNotice>
                {t("transportExecutePermissionRequired")}
              </PermissionNotice>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">
            {t("createOutboundBeforeExecute")}
          </p>
        )}
        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[color:color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_8%,var(--surface))] p-4 text-sm"
          >
            {error}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
