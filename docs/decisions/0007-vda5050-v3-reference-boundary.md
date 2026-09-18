# ADR 0007: VDA 5050 v3 Reference Boundary

- Status: Accepted
- Date: 2026-09-19

## Context

M6 requires a first protocol proof selected from an evidenced need, without turning one vendor or device protocol into the warehouse domain. The implemented and tested product profile is graph-routed mobile load transport. It needs ordered route segments, device identity, connection-loss semantics, and a future way to negotiate device capabilities across heterogeneous mobile robots.

The official VDA 5050 repository published version 3.0.0 on 2026-03-19. Its fleet-control/mobile-robot boundary uses node/edge order graphs, retained connection state and broker last-will behavior, state telemetry, and factsheets. Those concepts align with the validated mobile-transport profile while remaining narrower than the complete Smart Warehouse Platform equipment scope.

## Decision

1. Implement a VDA 5050 v3.0.0 reference boundary for the current mobile-transport profile.
2. Keep VDA message types, topic construction, MQTT delivery semantics, and mapping code under `src/infrastructure/vda5050/v3`. Domain and application packages do not import VDA types.
3. Map only an already validated, version-matched core `RoutePlan` and `WarehouseTopology` into a VDA order. The protocol message never chooses the route or becomes topology truth.
4. Publish order messages through a small message-bus port with QoS 0 and no retain flag. Broker credentials, TLS, reconnect, subscriptions, and vendor-specific behaviors belong to a deployable transport adapter, not this mapping proof.
5. Treat `ONLINE` as connected and every other connection state as disconnected. Reject out-of-order connection headers. A connection message alone is insufficient telemetry: the link is usable only after a current equipment observation also exists.
6. Do not claim VDA certification, device compatibility, safety approval, or customer selection. Physical commissioning requires the exact robot factsheet, vendor behavior, broker configuration, official schemas, and site risk assessment.

## Consequences

- The reference proves a real protocol can consume core route output without shaping the core model.
- Other equipment classes and protocols remain first-class candidates behind the same equipment port and conformance kit.
- Actions, horizon/base updates, factsheet negotiation, full state mapping, MQTT transport, and official JSON-schema validation remain required before a production VDA adapter can be commissioned.
- A customer/device discovery may replace or supplement this reference proof without rewriting routing, tasks, inventory, or the operator console.
