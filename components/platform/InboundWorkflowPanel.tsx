import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  isInboundExecutionCompleted,
  isInboundReceiptCreated,
  type InboundExecutionCompleted,
  type InboundReceiptCreated,
} from "../../src/application/operations/inbound-workflow";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { workPath } from "../../src/application/operations/work-projection";
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

export function InboundWorkflowPanel({
  details,
  canCreate,
  canExecute,
  canViewAudit,
}: Props) {
  const { t } = useLocale();
  const sources = useMemo(
    () =>
      details.locations.filter(
        (location) =>
          location.status === "available" &&
          location.activeNodeId !== null &&
          location.capabilities.includes("load.pickup"),
      ),
    [details.locations],
  );
  const destinations = useMemo(
    () =>
      details.locations.filter(
        (location) =>
          location.status === "available" &&
          location.activeNodeId !== null &&
          location.capabilities.includes("load.dropoff"),
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
  const [created, setCreated] = useState<InboundReceiptCreated | null>(null);
  const [requestContext, setRequestContext] = useState<{
    reference: string;
    sku: string;
    quantity: number;
    loadReference: string;
  } | null>(null);
  const [completed, setCompleted] = useState<InboundExecutionCompleted | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState(sources[0]?.locationId ?? "");
  const [destinationId, setDestinationId] = useState(
    destinations.find((item) => item.locationId !== sources[0]?.locationId)
      ?.locationId ?? "",
  );
  const [equipmentId, setEquipmentId] = useState(
    equipment[0]?.equipmentId ?? "",
  );
  const [confirmationReason, setConfirmationReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  const source = sources.find((item) => item.locationId === sourceId);
  const destination = destinations.find(
    (item) => item.locationId === destinationId,
  );

  async function createReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;
    setError(null);
    setState("creating");
    idempotencyKey.current ??= crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/operations/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.current,
          externalReference: form.get("externalReference"),
          sourceLocationId: sourceId,
          destinationLocationId: destinationId,
          load: {
            externalId: form.get("externalId"),
            sku: form.get("sku"),
            quantity: Number(form.get("quantity")),
          },
        }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isInboundReceiptCreated(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      setCreated(payload);
      setRequestContext({
        reference: String(form.get("externalReference") ?? ""),
        sku: String(form.get("sku") ?? ""),
        quantity: Number(form.get("quantity")),
        loadReference: String(form.get("externalId") ?? ""),
      });
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("idle");
    }
  }

  async function executeTask() {
    if (!canExecute || !created || !confirmed) return;
    setError(null);
    setState("executing");
    try {
      const response = await fetch(
        `/api/operations/inbound/${encodeURIComponent(
          created.transportTaskId,
        )}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            equipmentId,
            confirmedAction: "execute_inbound_task",
            confirmationReason,
          }),
        },
      );
      if (!response.ok) throw new Error(await errorMessage(response));
      const payload: unknown = await response.json();
      if (!isInboundExecutionCompleted(payload)) {
        throw new Error(t("invalidServerResponse"));
      }
      setCompleted(payload);
      setState("complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("requestFailed"));
      setState("ready");
    }
  }

  const configurationReady =
    sources.length > 0 && destinations.length > 0 && equipment.length > 0;
  const configurationIssues = [
    ...(sources.length === 0 ? [t("inboundSourceUnavailable")] : []),
    ...(destinations.length === 0 ? [t("inboundDestinationUnavailable")] : []),
    ...(equipment.length === 0 ? [t("inboundEquipmentUnavailable")] : []),
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("inboundRequest")}
        </p>
        <h2 className="mt-2 text-xl font-black">{t("inboundRequestTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t("inboundRequestDescription")}
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
            <div>
              <p className="text-sm font-semibold leading-6">
                {t("inboundConfigurationUnavailable")}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-muted)]">
                {configurationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {!canCreate ? (
          <PermissionNotice>
            {t("inboundCreatePermissionRequired")}
          </PermissionNotice>
        ) : null}

        <form
          onSubmit={createReceipt}
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
              {t("externalLoadId")}
              <input
                name="externalId"
                required
                maxLength={200}
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("sku")}
              <input
                name="sku"
                required
                maxLength={200}
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("quantity")}
              <input
                name="quantity"
                type="number"
                required
                min="1"
                step="1"
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              {t("sourceLocation")}
              <select
                value={sourceId}
                onChange={(event) => {
                  const nextSourceId = event.target.value;
                  setSourceId(nextSourceId);
                  if (destinationId === nextSourceId) {
                    setDestinationId(
                      destinations.find(
                        (item) => item.locationId !== nextSourceId,
                      )?.locationId ?? "",
                    );
                  }
                }}
                required
                disabled={!canCreate || state !== "idle"}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 font-normal"
              >
                {sources.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.code}
                  </option>
                ))}
              </select>
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
                {destinations
                  .filter((location) => location.locationId !== sourceId)
                  .map((location) => (
                    <option
                      key={location.locationId}
                      value={location.locationId}
                    >
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
            {state === "creating" ? t("creatingInbound") : t("createInbound")}
          </button>
        </form>
      </section>

      <aside
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-panel)] sm:p-6"
        aria-labelledby="inbound-confirmation-title"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("confirmation")}
        </p>
        <h2 id="inbound-confirmation-title" className="mt-2 text-xl font-black">
          {t("reviewAndExecute")}
        </h2>
        {created ? (
          <div className="mt-5 space-y-5">
            <Link
              href={workPath("inbound", created.receiptId)}
              className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 font-bold text-[var(--accent-strong)]"
            >
              {t("openWorkContext")}
            </Link>
            <dl className="space-y-3 rounded-lg bg-[var(--surface-muted)] p-4 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">
                  {t("submittedRequest")}
                </dt>
                <dd className="mt-1 break-words font-semibold">
                  {requestContext?.reference}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">
                  {t("requestedItemQuantity")}
                </dt>
                <dd className="mt-1 break-words font-semibold">
                  {requestContext?.sku} · {requestContext?.quantity}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("route")}</dt>
                <dd className="mt-1 font-semibold">
                  {source?.code ?? "—"} → {destination?.code ?? "—"}
                </dd>
              </div>
            </dl>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {t("requestContextNotice")}
            </p>
            <Link
              href={`/operations/tasks/${encodeURIComponent(
                created.transportTaskId,
              )}`}
              target={state === "complete" ? undefined : "_blank"}
              rel={state === "complete" ? undefined : "noopener noreferrer"}
              className="ui-pressable inline-flex min-h-11 items-center break-words rounded-md text-sm font-bold text-[var(--accent-strong)]"
            >
              {t("inspectCreatedTask")}
              {state !== "complete" ? ` · ${t("opensNewTab")}` : ""}
            </Link>
            <details className="border-t border-[var(--border)] pt-2">
              <summary className="ui-pressable min-h-11 cursor-pointer rounded-md py-2 text-sm font-semibold">
                {t("workflowReferences")}
              </summary>
              <dl className="space-y-2 break-all text-xs text-[var(--text-muted)]">
                <div>
                  <dt>{t("taskId")}</dt>
                  <dd>{created.transportTaskId}</dd>
                </div>
                <div>
                  <dt>{t("inventoryOrigin")}</dt>
                  <dd>{created.receiptId}</dd>
                </div>
                <div>
                  <dt>{t("workflowLoadReference")}</dt>
                  <dd>{created.loadId}</dd>
                </div>
                <div>
                  <dt>{t("externalLoadId")}</dt>
                  <dd>{requestContext?.loadReference}</dd>
                </div>
              </dl>
            </details>
            {state === "complete" && completed ? (
              <div
                role="status"
                className="rounded-lg border border-[color:color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_8%,var(--surface))] p-4"
              >
                <div className="flex gap-3">
                  <CheckCircleIcon
                    className="h-5 w-5 shrink-0 text-[var(--success)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-bold">{t("inboundCompleted")}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {completed.equipmentId} · {t("completed")}
                    </p>
                  </div>
                </div>
                <Link
                  href="/operations/warehouse"
                  className="mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                >
                  {t("liveView")}
                </Link>
                {canViewAudit ? (
                  <>
                    <Link
                      href={`/operations/audit?resourceType=TransportTask&resourceId=${encodeURIComponent(
                        completed.taskId,
                      )}`}
                      className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                    >
                      {t("viewTaskAuditEvidence")}
                    </Link>
                    <Link
                      href={`/operations/audit?resourceType=InboundReceipt&resourceId=${encodeURIComponent(
                        created.receiptId,
                      )}`}
                      className="ml-4 mt-4 inline-flex text-sm font-bold text-[var(--accent-strong)] underline underline-offset-4"
                    >
                      {t("viewReceiptAuditEvidence")}
                    </Link>
                  </>
                ) : null}
              </div>
            ) : canExecute ? (
              <>
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
                  <span>{t("confirmInboundExecution")}</span>
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
                    ? t("executingInbound")
                    : t("executeInbound")}
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
            {t("createBeforeExecute")}
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
