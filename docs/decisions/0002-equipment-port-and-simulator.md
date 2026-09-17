# ADR 0002: Equipment Port with a First-class Simulator Adapter

- Status: Accepted
- Date: 2026-09-17

## Context

The product must work without hardware and later integrate heterogeneous PLCs, mobile robots, conveyors, lifts, and vendor controllers. The prototype currently advances a vehicle inside React and posts commands to an echo endpoint.

## Decision

Define a protocol-neutral `EquipmentPort` around capabilities, commands, acknowledgements/results, telemetry, connection state, and subscriptions. The deterministic simulator implements this port as a production-quality adapter. Future OPC UA, MQTT, Modbus TCP, VDA 5050, REST, and vendor adapters translate at the infrastructure boundary.

Runtime mode selects adapter composition through configuration. Domain/application modules do not branch on demo/simulation/hardware mode.

## Consequences

- The same orchestration and scenario tests can exercise simulator and hardware conformance fixtures.
- Protocol-specific concepts stay out of task and inventory models.
- Adapter contracts must represent timeout, stale data, duplicate command, offline, partial failure, and unknown outcome explicitly.
- Safety-rated behavior stays in certified equipment/safety systems; this port is not a safety PLC.
