# Roadmap

This is a living roadmap. Priority is risk reduction plus demonstrable vertical capability, not feature count.

## M0 — Discovery and engineering foundation

Status: Complete

Acceptance criteria:

- [x] Repository inventory and current-state assessment
- [x] Product definition, domain boundary, target architecture, gap analysis, risks, ADRs, and source register
- [x] Required Emil Kowalski design skill installed and UI workflow recorded
- [x] Tracked environment file removed and hard-coded credential deleted; rotation remains an owner action
- [x] Supported dependency baseline with no known high/critical production vulnerabilities
- [x] One local `verify` command mirrored by CI
- [x] Legacy smoke/characterization tests for the three routes and routing behavior (API safety boundary covered)

## M1 — Deterministic execution kernel

Goal: execute one transport task without React owning domain truth.

Status: Complete

- [x] Strict TypeScript foundation and pure equipment domain module
- [x] Transport task, command result, and alarm lifecycle models
- [x] Deterministic simulator clock; first mobile-equipment state machine is implemented
- [x] Equipment port plus in-memory simulator adapter
- [x] Complete unit/state-transition suite; happy path, invalid transition, duplicate command, timeout/unknown outcome, and fault/recovery are covered
- [x] Authenticated, read-only compatibility façade so the legacy UI can observe the new kernel

## M2 — Persistent inbound vertical slice

Status: Complete

- [x] NestJS API shell, explicit PostgreSQL adapter, and migration runner
- [x] Initial warehouse, location, receipt, load, transport-task, outbox, and audit schema
- [x] Authenticated and validated inbound request persists receipt -> load -> queued task atomically
- [x] Idempotency-key replay contract, conflict detection, liveness, and readiness endpoints
- [x] Task assignment -> deterministic simulated move -> storage and inventory confirmation
- [x] Structured JSON logging, correlation IDs, and lease/retry-safe outbox publisher
- [x] Real PostgreSQL integration tests and migration verification
- [x] Repeatable demo seed/reset safeguards with an in-database demo marker

## M2.5 — Multi-warehouse configurability hardening

Status: Complete

- [x] Persist product/decision principles and complete the M1/M2 assumption audit
- [x] Research ISA-95, VDA 5050, VDMA LIF, and heterogeneous-fleet evidence; record ADR 0005
- [x] Add versioned, directed warehouse topology domain model and route planner
- [x] Add persisted topology schema, configuration validation, and activation boundary
- [x] Add capability descriptors and capability-based assignment checks
- [x] Replace closed location-type decisions and code-registered demo equipment with persisted capabilities/configuration
- [x] Prove one-way, closure reroute, unavailable resource, incompatible equipment, and visualization-independence behavior in tests

## M3 — Operator console foundation

Status: Complete

- [x] Next.js TypeScript web shell, public product entry, and protected operations overview
- [x] Design tokens, light/dark/system, `zh-TW`/`en`, and responsive navigation
- [x] Accessible task, equipment, inventory, and topology projections with authenticated realtime refresh boundaries
- [x] Emil design review reported in required Before/After table format
- [x] Keyboard, reduced-motion, contrast, responsive, and automated a11y checks, including browser-level keyboard, 200%-equivalent reflow, accessible-tree semantics, and axe coverage
- [x] Authenticated Chromium E2E proving focused projections from an isolated WCS fixture

## M4 — Outbound and fault recovery

Status: Complete

- [x] Transactional, idempotent outbound order allocation across persisted inventory units
- [x] Capability-based shipping destination validation, SKU-scoped concurrency serialization, queued transport tasks, outbox, and audit evidence
- [x] Outbound deterministic equipment execution, atomic inventory consumption, shipping confirmation, and unknown-outcome reconciliation
- [x] Persisted fault injection, accountable alarm acknowledgement, resume/release recovery, reassignment, and unknown-outcome handling
- [x] Three deterministic Playwright scenarios: inbound completion, outbound completion, and acknowledged fault release/reassignment
- [x] Deny-by-default service RBAC plus named high-risk confirmation and transactional audit evidence

## M5 — Deployment and public demo

Status: Complete

- [x] Digest-pinned, non-root Web/API OCI images and production-like Docker Compose with migration/health smoke gate
- [x] Vercel/Render/Supabase deployment adapters, provider-neutral environment validation, and provider-specific runbooks
- [x] Checksum-verified backup/restore tooling and isolated recovery exercise in the deployment smoke gate
- [x] Runtime secret controls, security headers, and bounded rate limiting
- [x] Public SEO/contact/about; private operations/API noindex policy
- [x] Published demo only after security and scenario gates pass

## M6 — Hardware readiness

Status: Complete

