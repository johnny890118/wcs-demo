import type { Clock } from "../../application/time/clock";
import type {
  EquipmentCommandEnvelope,
  EquipmentCommandResult,
  EquipmentPort,
} from "../../application/equipment/equipment-port";
import type { EquipmentDescriptor } from "../../domain/equipment/equipment-descriptor";
import type { EquipmentState } from "../../domain/equipment/equipment-state-machine";

export const equipmentTraceVersion = 1;

export type EquipmentTraceEvent =
  | Readonly<{
      sequence: number;
      at: number;
      kind: "descriptor-read";
      equipmentId: string;
      descriptor: EquipmentDescriptor | null;
    }>
  | Readonly<{
      sequence: number;
      at: number;
      kind: "state-read";
      equipmentId: string;
      state: EquipmentState | null;
    }>
  | Readonly<{
      sequence: number;
      at: number;
      kind: "command";
      envelope: EquipmentCommandEnvelope;
      result?: EquipmentCommandResult;
      error?: { name: string; message: string };
    }>;

export type EquipmentTrace = Readonly<{
  version: typeof equipmentTraceVersion;
  adapterKey: string;
  events: readonly EquipmentTraceEvent[];
}>;

export class RecordingEquipmentAdapter implements EquipmentPort {
  readonly #events: EquipmentTraceEvent[] = [];
  #sequence = 0;

  constructor(
    private readonly adapterKey: string,
    private readonly inner: EquipmentPort,
    private readonly clock: Clock,
  ) {}

  async getDescriptor(
    equipmentId: string,
  ): Promise<EquipmentDescriptor | null> {
    const descriptor = await this.inner.getDescriptor(equipmentId);
    this.#events.push({
      sequence: this.#sequence++,
      at: this.clock.now(),
      kind: "descriptor-read",
      equipmentId,
      descriptor: clone(descriptor),
    });
    return descriptor;
  }

  async getState(equipmentId: string): Promise<EquipmentState | null> {
    const state = await this.inner.getState(equipmentId);
    this.#events.push({
      sequence: this.#sequence++,
      at: this.clock.now(),
      kind: "state-read",
      equipmentId,
      state: clone(state),
    });
    return state;
  }

  async dispatch(
    envelope: EquipmentCommandEnvelope,
  ): Promise<EquipmentCommandResult> {
    try {
      const result = await this.inner.dispatch(envelope);
      this.#events.push({
        sequence: this.#sequence++,
        at: this.clock.now(),
        kind: "command",
        envelope: clone(envelope),
        result: clone(result),
      });
      return result;
    } catch (error) {
      const normalized =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: "Error", message: "Unknown adapter failure." };
      this.#events.push({
        sequence: this.#sequence++,
        at: this.clock.now(),
        kind: "command",
        envelope: clone(envelope),
        error: normalized,
      });
      throw error;
    }
  }

  trace(): EquipmentTrace {
    return clone({
      version: equipmentTraceVersion,
      adapterKey: this.adapterKey,
      events: this.#events,
    });
  }
}

export async function replayEquipmentTrace(
  trace: EquipmentTrace,
  target: EquipmentPort,
): Promise<void> {
  if (trace.version !== equipmentTraceVersion) {
    throw new Error(`Unsupported equipment trace version ${trace.version}.`);
  }
  for (const event of trace.events) {
    if (event.kind !== "command") continue;
    try {
      const actual = await target.dispatch(event.envelope);
      if (
        !event.result ||
        JSON.stringify(actual) !== JSON.stringify(event.result)
      ) {
        throw new Error(`Trace diverged at sequence ${event.sequence}.`);
      }
    } catch (error) {
      if (!event.error || errorMessage(error) !== event.error.message) {
        throw new Error(`Trace diverged at sequence ${event.sequence}.`);
      }
    }
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown adapter failure.";
}
