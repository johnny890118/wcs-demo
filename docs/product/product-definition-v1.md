# Product Definition v1

Status: Accepted as the initial product hypothesis. Validate with warehouse operators and integrators before treating workflow details as final.

## Vision

Smart Warehouse Platform is a bilingual operations, control, and simulation product for demonstrating and eventually running warehouse material movement. It must execute complete warehouse scenarios without physical equipment while keeping the same application-facing equipment contract available for future industrial adapters.

The product is one configurable core for different customer warehouses. No legacy layout, topology, route, equipment combination, coordinate system, station flow, or customer-specific operating rule is product truth. See the non-negotiable [product and decision principles](decision-principles.md).

## Product outcomes

- Operators can understand warehouse, task, equipment, and alarm state without reconstructing it from several screens.
- Supervisors can create and follow inbound and outbound work, identify exceptions, and recover safely.
- Engineers can test deterministic scenarios, inject faults, inspect decisions, and integrate equipment without changing core orchestration.
- Sales and evaluators can reset and replay a credible demo with no external WMS or hardware.
- Deployers can run the core on public cloud, a customer VM, or an edge server without a provider-specific rewrite.

## Primary personas and jobs

| Persona                       | Primary job                                       | Main concern                                                |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Warehouse operator            | Monitor work and respond to actionable exceptions | Clarity, speed, safe recovery                               |
| Shift supervisor              | Prioritize work and maintain flow                 | Throughput, bottlenecks, accountability                     |
| Controls/integration engineer | Commission adapters and diagnose behavior         | Determinism, timestamps, traceability, protocol isolation   |
| Maintenance technician        | Identify, acknowledge, and clear equipment faults | Correct procedure, equipment context, audit history         |
| Warehouse manager             | Understand inventory and operational performance  | Accuracy, trends, service level                             |
| Sales/demo presenter          | Replay an understandable end-to-end story         | Fast reset, predictable timing, no infrastructure surprises |

## Pain points

- Inventory intent and physical execution are often split across systems with different identifiers and timing.
- Operators need one reliable operational picture when equipment is slow, offline, blocked, or uncertain.
- Vendor-specific equipment protocols make mixed fleets expensive to integrate and test.
- Hardware availability makes development and regression testing difficult.
- Uncontrolled alarm volume and ambiguous recovery steps create risk rather than useful awareness.

## Capability map

### WMS Lite

- Warehouse, zone, location, item, load, and inventory records
- Inbound receipt and putaway requests
- Outbound order, allocation, and dispatch requests
- Inventory reservation and movement confirmation
- Demo seed/reset isolated from production data

### WCS

- Transport request intake and idempotency
- Transport-task lifecycle, routing, scheduling, and equipment assignment
- Command dispatch and correlation
- Equipment availability/state projection
- Fault, alarm, recovery, timeout, and reassignment workflows

### Simulation

- Deterministic clock and scenario seed
- Equipment state machines, position, load handling, sensors, delay, and availability
- Fault injection and recovery
- Adjustable speed, pause, resume, reset, and scenario assertions

### Platform

- Authentication, RBAC, audit trail, structured logs, health, metrics, localization, themes, accessible responsive UI, API contracts, and deployment packaging

## MVP

The first product-grade demo supports one warehouse, storage and transfer locations, loads, one or more simulated transport devices, inbound, outbound, and equipment-fault scenarios. It exposes truthful task/equipment state, deterministic reset, operator alarms, and audit history. It runs locally through containers and can be deployed with replaceable infrastructure adapters.

## Non-goals for MVP

- Full ERP, transportation, labor, yard, billing, or procurement management
- Safety PLC replacement or safety-rated control
- Arbitrary manual jog/control from the browser
- Universal support for every vendor and protocol
- Multi-warehouse optimization, Kubernetes, advanced digital twin physics, or predictive maintenance
- Claiming compliance or certification before formal assessment

## Demo story

1. Reset a named sample warehouse to a known seed.
2. Create an inbound load; show request -> task -> assignment -> simulated pickup -> storage -> inventory confirmation.
3. Create an outbound order; show allocation -> task -> retrieval -> outbound station -> inventory confirmation.
4. During a running task, inject an equipment fault; show equipment unavailability, an actionable alarm, task impact, recovery/reassignment, and controlled completion.
5. Show audit history and replay the scenario in both supported languages and themes.

## Success criteria

- The three required scenarios are repeatable and deterministic in CI and the UI.
- Every command and state change has a correlation identifier and timestamp.
- A restart does not silently invent successful command outcomes.
- Critical workflows meet documented keyboard, responsive, localization, and contrast checks.
- `npm run verify` and CI provide one shared pass/fail gate.
- A new adapter can be added behind the equipment port without modifying WMS Lite or WCS domain rules.
- A materially different customer topology and compatible equipment composition can be activated through validated, versioned configuration without forking the core.