- [x] Protocol-neutral adapter conformance kit and versioned, replayable simulator trace
- [x] VDA 5050 v3 reference proof selected for the validated graph-routed mobile-transport profile, explicitly non-certified and replaceable after customer/device discovery
- [x] Deterministic acknowledgement-loss, connection-loss, stale telemetry, bounded retry, reconciliation, and edge/WAN-loss drills
- [x] OT threat model and physical commissioning gate aligned with NIST SP 800-82 and ISA/IEC 62443 concepts without certification claims

## M7 — Product operations experience

Status: Complete

- [x] Reopen the product roadmap and distinguish engineering-foundation completion from product completion
- [x] Publish validated topology presentation coordinates through the operations read model without making visualization domain truth
- [x] Add an accessible, responsive warehouse topology map with directed-edge and runtime-fact overlays
- [x] Persist and project topology-qualified equipment observations with timestamps, connection, quality, freshness, sequence, and explicit unknown position
- [x] Render only qualified current/last-known observations on the map; never infer physical position from assignment
- [x] Connect simulator transitions, heartbeat, and graceful disconnect publication to the observation sink, including conservative restart and out-of-order rejection
- [x] Add an authorized inbound create/review/confirm/execute workflow with attributable audit evidence and qualified equipment selection
- [x] Add an authorized outbound allocate/review/confirm/execute workflow with attributable audit evidence and persisted inventory outcomes
- [x] Add authorized alarm acknowledgement and recovery workflows with named confirmations, operator evidence, and unknown-outcome preservation
- [x] Move the supported product entry away from legacy routes while preserving the prototype as an explicit migration reference
- [x] Prove the new experience through bilingual, theme, keyboard, reflow, axe, deterministic scenario, and live deployment gates

## M8A — Accountable audit history

Status: Complete

- [x] Define a paginated, redacted audit projection contract with stable correlation, actor, action, resource, and timestamp semantics
- [x] Expose authorized audit history behind a dedicated permission without leaking secrets, raw credentials, or unrestricted diagnostic payloads
- [x] Link supported operator workflow outcomes to accessible audit evidence in both supported locales and themes
- [x] Record retention, unknown-action, historical-backfill, and current demo-reset policies without claiming immutable storage

## M8B — Guarded demo reset and replay

Status: Planned

- [ ] Add a named deterministic demo reset/replay workflow behind demo-environment, authorization, confirmation, idempotency, and audit boundaries
- [ ] Prove replay determinism and production reset denial through integration, browser, and managed-environment-safe gates
- [ ] Retain reset evidence outside the `audit_events` rows being reset and define concurrent-session behavior
- [ ] Reconcile reset/replay with active tasks, outbox delivery, simulator state, and failed or interrupted reset outcomes

## M9 — Production identity and warehouse scope

Status: Planned

- [ ] Replace the single demo identity with production identity-provider integration and lifecycle controls
- [ ] Enforce user/role permissions separately from service permissions, including warehouse/site scope
- [ ] Audit identity, role, permission, and scope changes; add session revocation and access-review evidence

## M10 — Warehouse configuration administration

Status: Planned

- [ ] Add authorized lifecycle UI/API for warehouse, topology, location, equipment, adapter, and activation configuration
- [ ] Add draft/validate/approve/activate/rollback boundaries with impact preview and audit evidence
- [ ] Protect active-work compatibility and prevent unsafe configuration changes

## M11 — WCS coordination and reconciliation

Status: Planned

- [ ] Add scheduling priorities, resource reservations, contention handling, cancellation, and deterministic rescheduling
- [ ] Add operator-visible unknown-outcome reconciliation and durable command/equipment divergence workflows
- [ ] Prove recovery across restart, lease loss, duplicate delivery, and constrained multi-equipment scenarios

## M12 — External integration productization

Status: Planned

- [ ] Define versioned external WMS contracts, idempotent ingestion, outbound status delivery, retry/dead-letter, and reconciliation
- [ ] Productize equipment-adapter registration, conformance evidence, credential boundaries, compatibility, and upgrade policy
- [ ] Add integration administration and diagnostics without coupling domain/application code to protocols or vendors

## M13 — Production operability and diagnostics

Status: Planned

- [ ] Add metrics, traces, service-level objectives, alerting, capacity limits, and operator diagnostics
- [ ] Prove backup/restore plus audit retention, upgrade/rollback, incident response, degraded-mode, and disaster-recovery runbooks
- [ ] Complete deployment hardening and commissioning evidence for a real site without implying safety certification

## Immediate next task

Design M8B from the existing guarded CLI reset and deterministic scenario fixtures. The next change must first define where reset evidence survives, then specify authorization, idempotency, concurrency, failure recovery, and production denial before adding a browser control.
