import type { EquipmentPort } from "../equipment/equipment-port";
import type { Clock } from "../time/clock";

export type LegacyKernelSnapshot = Readonly<{
  schemaVersion: 1;
  mode: "simulator";
  capturedAt: number;
  capabilities: Readonly<{
    observe: true;
    command: false;
  }>;
  equipment: ReadonlyArray<
    Readonly<{
      equipmentId: string;
      status: string;
      taskId: string | null;
      loadId: string | null;
      faultCode: string | null;
      version: number;
    }>
  >;
  transportTasks: ReadonlyArray<never>;
  alarms: ReadonlyArray<never>;
}>;

export class LegacyKernelFacade {
  constructor(
    private readonly equipmentPort: EquipmentPort,
    private readonly equipmentIds: readonly string[],
    private readonly clock: Clock,
  ) {}

  async getSnapshot(): Promise<LegacyKernelSnapshot> {
    const equipment = (
      await Promise.all(
        this.equipmentIds.map((equipmentId) =>
          this.equipmentPort.getState(equipmentId),
        ),
      )
    ).filter((state) => state !== null);

    return {
      schemaVersion: 1,
      mode: "simulator",
      capturedAt: this.clock.now(),
      capabilities: {
        observe: true,
        command: false,
      },
      equipment: equipment.map((state) => ({
        equipmentId: state.equipmentId,
        status: state.status,
        taskId: state.taskId,
        loadId: state.loadId,
        faultCode: state.faultCode,
        version: state.version,
      })),
      transportTasks: [],
      alarms: [],
    };
  }
}
