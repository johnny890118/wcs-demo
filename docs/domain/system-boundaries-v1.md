# System Boundaries v1

## Research-backed model

ISA-95 separates business planning/logistics from operations management and control. MHI describes WMS as managing inventory and warehouse fulfillment processes and WCS as controlling automated material-handling equipment. Dematic further distinguishes WES as the layer that dynamically releases and balances work. For this product, WES is not a separate deployable system in MVP; the small amount of execution optimization needed belongs to the WCS application layer and remains an extractable module.

## Ownership

| Context           | Owns                                                                                               | Does not own                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| WMS Lite          | Orders, receipts, loads, inventory, locations, allocation, warehouse requests                      | Device commands, vendor protocols, equipment telemetry                       |
| Topology          | Versioned warehouse graph, directed connectivity, resource references, configuration validation    | Live traffic decisions, UI renderer structures, vendor wire formats          |
| WCS               | Transport tasks, routing, scheduling, assignment, execution state, command intent, recovery policy | Financial/order master data, raw protocol implementation, safety-rated logic |
| Equipment         | Capability, availability, reported state, command/result contract                                  | Warehouse inventory truth, order priority                                    |
| Simulator adapter | Deterministic virtual equipment behavior and telemetry                                             | Special-case domain rules or fake random dashboards                          |
| Hardware adapter  | Protocol/vendor translation, connection health, command acknowledgement                            | Business allocation and scheduling policy                                    |
| Alarm management  | Actionable abnormal-condition lifecycle and operator response                                      | Debug logs or every informational event                                      |
| Identity/access   | Principal, effective permissions, warehouse scope, session lifecycle, role templates               | Protocol credentials, safety authority, role-name conditionals               |

## Core flow

```text
Inbound / outbound intent
        |
        v
WMS Lite warehouse request
        |
        v
WCS transport task -> routing -> assignment -> command intent
        |                                      |
        |                                      v
        |                              EquipmentPort contract
        |                                /              \
        |                     SimulatorAdapter      HardwareAdapter
        |                                              |
        v                                              v
Inventory confirmation                         OPC UA / MQTT /
only after physical outcome                     Modbus / REST / vendor
```

## Key aggregates and identifiers

- `Warehouse`, `Location`, `Load`, `InventoryUnit`, `InboundReceipt`, `OutboundOrder`, `Allocation`
- `TransportRequest`, `TransportTask`, `Route`, `EquipmentAssignment`, `EquipmentCommand`
- `Equipment`, `EquipmentCapability`, `EquipmentState`, `Alarm`, `AuditEvent`
- Internal UUIDs are stable. External WMS and vendor identifiers are aliases, not primary identities.

## Initial lifecycle language

### Transport task

`requested -> planned -> assigned -> executing -> completed`

Exceptional states: `blocked`, `faulted`, `cancelled`, `failed`, `unknown`. Transitions are explicit and persisted. Retrying a request requires an idempotency key.

### Equipment

`offline -> idle -> assigned -> moving_to_pickup -> loading -> moving_to_destination -> unloading -> idle`

`faulted` and `unknown` are explicit states. Recovery is a command/workflow, not a UI-only toggle.

### Command result

`pending -> acknowledged -> executing -> succeeded | failed | timed_out | unknown`

Timeout does not imply device failure, and connection loss does not imply success.

## Invariants

- One active assignment per equipment unless its capability explicitly supports concurrency.
- A load cannot occupy two locations simultaneously.
- Reserved inventory cannot be allocated to another order without an explicit release/override.
- Inventory changes are confirmed by an accepted domain event; browser state is never inventory truth.
- Only available, capable equipment may be assigned.
- A fault makes equipment unavailable until the recovery policy completes.
- Alarm acknowledgement records awareness; it does not clear the underlying fault.
- Emergency stop and safety interlocks remain equipment/safety-system responsibilities. The platform may request or display them but does not claim safety certification.
- Warehouse-specific connectivity and constraints are persisted configuration, never React/SVG/Canvas structure.
- A route plan is valid only for its recorded topology version and evaluated runtime constraints.
- Equipment assignment requires declared capabilities compatible with the task and selected route.
- Coordinates may assist rendering or heuristics but do not establish graph connectivity or inventory location.

## Integration posture

VDA 5050 is a relevant candidate for mobile-robot adapters because it defines order/status exchange between a master control and heterogeneous vehicles. OPC UA and MQTT are relevant infrastructure options. None is the domain contract: adapters map them to versioned internal commands, telemetry, capabilities, and outcomes.

Simulation and Hardware select adapters per configured equipment registration. The current deployment may run the deterministic simulator in the API process; future Hybrid commissioning may combine simulated and hardware registrations without mode branches in WCS. The current warehouse, environment, adapter source, permission, and warehouse scope are explicit request/session context and are revalidated server-side.

## Glossary (`en` / `zh-TW`)

| Concept          | English          | zh-TW      |
| ---------------- | ---------------- | ---------- |
| inbound          | Inbound          | 入庫       |
| outbound         | Outbound         | 出庫       |
| load             | Load             | 載具       |
| storage location | Storage location | 儲位       |
| transport task   | Transport task   | 搬運任務   |
| equipment        | Equipment        | 設備       |
| assignment       | Assignment       | 指派       |
| alarm            | Alarm            | 警報       |
| acknowledge      | Acknowledge      | 確認已知悉 |
| clear fault      | Clear fault      | 清除故障   |
| unavailable      | Unavailable      | 不可用     |
| unknown          | Unknown          | 狀態未知   |
