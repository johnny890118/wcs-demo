# Approved Product Experience Direction

Status: Approved product, architecture, UX, and acceptance baseline

Approved: 2026-09-21

This document is the durable source for the product-experience alignment that
supersedes the earlier M8B-first sequencing. Detailed domain, security, and
architecture documents remain authoritative within their narrower concerns.

## One product, multiple deployments, replaceable execution sources

Smart Warehouse Platform is one operational product. It runs the same WMS Lite,
WCS, task, alarm, recovery, audit, history, and visualization flows against a
normalized equipment contract in every environment:

```text
WMS Lite or external WMS
        -> WCS
        -> EquipmentPort / normalized equipment contract
        -> Simulator adapter or hardware adapter
        -> qualified equipment observations
        -> shared operational projections and UI
```

- **Simulation** supports demos, development, testing, training, deterministic
  scenarios, fault injection, replay, and incident reproduction.
- **Hardware** receives telemetry and command outcomes from real equipment
  adapters at a commissioned site.
- **Hybrid** is a future-compatible composition in which individual equipment
  registrations may select simulated or hardware adapters. It is not a separate
  product mode and is not yet a complete product capability.

Protocol and vendor details remain behind adapters. WCS domain/application code
must not depend on MQTT, OPC UA, Modbus, VDA 5050, a vendor SDK, or a
vendor-specific payload.

Public Website, Public Demo, Private Demo/Training, and customer-specific
Commercial deployments are surfaces of one product, not divergent products or
customer forks. The Website will eventually link to Public Demo; it does not
provide a production login. Commercial users enter the URL of their own
deployment.

Three server-owned concepts remain independent:

- lifecycle environment: development, test, staging, or production;
- deployment profile: public demo, private demo/training, pilot, or production;
- equipment source: simulation, hardware, or hybrid.

They are security and safety context, not cosmetic labels. Every operational
session retains the current warehouse, deployment profile, equipment execution
source, principal/permissions, and relevant connectivity or freshness. The
backend validates permitted profile/source combinations; browser state and
session claims cannot switch equipment source.

Owner-approved single-site-first presentation (2026-10-09): SWP centers on the
current site's operations, not a multi-site management dashboard. No Site domain
is added. One authorized warehouse needs no always-on name or switcher. Multiple
authorized warehouses have a clear switch in the active Sidebar/Topbar; invalid
scope and switch failure remain explicit. Necessary target warehouse/source are
shown inside creation, execution, recovery and Live interpretation; other runtime
dimensions remain inspectable in preferences. This supersedes always-on context
strips, not session/RBAC/warehouse authorization. Desktop and sufficiently wide
landscape tablets use Sidebar; portrait tablets and phones in either direction
use Topbar. Usable CSS width/height/orientation, split windows and zoom determine
the presentation, not device detection. See
`../project/single-warehouse-navigation-plan.md`.

## Public and private demo boundaries

Public Demo is a no-login product surface, but never an authorization bypass. A
server-issued anonymous principal receives explicit permissions, a demo-session
scope, and a warehouse scope. Shared infrastructure hosts isolated, ephemeral
sessions; operational rows, virtual equipment state, scenario runs, and demo
history are session-scoped while versioned warehouse/topology reference data can
be shared.

Public sessions have configurable TTL, idempotent restart-resumable cleanup,
per-session quotas, global capacity limits, and bounded scenario execution. A
reset affects only its session and cannot delete its own control/security
evidence. Public Demo is simulation-only at the deployment, adapter, credential,
network, and command boundaries.

Private Demo/Training is authenticated and simulation-only. It may expose a
larger scenario catalog, replay, diagnostics, fault injection, speed controls,
and advanced recovery without weakening Public Demo or commercial boundaries.

## Human-readable by default

The product presents human meaning first and machine detail on demand. A primary
surface must let its target user answer:

1. What is this?
2. What is happening now?
3. Why is it happening?
4. What is affected?
5. What can I do next?
6. What is the risk of that action?
7. What was the resulting outcome?

