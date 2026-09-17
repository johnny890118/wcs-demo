# M1/M2 Configurability Review

Date: 2026-09-18

Scope: equipment state machine and port, simulator, transport task, alarm, inbound execution, PostgreSQL schema, outbox, and API contracts. Legacy UI files were inspected only as migration evidence.

## Findings

| Area                    | Evidence                                                                                    | Verdict                                                    | Required action                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Transport task          | Stores source and destination identifiers, not coordinates or a fixed route                 | Sound as transport intent                                  | Keep route plan separate and derive it from topology/runtime state                                         |
| Alarm and outbox        | Source/aggregate identifiers and generic payloads do not depend on layout or equipment type | Sound                                                      | Preserve generic contracts                                                                                 |
| Equipment state machine | Generic `EquipmentState` name encodes a mobile pickup/load/move/unload workflow             | Over-generalized                                           | Scope it as a mobile-transport profile; add capability descriptors before assignment                       |
| Equipment port          | Protocol-neutral, but every command assumes mobile transport behavior                       | Incomplete extension point                                 | Expose equipment descriptors/capabilities and require capabilities in orchestration                        |
| Simulator registration  | `AMR-01` is registered in application code                                                  | Demo configuration leak                                    | Load simulator equipment from persisted seed/configuration                                                 |
| Location schema         | Closed `receiving/storage/shipping` enum and type-specific validation                       | Customer-flow assumption                                   | Replace assignment decisions with open location kinds plus explicit capabilities                           |
| Warehouse topology      | No persisted nodes, directed edges, resources, or topology version                          | Missing                                                    | Add versioned topology model and graph-based route planner independent of coordinates                      |
| Inbound execution       | Directly runs a fixed simulator command sequence                                            | Valid first equipment profile, not universal orchestration | Declare required capabilities and keep profile-specific command translation behind a strategy/adapter seam |
| Visualization           | New M3 shell had only theme/locale foundation; no new map model exists                      | No violation yet                                           | Do not build a map until the topology projection contract exists                                           |
| API                     | IDs and request boundaries are generic, but no capability mismatch response exists          | Incomplete                                                 | Reject incapable equipment before changing task state                                                      |

## Research interpretation

- ISA-95 provides technology-independent hierarchy and information-exchange concepts applicable to logistics. It supports separating customer/site configuration from execution logic, but it is not a warehouse routing schema.
- VDA 5050 keeps the complete connected node/edge graph in fleet control, permits edge restrictions for particular robots, and transmits only an allowed route segment to a mobile robot. Its factsheet makes physical and protocol capabilities machine-readable. These are useful design evidence, not a mandate to make VDA messages the core domain.
- VDMA LIF 1.0 describes an exchange format for mobile-robot track layouts, including layouts, nodes, edges, positions, actions, and vehicle-specific properties. It is a candidate import/export adapter, not the universal persisted warehouse model.
- MassRobotics interoperability work highlights heterogeneous fleet coordination and shared-space concerns, reinforcing capability and traffic boundaries without defining this product's internal model.

## Decision

Introduce a minimal, versioned directed topology graph, open-ended node/location kinds, explicit capability identifiers, and pluggable constraint evaluation. Coordinates and geometry remain optional topology attributes used by adapters and presentation. Route plans record the topology version and selected directed edges; they are derived artifacts, never fixed UI path arrays.

No rewrite is required for alarm, outbox, idempotency, audit, or the source/destination transport intent. The mobile simulator remains a supported execution profile but loses its claim to represent all equipment.
