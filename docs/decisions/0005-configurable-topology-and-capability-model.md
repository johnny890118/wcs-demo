# ADR 0005: Configurable Topology and Capability-Based Equipment

- Status: Accepted
- Date: 2026-09-18

## Context

The prototype embeds a single grid, coordinates, route arrays, and one vehicle workflow in React. M1 removed React as execution truth, but named a mobile transport state machine and command port too generically. M2 persisted source/destination locations while retaining a closed location-type enum and one code-registered simulator.

Customer warehouses vary in layout, directionality, zones, equipment, transfer resources, and runtime restrictions. Forking the core per warehouse is prohibited.

## Decision

1. Persist each warehouse topology as versioned directed nodes and edges. Bidirectional travel is represented by two directed edges, which may carry different costs or constraints.
2. Treat node position and edge geometry as optional configuration attributes. Routing uses graph identity, cost, capabilities, resources, and runtime availability—not screen coordinates.
3. Keep transport intent (`sourceLocationId`, `destinationLocationId`) separate from a derived route plan. A route plan records the topology version and chosen edges so it can be audited and invalidated when runtime state changes.
4. Use open string identifiers for location/node kinds and equipment capabilities. Core decisions use known capability semantics while preserving unknown values for forward-compatible adapters.
5. Model equipment profiles through descriptors: capabilities, supported commands, constraints, adapter key, and availability. Profile-specific state machines may exist; no single state machine represents every equipment class.
6. Evaluate route restrictions through small, composable evaluators. The initial evaluator handles edge availability and required capabilities; future load, zone, traffic, and shared-resource policies plug into the same boundary when requirements are proven.
7. Visualization consumes topology projections. SVG, Canvas, coordinates, and layout editors never define execution rules.
8. VDA 5050 and VDMA LIF remain adapter/import-export concerns. Their useful concepts inform the core, but their wire schemas do not become the domain model.

## Consequences

- A new customer layout is data plus validated policy, not a code fork.
- One-way paths, closures, and capability-restricted edges are supported without device-type branching.
- Route planning remains intentionally modest; congestion optimization and reservation scheduling are deferred until measured needs exist.
- Topology configuration requires schema validation, versioning, reachability checks, and audit before activation.
- The existing mobile simulator is retained as the first capability profile and renamed/documented accordingly over incremental migrations.
