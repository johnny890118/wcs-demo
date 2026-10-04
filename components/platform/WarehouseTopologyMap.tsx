import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { projectSpatialReadContext } from "../../src/application/operations/spatial-read-context";
import { SpatialReadNotice } from "./SpatialReadNotice";
import { topologyNodeContext } from "../../src/ui/warehouse/topology-node-context";
import {
  buildTopologyLayout,
  insetEdgeSegment,
  topologyCanvas,
} from "../../src/ui/warehouse/topology-layout";

type Props = Readonly<{
  details: OperationsDetails;
  projectionCurrent?: boolean;
}>;

const activeTaskStatuses = new Set([
  "requested",
  "planned",
  "queued",
  "assigned",
  "in_progress",
  "executing",
  "blocked",
  "faulted",
  "unknown",
]);

function shortLabel(value: string): string {
  return value.length > 18 ? `${value.slice(0, 15)}…` : value;
}

export function WarehouseTopologyMap({
  details,
  projectionCurrent = true,
}: Props) {
  const { t } = useLocale();
  const topology = details.topology;
  const layout = useMemo(
    () => (topology ? buildTopologyLayout(topology) : null),
    [topology],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!topology || !layout) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-panel)]">
        <h2 className="text-lg font-bold">{t("warehouseMap")}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("noTopology")}
        </p>
      </section>
    );
  }

  const effectiveSelectedNodeId = topology.nodes.some(
    (node) => node.nodeId === selectedNodeId,
  )
    ? selectedNodeId
    : topology.nodes[0]?.nodeId ?? null;
  const points = new Map(layout.nodes.map((item) => [item.node.nodeId, item]));
  const selected = topology.nodes.find(
    (node) => node.nodeId === effectiveSelectedNodeId,
  );
  const activeTasks = details.tasks.filter((task) =>
    activeTaskStatuses.has(task.status),
  );
  const selectedContext = topologyNodeContext(details, selected?.nodeId ?? "");
  const selectedTasks = selectedContext.tasks;
  const blockedEdges = topology.edges.filter(
    (edge) => edge.status === "blocked",
  ).length;
  const positionedEquipment = details.equipment.filter((item) => {
    const telemetry = item.telemetry;
    return (
      telemetry?.topologyId === topology.topologyId &&
      telemetry.topologyRevision === topology.revision &&
      telemetry.nodeId !== null &&
      points.has(telemetry.nodeId)
    );
  });
  const selectedEquipment = selected
    ? positionedEquipment.filter(
        (item) => item.telemetry?.nodeId === selected.nodeId,
      )
    : [];

  return (
    <section aria-labelledby="warehouse-map-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            {t("warehouseMap")}
          </p>
          <h1
            id="warehouse-map-title"
            className="mt-2 text-3xl font-black tracking-[-0.03em]"
          >
            {t("warehouseMapTitle")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            {t("warehouseMapDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
            {t("revision")} {topology.revision}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
            {layout.mode === "configured"
              ? t("configuredLayout")
              : t("schematicLayout")}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <SpatialReadNotice context={projectSpatialReadContext(topology)} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t("topologyNodes"), topology.nodes.length],
          [t("availableRoutes"), topology.edges.length - blockedEdges],
          [t("blockedRoutes"), blockedEdges],
          [t("activeWork"), activeTasks.length],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-panel)]"
          >
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-bold">{t("activeTopology")}</h2>
            <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
              {topology.topologyId}
              {layout.coordinateSystem
                ? ` · ${layout.coordinateSystem}`
                : ` · ${t("noPresentationCoordinates")}`}
            </p>
          </div>
          <div
            aria-label={t("mapLegend")}
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-0.5 w-6 bg-[var(--accent-strong)]"
                aria-hidden="true"
              />
              {t("availablePath")}
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-0.5 w-6 border-t-2 border-dashed border-[var(--danger)]"
                aria-hidden="true"
              />
              {t("blockedPath")}
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm bg-[var(--success)]"
                aria-hidden="true"
              />
              {t("currentEquipment")}
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm bg-[var(--warning)]"
                aria-hidden="true"
              />
              {t("lastKnownEquipment")}
            </span>
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="relative min-h-[22rem] overflow-hidden bg-[var(--surface-raised)]">
            <svg
              viewBox={`0 0 ${topologyCanvas.width} ${topologyCanvas.height}`}
              className="block h-full min-h-[22rem] w-full"
              role="img"
              aria-labelledby="topology-visual-title topology-visual-description"
            >
              <title id="topology-visual-title">{t("warehouseMapTitle")}</title>
              <desc id="topology-visual-description">
                {t("visualizationOnly")}
              </desc>
              <defs>
                <pattern
                  id="warehouse-grid"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                    opacity="0.42"
                  />
                </pattern>
                <marker
                  id="edge-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                </marker>
              </defs>
              <rect
                width={topologyCanvas.width}
                height={topologyCanvas.height}
                fill="url(#warehouse-grid)"
              />

              {topology.edges.map((edge) => {
                const from = points.get(edge.fromNodeId);
                const to = points.get(edge.toNodeId);
                if (!from || !to) return null;
                const isBlocked = edge.status === "blocked";
                const segment = insetEdgeSegment(from, to);
                return (
                  <line
                    key={edge.edgeId}
                    x1={segment.x1}
                    y1={segment.y1}
                    x2={segment.x2}
                    y2={segment.y2}
                    stroke={
                      isBlocked ? "var(--danger)" : "var(--accent-strong)"
                    }
                    strokeWidth={isBlocked ? 4 : 3}
                    strokeDasharray={isBlocked ? "10 8" : undefined}
                    strokeLinecap="round"
                    markerEnd="url(#edge-arrow)"
                    opacity={1}
                  >
                    <title>{`${edge.edgeId}: ${edge.fromNodeId} → ${edge.toNodeId} · ${edge.status}`}</title>
                  </line>
                );
              })}

              {layout.nodes.map(({ node, x, y }) => {
                const isSelected = node.nodeId === effectiveSelectedNodeId;
                const context = topologyNodeContext(details, node.nodeId);
                const taskCount = context.tasks.length;
                return (
                  <g key={node.nodeId}>
                    {isSelected ? (
                      <circle
                        cx={x}
                        cy={y}
                        r="39"
                        fill="none"
                        stroke="var(--focus)"
                        strokeWidth="4"
                      />
                    ) : null}
                    <circle
                      cx={x}
                      cy={y}
                      r="28"
                      fill="var(--surface)"
                      stroke="var(--border-strong)"
                      strokeWidth="3"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill={
                        node.kind === "storage"
                          ? "var(--accent-strong)"
                          : node.kind === "shipping"
                            ? "var(--warning)"
                            : "var(--focus)"
                      }
                    />
                    <text
                      x={x}
                      y={y + 50}
                      textAnchor="middle"
                      fill="var(--text)"
                      fontSize="16"
                      fontWeight="700"
                    >
                      {shortLabel(node.nodeId)}
                    </text>
                    <text
                      x={x}
                      y={y + 69}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="13"
                    >
                      {node.kind}
                      {taskCount > 0 ? ` · ${taskCount}×` : ""}
                    </text>
                    <title>{`${node.nodeId} · ${node.kind}`}</title>
                  </g>
                );
              })}

              {positionedEquipment.map((item, index) => {
                const telemetry = item.telemetry;
                if (!telemetry?.nodeId) return null;
                const point = points.get(telemetry.nodeId);
                if (!point) return null;
                const isCurrent =
                  projectionCurrent &&
                  item.active &&
                  telemetry.connectionStatus === "connected" &&
                  telemetry.freshness === "current" &&
                  telemetry.quality === "good";
                const markerX = point.x + 38 + (index % 3) * 8;
                const markerY = point.y - 38 - (index % 3) * 8;
                return (
                  <g key={item.equipmentId}>
                    <rect
                      x={markerX - 9}
                      y={markerY - 9}
                      width="18"
                      height="18"
                      rx="4"
                      fill={
                        telemetry.quality === "bad"
                          ? "var(--danger)"
                          : isCurrent && telemetry.quality === "good"
                            ? "var(--success)"
                            : "var(--warning)"
                      }
                      stroke="var(--surface)"
                      strokeWidth="3"
                    />
                    <text
                      x={markerX + 15}
                      y={markerY + 5}
                      fill="var(--text)"
                      fontSize="13"
                      fontWeight="700"
                    >
                      {shortLabel(item.equipmentId)}
                    </text>
                    <title>{`${item.equipmentId} · ${telemetry.status} · ${
                      isCurrent ? t("currentTelemetry") : t("staleTelemetry")
                    }`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          <aside className="border-t border-[var(--border)] p-5 xl:border-l xl:border-t-0">
            <h2 className="text-sm font-bold">{t("selectedNode")}</h2>
            <div
              className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto"
              aria-label={t("selectNode")}
            >
              {topology.nodes.map((node) => (
                <button
                  key={node.nodeId}
                  type="button"
                  aria-pressed={node.nodeId === effectiveSelectedNodeId}
                  onClick={() => setSelectedNodeId(node.nodeId)}
                  className={`ui-pressable rounded-lg border px-2.5 py-2 text-left font-mono text-xs font-semibold ${
                    node.nodeId === effectiveSelectedNodeId
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)]"
                  }`}
                >
                  {node.nodeId}
                </button>
              ))}
            </div>

            {selected ? (
              <div className="mt-5 space-y-5" aria-live="polite">
                <div>
                  <p className="font-mono text-sm font-bold">
                    {selected.nodeId}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {selected.kind}
                    {selected.position
                      ? ` · (${selected.position.x}, ${selected.position.y})`
                      : ` · ${t("noPresentationCoordinates")}`}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                    <dt className="text-[11px] text-[var(--text-muted)]">
                      {t("inventoryAtNode")}
                    </dt>
                    <dd className="mt-1 text-lg font-black tabular-nums">
                      {selectedContext.stockRecords}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-[var(--surface-muted)] p-3">
                    <dt className="text-[11px] text-[var(--text-muted)]">
                      {t("taskEndpointsAtNode")}
                    </dt>
                    <dd className="mt-1 text-lg font-black tabular-nums">
                      {selectedTasks.length}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs leading-6 text-[var(--text-muted)]">
                  {t("topologyRecordCaveat")}
                </p>
                <div>
                  <h3 className="text-xs font-bold">
                    {t("topologyBoundLocations")}
                  </h3>
                  <p className="mt-2 break-words text-sm">
                    {selectedContext.locations
                      .map((location) => location.code)
                      .join(" · ") || t("topologyUnbound")}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-bold">{t("nodeCapabilities")}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.capabilities.length ? (
                      selected.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="rounded-md bg-[var(--surface-muted)] px-2 py-1 font-mono text-[11px] text-[var(--text-muted)]"
                        >
                          {capability}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">
                        —
                      </span>
                    )}
                  </div>
                </div>
                {selectedEquipment.length ? (
                  <div>
                    <h3 className="text-xs font-bold">{t("equipmentLabel")}</h3>
                    <ul className="mt-2 space-y-2">
                      {selectedEquipment.map((item) => (
                        <li
                          key={item.equipmentId}
                          className="rounded-lg border border-[var(--border)] p-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold">
                              {item.equipmentId}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {projectionCurrent &&
                              item.active &&
                              item.telemetry?.connectionStatus ===
                                "connected" &&
                              item.telemetry.freshness === "current" &&
                              item.telemetry.quality === "good"
                                ? t("currentTelemetry")
                                : t("staleTelemetry")}
                            </span>
                          </div>
                          <p className="mt-1 text-[var(--text-muted)]">
                            {item.telemetry?.status} · {t("observationQuality")}
                            : {item.telemetry?.quality}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selectedTasks.length ? (
                  <ul className="space-y-2" aria-label={t("activeWork")}>
                    {selectedTasks.map((task) => (
                      <li
                        key={task.taskId}
                        className="rounded-lg border border-[var(--border)] p-3 text-xs"
                      >
                        <p className="font-mono font-semibold">{task.taskId}</p>
                        <p className="mt-1 text-[var(--text-muted)]">
                          {task.status} ·{" "}
                          {selectedContext.locations.some(
                            (location) => location.code === task.source,
                          )
                            ? t("sourceEndpoint")
                            : t("destinationEndpoint")}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("noNodeActivity")}
                  </p>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {details.equipment.length > 0 &&
      positionedEquipment.length === details.equipment.length ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--text-muted)]">
          <span className="font-bold text-[var(--text)]">
            {t("equipmentPositionsFromTelemetry")}
          </span>{" "}
          {t("visualizationOnly")}
        </p>
      ) : (
        <div className="mt-4 flex gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_8%,var(--surface))] p-4">
          <ExclamationTriangleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-bold">
              {positionedEquipment.length > 0
                ? t("equipmentPositionPartial")
                : t("equipmentPositionUnavailable")}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              {positionedEquipment.length > 0
                ? t("equipmentPositionPartialDescription")
                : t("equipmentPositionUnavailableDescription")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
