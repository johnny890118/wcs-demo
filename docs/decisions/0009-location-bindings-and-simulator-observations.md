# ADR 0009 — Location bindings and simulator observation publication

Status: Accepted

## Context

Business workflows identify receiving, storage, and shipping locations by persisted location identity. Routing and equipment observations identify physical positions against a versioned topology node. Those identities happened to share readable codes in the original demo, but equating the strings would make the legacy layout an implicit source of truth and would fail when a customer changes topology revisions.

ADR 0008 established durable observations but intentionally left simulator transition and heartbeat publication for a later checkpoint. A restart also needs a conservative rule: an in-memory simulator must not silently convert unresolved movement, bad-quality evidence, a disconnected link, or an observation from a retired topology into an idle vehicle.

## Decision

- Persist explicit location-to-node bindings for each topology revision. The binding carries the warehouse identity in both foreign-key paths so a location cannot be attached to another warehouse's topology.
- Require every enabled location in the warehouse to have a binding before a draft topology can become active.
- Resolve task source and destination nodes through the active revision's bindings. Never infer a node from a location code, assignment, route destination, or UI coordinate.
- Require mobile-transport arrival commands to carry the observed node. Accepted simulator transitions retain that node as latest physical evidence.
- Publish simulator state through the protocol-neutral `EquipmentObservationSink`. PostgreSQL accepts only a sequence greater than the currently stored sequence; older or duplicate evidence cannot overwrite newer state.
- Publish a timestamped observation after accepted commands, on a configurable heartbeat, and as disconnected/unknown-quality evidence during graceful shutdown. The default heartbeat is 10 seconds and is constrained to 1–30 seconds, within the 30-second projection freshness window.
- On restart, restore `idle` only from connected, good-quality evidence at a node bound to the currently active topology. Restore `offline` only from connected, good-quality offline evidence. All active, faulted, disconnected, bad-quality, missing, or topology-mismatched states become `unknown`; task/load correlation is preserved and a node is retained only when its topology still matches.
- A simulator equipment identity has one active adapter owner. Multi-replica command ownership requires leader election or equipment partitioning before horizontal execution scaling.

## Consequences

Migration `0008_location_topology_bindings.sql` makes the business-location/physical-node relationship explicit and versioned. Inbound and outbound execution now produce truthful pickup and destination observations, heartbeat loss becomes stale evidence, graceful shutdown becomes disconnected evidence, and process restart cannot fabricate idle state. Configuration import and topology authoring must provide complete bindings before activation.
