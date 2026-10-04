import type {
  EquipmentCommandEnvelope,
  EquipmentCommandResult,
  EquipmentPort,
} from "../../application/equipment/equipment-port";
import {
  observationFromState,
  type EquipmentObservationContext,
  type EquipmentObservationSink,
} from "../../application/equipment/equipment-observation-sink";
import type { EquipmentDescriptor } from "../../domain/equipment/equipment-descriptor";
import type { EquipmentState } from "../../domain/equipment/equipment-state-machine";

export class ObservationSequenceConflict extends Error {
  constructor(equipmentId: string, sequence: number) {
    super(
      `Observation sequence ${sequence} for ${equipmentId} was rejected as out of order.`,
    );
    this.name = "ObservationSequenceConflict";
  }
}

export class ObservationPublishingEquipmentPort implements EquipmentPort {
  readonly #sequences = new Map<string, number>();
  readonly #equipmentIds = new Set<string>();
  readonly #contexts = new Map<string, EquipmentObservationContext>();
  readonly #publicationTails = new Map<string, Promise<void>>();
  #heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  #heartbeatInFlight = false;

  constructor(
    private readonly inner: EquipmentPort,
    private readonly sink: EquipmentObservationSink,
    private readonly now: () => Date = () => new Date(),
    private readonly lifecycle: Readonly<{
      disconnectOnDestroy?: boolean;
    }> = {},
  ) {}

  track(
    equipmentId: string,
    lastSequence: number,
    context: EquipmentObservationContext,
  ): void {
    if (!Number.isSafeInteger(lastSequence) || lastSequence < -1) {
      throw new Error("lastSequence must be a safe integer of -1 or greater.");
    }
    if ((context.topologyId === null) !== (context.topologyRevision === null)) {
      throw new Error("Topology identity must be fully present or fully null.");
    }
    if (context.source.trim().length === 0) {
      throw new Error("Observation source must not be empty.");
    }
    this.#equipmentIds.add(equipmentId);
    this.#sequences.set(equipmentId, lastSequence);
    this.#contexts.set(equipmentId, context);
  }

  getDescriptor(equipmentId: string): Promise<EquipmentDescriptor | null> {
    return this.inner.getDescriptor(equipmentId);
  }

  getState(equipmentId: string): Promise<EquipmentState | null> {
    return this.inner.getState(equipmentId);
  }

  async dispatch(
    envelope: EquipmentCommandEnvelope,
  ): Promise<EquipmentCommandResult> {
    const result = await this.inner.dispatch(envelope);
    if (result.transition.accepted) {
      // An idempotent result describes the original command, not necessarily
      // the current state. Never timestamp cached historical state as telemetry.
      const state = result.duplicate
        ? await this.inner.getState(envelope.equipmentId)
        : result.transition.state;
      if (!state) throw new Error("Current equipment state is unavailable.");
      await this.publish(state);
    }
    return result;
  }

  async heartbeat(): Promise<void> {
    const states = await Promise.all(
      [...this.#equipmentIds].map((equipmentId) =>
        this.inner.getState(equipmentId),
      ),
    );
    await Promise.all(
      states
        .filter((state) => state !== null)
        .map((state) => this.publish(state)),
    );
  }

  async disconnect(): Promise<void> {
    const states = await Promise.all(
      [...this.#equipmentIds].map((equipmentId) =>
        this.inner.getState(equipmentId),
      ),
    );
    await Promise.all(
      states
        .filter((state) => state !== null)
        .map((state) => this.publish(state, "disconnected", "unknown")),
    );
  }

  startHeartbeat(intervalMs: number, onError: (error: unknown) => void): void {
    if (!Number.isSafeInteger(intervalMs) || intervalMs < 1) {
      throw new Error("Heartbeat interval must be a positive integer.");
    }
    if (this.#heartbeatTimer) {
      throw new Error("Heartbeat is already running.");
    }
    this.#heartbeatTimer = setInterval(() => {
      if (this.#heartbeatInFlight) return;
      this.#heartbeatInFlight = true;
      void this.heartbeat()
        .catch(onError)
        .finally(() => {
          this.#heartbeatInFlight = false;
        });
    }, intervalMs);
    this.#heartbeatTimer.unref();
  }

  stopHeartbeat(): void {
    if (this.#heartbeatTimer) clearInterval(this.#heartbeatTimer);
    this.#heartbeatTimer = null;
  }

  async onModuleDestroy(): Promise<void> {
    this.stopHeartbeat();
    if (this.lifecycle.disconnectOnDestroy !== false) {
      await this.disconnect();
    }
  }

  async publish(
    state: EquipmentState,
    connectionStatus: "connected" | "disconnected" = "connected",
    quality: "good" | "uncertain" | "bad" | "unknown" = state.status ===
    "unknown"
      ? "unknown"
      : "good",
  ): Promise<void> {
    const previousPublication =
      this.#publicationTails.get(state.equipmentId) ?? Promise.resolve();
    const publication = previousPublication
      .catch(() => undefined)
      .then(() => this.publishNext(state, connectionStatus, quality));
    this.#publicationTails.set(state.equipmentId, publication);

    try {
      await publication;
    } finally {
      if (this.#publicationTails.get(state.equipmentId) === publication) {
        this.#publicationTails.delete(state.equipmentId);
      }
    }
  }

  private async publishNext(
    state: EquipmentState,
    connectionStatus: "connected" | "disconnected",
    quality: "good" | "uncertain" | "bad" | "unknown",
  ): Promise<void> {
    const previous = this.#sequences.get(state.equipmentId);
    const context = this.#contexts.get(state.equipmentId);
    if (previous === undefined || !context) {
      throw new Error(`Equipment ${state.equipmentId} is not tracked.`);
    }
    const sequence = previous + 1;
    if (!Number.isSafeInteger(sequence)) {
      throw new Error(
        `Observation sequence overflow for ${state.equipmentId}.`,
      );
    }
    const result = await this.sink.publish(
      observationFromState(
        state,
        context,
        sequence,
        this.now(),
        connectionStatus,
        quality,
      ),
    );
    if (result === "ignored") {
      throw new ObservationSequenceConflict(state.equipmentId, sequence);
    }
    this.#sequences.set(state.equipmentId, sequence);
  }
}
