import { describe, expect, it } from "vitest";
import type {
  EquipmentObservationSink,
  EquipmentObservationWrite,
} from "../../src/application/equipment/equipment-observation-sink";
import { createMobileTransportDescriptor } from "../../src/domain/equipment/equipment-descriptor";
import { ObservationPublishingEquipmentPort } from "../../src/infrastructure/simulator/observation-publishing-equipment-port";
import { SimulatorEquipmentAdapter } from "../../src/infrastructure/simulator/simulator-equipment-adapter";
import { restoreSimulatorRegistration } from "../../src/infrastructure/simulator/simulator-restoration";

class MemoryObservationSink implements EquipmentObservationSink {
  readonly observations: EquipmentObservationWrite[] = [];
  ignoreNext = false;

  async publish(
    observation: EquipmentObservationWrite,
  ): Promise<"applied" | "ignored"> {
    if (this.ignoreNext) {
      this.ignoreNext = false;
      return "ignored";
    }
    this.observations.push(observation);
    return "applied";
  }
}

class PausingObservationSink extends MemoryObservationSink {
  readonly firstPublicationStarted: Promise<void>;
  #signalFirstPublicationStarted!: () => void;
  #releaseFirstPublication!: () => void;
  #first = true;

  constructor() {
    super();
    this.firstPublicationStarted = new Promise((resolve) => {
      this.#signalFirstPublicationStarted = resolve;
    });
  }

  releaseFirstPublication(): void {
    this.#releaseFirstPublication();
  }

  override async publish(
    observation: EquipmentObservationWrite,
  ): Promise<"applied" | "ignored"> {
    if (this.#first) {
      this.#first = false;
      this.#signalFirstPublicationStarted();
      await new Promise<void>((resolve) => {
        this.#releaseFirstPublication = resolve;
      });
    }
    return super.publish(observation);
  }
}

function runtime(sink: MemoryObservationSink) {
  const adapter = new SimulatorEquipmentAdapter();
  const initial = adapter.register(createMobileTransportDescriptor("AMR-01"), {
    status: "idle",
    nodeId: "RECEIVING-01",
    taskId: null,
    loadId: null,
    version: 0,
  });
  let now = Date.parse("2026-09-19T00:00:00.000Z");
  const observed = new ObservationPublishingEquipmentPort(
    adapter,
    sink,
    () => new Date(now++),
  );
  observed.track("AMR-01", 0, {
    topologyId: "TOPOLOGY-01",
    topologyRevision: 3,
    source: "test-simulator",
  });
  return { observed, initial };
}

