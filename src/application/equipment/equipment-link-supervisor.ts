import type { Clock } from "../time/clock";
import type { EquipmentState } from "../../domain/equipment/equipment-state-machine";

export type EquipmentLinkState = "connected" | "disconnected";
export type EquipmentObservation = Readonly<{
  equipmentId: string;
  state: EquipmentState;
  observedAt: number;
}>;
export type EquipmentLinkAssessment =
  | Readonly<{ status: "disconnected"; lastObservedAt: number | null }>
  | Readonly<{
      status: "stale";
      lastObservedAt: number;
      ageMs: number;
    }>
  | Readonly<{
      status: "current";
      lastObservedAt: number;
      ageMs: number;
      state: EquipmentState;
    }>;

export class EquipmentLinkSupervisor {
  readonly #observations = new Map<string, EquipmentObservation>();
  readonly #links = new Map<string, EquipmentLinkState>();

  constructor(
    private readonly clock: Clock,
    private readonly staleAfterMs: number,
  ) {
    if (!Number.isSafeInteger(staleAfterMs) || staleAfterMs < 1) {
      throw new Error("staleAfterMs must be a positive integer.");
    }
  }

  setConnection(equipmentId: string, state: EquipmentLinkState): void {
    this.#links.set(equipmentId, state);
  }

  observe(state: EquipmentState): EquipmentObservation {
    const observation = {
      equipmentId: state.equipmentId,
      state,
      observedAt: this.clock.now(),
    } as const;
    this.#observations.set(state.equipmentId, observation);
    return observation;
  }

  assess(equipmentId: string): EquipmentLinkAssessment {
    const observation = this.#observations.get(equipmentId);
    if (this.#links.get(equipmentId) !== "connected") {
      return {
        status: "disconnected",
        lastObservedAt: observation?.observedAt ?? null,
      };
    }
    if (!observation) return { status: "disconnected", lastObservedAt: null };
    const ageMs = this.clock.now() - observation.observedAt;
    if (ageMs > this.staleAfterMs) {
      return { status: "stale", lastObservedAt: observation.observedAt, ageMs };
    }
    return {
      status: "current",
      lastObservedAt: observation.observedAt,
      ageMs,
      state: observation.state,
    };
  }
}