Raw identifiers, enums, database terms, state-machine vocabulary, graph internals,
and protocol payloads are secondary diagnostic detail. Major user-facing work is
not product-complete merely because its endpoint, automated tests, and runtime
checks pass; the target user must also be able to understand and complete the
flow without source-code or database knowledge.

Task, equipment, alarm, and recovery views use progressive disclosure:

```text
human meaning -> operational context -> permitted action -> evidence/history
              -> diagnostic detail -> raw technical identity/payload
```

## Operational information architecture

### Latest Owner-approved convergence (2026-10-04)

Work is the top-level operator mental model; WCS Task remains execution.
The target operator workspace is Home / Work / Live / Exceptions / Inventory /
Help. Operator, Supervisor, Engineer and Admin are workspace templates, not
backend authorization branches. Implement A reloadable Work read spine, then B
exact context handoffs, C job continuity/human meaning and D IA consolidation;
the older module navigation below is not an instruction to change sidebar first.
Use existing domain evidence, never fabricated stages or progress. External WMS
manual fallback remains undecided until S7 has a real integration requirement.
See `docs/project/operator-experience-convergence-plan.md` for delivery gates.

- **Home**: actionable current state, attention required, waiting work, and next
  permitted actions. KPI/analytics are subordinate to daily operations.
- **Work**: tasks, inbound, and outbound.
- **Inventory**: inventory, loads, and locations.
- **Warehouse**: Operations Live View, equipment, and topology inspection.
- **Exceptions**: alarms and reconciliation.
- **History**: global history for permitted roles; contextual deep links for
  operators.
- **More / role workspaces**: simulator/demo, engineering/integrations/
  diagnostics, and administration.
- **Help**: searchable operation manual, contextual help, and downloadable PDF.

Names and responsive presentation may change with usability evidence, but these
responsibility boundaries and core flows must remain explicit.

`/operations` is an actionable Operations Home, not primarily a KPI dashboard.
It prioritizes warehouse/environment context, data currency, active and waiting
work, blocked/unknown tasks, actionable alarms, unhealthy equipment, and actions
allowed by the current permission and warehouse scope.

## Task-centered operational context

A task detail progressively connects its human meaning, source, destination,
current state, blocking reason, assigned equipment, route, load/inventory,
inbound/outbound origin, alarm, commands, history, and permitted next actions.
Status codes alone are not an adequate task experience.

Normal assignment is scheduler-owned. Manual retry, reassign, replan, or cancel
is an exception/override with permission, warehouse scope, state preconditions,
explicit confirmation, reason, audit, and outcome feedback.

## Visualization responsibilities

### Operations Live View

The primary daily warehouse view explains what is happening across the physical
operation: qualified equipment position/movement, active work, routes/progress,
load movement where useful, alarms, blocked resources/areas, and stale,
disconnected, or unknown equipment. It is shared by Simulation and Hardware.

Movement is never decorative UI animation. Its truth path is:

```text
task -> route/execution -> simulator or hardware -> equipment observation
     -> projection -> Live View
```

Selecting equipment, task, alarm, or location opens real operational context and
deep links. Technical adapter, node, topology revision, and protocol details are
secondary.

### Topology inspection

Topology remains an engineering/diagnostic/routing-understanding tool, not the
operator's primary warehouse view. It should progressively expose readable
stations, zones, resources, directions, route highlights, bindings, revisions,
filters/layers, zoom/pan/fit, and technical identities.

Location and topology-node identity are distinct. All product work uses the
explicit versioned Location-to-Topology-Node binding contract; matching readable
codes are not identity or routing truth.

### Governed configuration

Inspection and production mutation are separate surfaces. Configuration evolves
through draft, validation, impact preview, review, activation, monitoring, and
rollback. High-risk activation and rollback require permission, confirmation,
audit, and compatibility checks against active work.

## Simulator and scenario workspace

Simulation is an equipment source. A scenario is an operational story. The
isolated simulator workspace will provide named scenarios such as normal inbound,
normal outbound, equipment/network failure, blocked resource, recovery exercise,
and a full warehouse demo.

Scenario reset, start, pause/resume, planned fault injection, replay, and speed
control require environment guards, permission, confirmation, audit, concurrency
control, and idempotency. Production environments hard-deny inapplicable controls.
Demo reset must retain security, administration, and reset-governance evidence.