describe("simulator equipment observation publication", () => {
  it("publishes current state rather than cached historical state on command replay", async () => {
    const sink = new MemoryObservationSink();
    const { observed } = runtime(sink);
    const assign = {
      commandId: "ASSIGN",
      equipmentId: "AMR-01",
      command: { type: "assign_task", taskId: "TASK-01" },
    } as const;
    await observed.dispatch(assign);
    await observed.dispatch({
      commandId: "START",
      equipmentId: "AMR-01",
      command: { type: "start_pickup" },
    });
    expect(await observed.dispatch(assign)).toMatchObject({
      duplicate: true,
      transition: { state: { status: "assigned" } },
    });
    expect(sink.observations.at(-1)).toMatchObject({
      status: "moving_to_pickup",
      taskId: "TASK-01",
      sequence: 3,
    });
  });
  it("publishes monotonic transition and heartbeat observations at observed nodes", async () => {
    const sink = new MemoryObservationSink();
    const { observed, initial } = runtime(sink);
    await observed.publish(initial);

    const commands = [
      { type: "assign_task", taskId: "TASK-01" },
      { type: "start_pickup" },
      { type: "arrive_at_pickup", nodeId: "RECEIVING-01" },
      { type: "complete_loading", loadId: "LOAD-01" },
      { type: "arrive_at_destination", nodeId: "STORAGE-A-01" },
      { type: "complete_unloading" },
    ] as const;
    for (const [index, command] of commands.entries()) {
      await observed.dispatch({
        commandId: `CMD-${index + 1}`,
        equipmentId: "AMR-01",
        command,
      });
    }
    await observed.heartbeat();
    await observed.disconnect();

    expect(sink.observations.map(({ sequence }) => sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(sink.observations[3]).toMatchObject({
      status: "loading",
      nodeId: "RECEIVING-01",
      taskId: "TASK-01",
    });
    expect(sink.observations[5]).toMatchObject({
      status: "unloading",
      nodeId: "STORAGE-A-01",
      loadId: "LOAD-01",
    });
    expect(sink.observations.at(-1)).toMatchObject({
      status: "idle",
      nodeId: "STORAGE-A-01",
      taskId: null,
      loadId: null,
      connectionStatus: "disconnected",
      quality: "unknown",
    });
  });

  it("does not advance its cursor when the durable sink rejects an out-of-order write", async () => {
    const sink = new MemoryObservationSink();
    const { observed, initial } = runtime(sink);
    sink.ignoreNext = true;

    await expect(observed.publish(initial)).rejects.toThrow("out of order");
    await observed.publish(initial);

    expect(sink.observations).toHaveLength(1);
    expect(sink.observations[0]?.sequence).toBe(1);
  });

  it("serializes a heartbeat racing with a state transition", async () => {
    const sink = new PausingObservationSink();
    const { observed, initial } = runtime(sink);

    const heartbeatPublication = observed.publish(initial);
    await sink.firstPublicationStarted;
    const transitionPublication = observed.publish(initial);
    sink.releaseFirstPublication();

    await Promise.all([heartbeatPublication, transitionPublication]);

    expect(sink.observations.map(({ sequence }) => sequence)).toEqual([1, 2]);
  });

  it("preserves the last certain simulator observation during a graceful API shutdown", async () => {
    const sink = new MemoryObservationSink();
    const adapter = new SimulatorEquipmentAdapter();
    const initial = adapter.register(
      createMobileTransportDescriptor("AMR-01"),
      {
        status: "idle",
        nodeId: "RECEIVING-01",
        taskId: null,
        loadId: null,
        version: 0,
      },
    );
    const observed = new ObservationPublishingEquipmentPort(
      adapter,
      sink,
      () => new Date("2026-09-19T00:00:00.000Z"),
      { disconnectOnDestroy: false },
    );
    observed.track("AMR-01", 0, {
      topologyId: "TOPOLOGY-01",
      topologyRevision: 3,
      source: "deterministic-simulator",
    });

    await observed.publish(initial);
    await observed.onModuleDestroy();

    expect(sink.observations).toHaveLength(1);
    expect(sink.observations[0]).toMatchObject({
      status: "idle",
      nodeId: "RECEIVING-01",
      connectionStatus: "connected",
      quality: "good",
    });
  });

  it("restores only trustworthy idle state and degrades unresolved restart state to unknown", () => {
    const topology = { id: "TOPOLOGY-01", revision: 3 };
    expect(
      restoreSimulatorRegistration(
        {
          status: "idle",
          taskId: null,
          loadId: null,
          topologyId: topology.id,
          topologyRevision: topology.revision,
          nodeId: "RECEIVING-01",
          connectionStatus: "connected",
          quality: "good",
        },
        topology,
      ),
    ).toMatchObject({ status: "idle", nodeId: "RECEIVING-01" });

    expect(
      restoreSimulatorRegistration(
        {
          status: "moving_to_destination",
          taskId: "TASK-01",
          loadId: "LOAD-01",
          topologyId: topology.id,
          topologyRevision: topology.revision,
          nodeId: "RECEIVING-01",
          connectionStatus: "connected",
          quality: "good",
        },
        topology,
      ),
    ).toMatchObject({
      status: "unknown",
      nodeId: "RECEIVING-01",
      taskId: "TASK-01",
      loadId: "LOAD-01",
    });

    expect(
      restoreSimulatorRegistration(
        {
          status: "idle",
          taskId: null,
          loadId: null,
          topologyId: "RETIRED-TOPOLOGY",
          topologyRevision: 1,
          nodeId: "OLD-NODE",
          connectionStatus: "connected",
          quality: "good",
        },
        topology,
      ),
    ).toMatchObject({ status: "unknown", nodeId: null });
  });
});
