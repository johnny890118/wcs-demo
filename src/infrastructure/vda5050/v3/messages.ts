export const vda5050Version = "3.0.0" as const;

export type Vda5050Node = Readonly<{
  nodeId: string;
  sequenceId: number;
  released: boolean;
  actions: readonly never[];
  nodePosition?: Readonly<{
    x: number;
    y: number;
    mapId: string;
  }>;
}>;

export type Vda5050Edge = Readonly<{
  edgeId: string;
  sequenceId: number;
  released: boolean;
  actions: readonly never[];
}>;

export type Vda5050Order = Readonly<{
  headerId: number;
  timestamp: string;
  version: typeof vda5050Version;
  manufacturer: string;
  serialNumber: string;
  orderId: string;
  orderUpdateId: number;
  nodes: readonly Vda5050Node[];
  edges: readonly Vda5050Edge[];
}>;

export const vda5050ConnectionStates = [
  "ONLINE",
  "OFFLINE",
  "HIBERNATING",
  "CONNECTION_BROKEN",
] as const;

export type Vda5050ConnectionState = (typeof vda5050ConnectionStates)[number];

export type Vda5050Connection = Readonly<{
  headerId: number;
  timestamp: string;
  version: typeof vda5050Version;
  manufacturer: string;
  serialNumber: string;
  connectionState: Vda5050ConnectionState;
}>;

export type Vda5050Topic =
  | "order"
  | "instantActions"
  | "state"
  | "visualization"
  | "connection"
  | "factsheet"
  | "zoneSet"
  | "responses";

export function vda5050Topic(
  manufacturer: string,
  serialNumber: string,
  topic: Vda5050Topic,
): string {
  for (const [name, value] of [
    ["manufacturer", manufacturer],
    ["serialNumber", serialNumber],
  ] as const) {
    if (!/^[A-Za-z0-9_.:-]+$/.test(value)) {
      throw new Error(`${name} contains characters unsafe for an MQTT topic.`);
    }
  }
  return `vda5050/v3/${manufacturer}/${serialNumber}/${topic}`;
}
