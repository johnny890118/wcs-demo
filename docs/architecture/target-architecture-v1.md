# Target Architecture v1

## Decision summary

Use a TypeScript monorepo and a modular monolith. Deploy the web UI and API as separate processes/images, but keep one coherent domain model and PostgreSQL transaction boundary. Run the simulator as an adapter that can initially live in the API process and later run separately without changing the WCS core.

```text
apps/web (Next.js)
  -> HTTPS API + SSE/WebSocket read model updates
apps/api (NestJS modular monolith)
  -> application commands/queries
  -> WMS Lite | WCS | Alarm | Identity/Audit modules
  -> PostgreSQL + outbox
  -> EquipmentPort
       -> packages/simulator
       -> adapters/opc-ua | mqtt | vda-5050 | vendor (future)
```

## Proposed repository shape

```text
apps/
  web/
  api/
packages/
  contracts/       # versioned API/event schemas
  domain/          # pure domain types and rules
  simulator/       # deterministic equipment state machines
  ui/              # accessible design-system primitives
  config/          # shared lint/TypeScript/test configuration
adapters/           # optional protocol/vendor adapters
docs/
infra/
```

Migration starts inside the current application and moves into this shape incrementally; the folder tree is a target, not justification for a big-bang rewrite.

## Module responsibilities

- **Warehouse**: locations, loads, inventory, receipts, orders, allocation.
- **Topology**: versioned sites/areas, directed nodes/edges, resource references, optional geometry, activation and validation.
- **Execution**: transport requests/tasks, runtime-constrained route planning, scheduling, capability-based assignment, orchestration.
- **Equipment**: descriptors, capabilities, supported commands, constraints, ports, telemetry, connection and uncertainty semantics.
- **Simulation**: virtual clock, scenario seed, state machine, faults, recovery.
- **Alarm**: alarm definition, occurrence, priority, acknowledgement, shelving policy, resolution.
- **Identity/access**: users, roles, permissions, sessions, step-up/confirmation policy.
- **Audit**: append-only business/security events, separate from diagnostic logs.
- **Projection**: operator-focused read models and realtime updates.

## Data and consistency

- PostgreSQL is the source of truth for business/execution state; migrations are mandatory.
- Application commands use explicit transaction boundaries and optimistic concurrency/version fields.
- An outbox publishes state changes after commit; consumers are idempotent.
- Commands carry correlation and idempotency identifiers.
- Equipment telemetry includes observed-at and received-at timestamps plus quality/freshness.
- Demo reset operates only on an explicitly marked demo tenant/environment and is impossible in production mode.
- Customer topology and equipment profiles are versioned persisted configuration. Activation is validated and audited.
- Route plans reference the topology version and selected directed edges; runtime closures can invalidate a plan without rewriting topology history.

## Configuration and visualization boundary

The topology model is a directed graph. Nodes identify operational waypoints/stations/transfer interfaces; edges identify possible directed traversal and carry cost, availability, required capabilities, and resource references. Kinds and capability identifiers are open strings governed by validated semantics rather than closed customer-specific enums.

Coordinates and geometry are optional attributes for layout exchange, distance heuristics, and presentation. They never replace node/edge connectivity or runtime constraints. A visualization consumes a versioned topology projection and may use SVG, Canvas, WebGL, or another renderer without changing routing or inventory behavior.

VDA 5050, VDMA LIF, OPC UA, MQTT, and vendor models are boundary formats. Adapters translate them to internal descriptors, commands, telemetry, and topology imports; core modules do not import their schemas.

## Realtime

Start with server-sent events for one-way operational projections if requirements remain read-heavy; use WebSocket when bidirectional session semantics are proven necessary. Equipment protocols remain behind backend adapters and are never exposed to the browser.

## Security zones

- Public landing/demo entry: minimal anonymous surface and SEO metadata.
- Authenticated operations: least-privilege permissions and noindex.
- Engineering/admin: stronger roles, confirmation and audit for high-risk changes.
- Equipment network: isolated adapter credentials, outbound/inbound allowlists, timeout/circuit-breaker policy, and no browser reachability.

This is a product architecture baseline, not a claim of ISA/IEC 62443 certification.

## Deployment

- Developer: Docker Compose with web, API, PostgreSQL, and simulator.
- Public demo: Vercel web, Render API/simulator, Supabase PostgreSQL where current free-plan constraints permit.
- On-prem/edge: the same OCI images and PostgreSQL-compatible database, with local execution surviving WAN loss.
- Kubernetes remains deferred until a concrete HA/multi-node/customer-platform requirement exists.

## Technology decisions pending evidence

- ORM/migration tool, validation/schema library, authentication provider, authorization policy library, telemetry exporters, realtime transport, and UI primitive library.
- Each selection must be tested against maintenance, accessibility, security, TypeScript quality, deployment portability, and operational complexity.
