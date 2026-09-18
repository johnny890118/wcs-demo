import type { EquipmentLinkSupervisor } from "../../../application/equipment/equipment-link-supervisor";
import type { RoutePlan } from "../../../domain/topology/route-planner";
import type { WarehouseTopology } from "../../../domain/topology/warehouse-topology";
import {
  vda5050ConnectionStates,
  vda5050Topic,
  vda5050Version,
  type Vda5050Connection,
  type Vda5050Order,
} from "./messages";
import {
  mapRoutePlanToVda5050Order,
  type Vda5050OrderIdentity,
} from "./order-mapper";

export interface Vda5050MessageBus {
  publish(
    topic: string,
    payload: unknown,
    options: Readonly<{ qos: 0 | 1; retain: boolean }>,
  ): Promise<void>;
}

export class Vda5050OrderPublisher {
  constructor(private readonly bus: Vda5050MessageBus) {}

  async publish(
    topology: WarehouseTopology,
    plan: RoutePlan,
    identity: Vda5050OrderIdentity,
  ): Promise<Vda5050Order> {
    const order = mapRoutePlanToVda5050Order(topology, plan, identity);
    await this.bus.publish(
      vda5050Topic(identity.manufacturer, identity.serialNumber, "order"),
      order,
      { qos: 0, retain: false },
    );
    return order;
  }
}

export class Vda5050ConnectionConsumer {
  readonly #lastHeaderByEquipment = new Map<string, number>();
  readonly #identities = new Map<
    string,
    Readonly<{ manufacturer: string; serialNumber: string }>
  >();

  constructor(
    private readonly supervisor: EquipmentLinkSupervisor,
    identities: readonly Readonly<{
      equipmentId: string;
      manufacturer: string;
      serialNumber: string;
    }>[],
  ) {
    for (const identity of identities) {
      if (this.#identities.has(identity.equipmentId)) {
        throw new Error(`Duplicate VDA identity for ${identity.equipmentId}.`);
      }
      this.#identities.set(identity.equipmentId, identity);
    }
  }

  consume(equipmentId: string, message: Vda5050Connection): void {
    const identity = this.#identities.get(equipmentId);
    if (!identity) throw new Error(`Unknown VDA equipment ${equipmentId}.`);
    if (
      message.manufacturer !== identity.manufacturer ||
      message.serialNumber !== identity.serialNumber
    ) {
      throw new Error("VDA 5050 message identity does not match equipment.");
    }
    if (message.version !== vda5050Version) {
      throw new Error(`Unsupported VDA 5050 version ${message.version}.`);
    }
    if (!vda5050ConnectionStates.includes(message.connectionState)) {
      throw new Error("Unknown VDA 5050 connection state.");
    }
    if (!Number.isSafeInteger(message.headerId) || message.headerId < 0) {
      throw new Error("VDA 5050 connection headerId must be non-negative.");
    }
    if (!Number.isFinite(Date.parse(message.timestamp))) {
      throw new Error("VDA 5050 connection timestamp is invalid.");
    }
    const previous = this.#lastHeaderByEquipment.get(equipmentId);
    if (previous !== undefined && message.headerId <= previous) {
      throw new Error(
        "VDA 5050 connection headerId must increase monotonically.",
      );
    }
    this.#lastHeaderByEquipment.set(equipmentId, message.headerId);
    this.supervisor.setConnection(
      equipmentId,
      message.connectionState === "ONLINE" ? "connected" : "disconnected",
    );
  }
}