## Built-in operation manual

The authenticated product provides a bilingual, responsive, keyboard-accessible,
searchable, role-oriented operation manual with contextual deep links from major
workflows. It covers getting started, daily work, exceptions/reconciliation,
visualization, role guides, administration as capabilities ship, terminology,
permissions, troubleshooting, and FAQ.

A single structured manual source produces the web manual and versioned `zh-TW`
and English PDFs. PDF generation and drift checks are automated. The manual is an
operational capability, not public marketing content. Optional onboarding and
quick tours derive capabilities from effective permissions, never hard-coded role
names.

## Identity, authorization, and warehouse scope

Production identity is OIDC-first and provider-replaceable. Demo/development may
use a separate identity adapter; SWP does not build a production password system.

Authorization evaluates:

```text
principal -> permissions -> warehouse and optional demo-session scope
          -> optional role templates
```

Role names are permission bundles, not enforcement logic. A principal may combine
templates. Every operational request carries an explicit current warehouse and
the server/API/SSR boundary revalidates permission plus scope. Cross-warehouse
views require an explicit aggregation permission and capability; they never arise
by removing scope.

## WMS Lite boundary

WMS Lite is execution-oriented: sufficient for a complete hardware-free demo and
a small controlled pilot, with inbound, outbound, inventory, load, and location
truth required by WCS. It does not expand into ERP or a full enterprise WMS. A
versioned contract allows an external WMS to replace or narrow WMS Lite without
changing the WCS core.

## User-facing definition of done

Every major user-facing vertical slice addresses, in proportion to risk:

- domain correctness and explicit failure/unknown behavior;
- API, UI, effective permission, and warehouse scope;
- human readability and permitted next actions;
- audit evidence and observability;
- contextual help/manual updates where relevant;
- `zh-TW` and English, responsive behavior, keyboard access, and WCAG 2.2 AA;
- automated tests, runtime verification, UX review, and durable knowledge sync.

## Approved system roadmap

1. **S1 — Accountable Access and Deployment Safety**: human, anonymous-demo, and
   service principal contracts; permissions; warehouse/demo-session scope
   contracts; deployment profile/equipment-source guards; command enforcement;
   and accountable runtime context.
2. **S2 — Operational Work Center and Inventory Visibility**: actionable Home,
   task queue/detail, inbound/outbound context, inventory, history deep links,
   human-readable states, Live View foundation, readable topology, binding
   correctness, manual foundation, and contextual help.
3. **S3 — Public and Private Demo Product**: isolated ephemeral public sessions,
   TTL/cleanup/quota/capacity, guided scenarios and safe sandbox, authenticated
   training controls, reset/replay governance evidence, and production hard-deny.
4. **S4 — Safe Task Control and Reconciliation**: blocked/unknown explanation,
   command timeline, retry/reassign/replan/cancel, expected-versus-observed
   evidence, reconciliation, and outcome verification.
5. **S5 — Scheduling and Resource Coordination**: priority, automatic assignment,
   reservations/leases, contention, fairness, reassignment, and restart
   consistency.
6. **S6 — Governed Warehouse Configuration and Map Authoring**: versioned
   floors, spatial frames, physical/semantic layout, warehouse, location/zone/
   station, topology, bindings, equipment, calibration, preview, and activation
   lifecycle.
7. **S7 — External Integration and Commissioning**: external WMS, a real equipment
   target, integration status, adapter health, commissioning, diagnostics,
   dead-letter handling, and reconciliation.
8. **S8 — Commercial Delivery and Production Operability**: reproducible
   Docker/on-prem/edge delivery, versioned artifacts, compatibility policy,
   SLOs, mature metrics/traces/alerts, incident support, backup/restore/DR,
   upgrade/rollback, capacity, access review, and customer supportability.

Observability is a cross-cutting definition-of-done concern beginning in S1, not
work deferred entirely to S8. At every milestone checkpoint the remaining order
is reassessed against repository evidence, dependencies, safety, user flow, and
commercial maturity; material changes record their rationale.
