# ADR 0008 — Topology-qualified equipment observations

Status: Accepted

## Context

The equipment state machine and link supervisor already distinguish current, stale, disconnected, and unknown outcomes, but those facts previously existed only inside an API process. The operations projection exposed equipment descriptors, not observations, so a warehouse map could either omit equipment or incorrectly infer physical position from task assignment.

The target architecture requires observed-at and received-at timestamps plus quality and freshness. The OT threat model additionally requires monotonic ordering, explicit disconnection, topology-version agreement, and rejection of stale evidence before commands. VDA 5050 is one supported adapter boundary, not the core telemetry model.

## Decision

- Persist the latest observation per equipment identity separately from its descriptor.
- Qualify node positions with the topology identifier and revision used by the observation. A node identifier is never interpreted against a different active topology.
- Preserve equipment status, task/load correlation, fault code, connection state, quality, monotonic sequence, observed-at, received-at, and adapter source.
- Compute `current` versus `stale` at projection time from received age and connection state. Timestamp presence alone does not establish freshness.
- Permit an explicit null node and null topology for unknown position. Task assignment, route destination, inventory location, and browser geometry never substitute for an observation.
- Render stale observations as last-known evidence, not current physical position. Bad or unknown quality cannot receive the healthy marker treatment.
- Keep the observation model protocol-neutral. Simulator and hardware adapters publish through the same application-facing sink in later incremental work.

## Consequences

Migration `0007_equipment_observations.sql` adds durable, schema-validated latest-observation storage. The read model and UI can now express missing, current, stale, disconnected, and topology-mismatched evidence without guessing. ADR 0009 subsequently connects simulator transitions, heartbeat, shutdown, and conservative restart behavior to this boundary.
