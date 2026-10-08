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

## System-first frontend boundary checkpoint

Status: Complete

- [x] Replace the marketing-style root with a thin bilingual system entry and authentication-aware primary action
- [x] Add the formal responsive, accessible, theme-aware `/login` surface with safe internal operations callbacks
- [x] Route every supported operations page through the product login while preserving its valid internal destination
- [x] Centralize public/login/operations/API/legacy classification and noindex response policy in the single Next.js deployment
- [x] Remove About, Contact, Legacy, repository, and marketing links from the active product and operations navigation
- [x] Keep paused About/Contact source routes available without advertising them in the active sitemap
- [x] Verify anonymous/authenticated entry, callback rejection, bilingual themes, keyboard access, responsive reflow, production build, and full repository gates

## Product capability, roles, flows, IA, and roadmap alignment

Status: Complete

- [x] Approve one-product Simulation/Hardware direction and future Hybrid compatibility
- [x] Approve human-readable-by-default task, equipment, alarm, and recovery experience
- [x] Approve actionable Operations Home, task-centered work context, Live View/topology separation, and role workspaces
- [x] Approve built-in single-source web/PDF operation manual and contextual help direction
- [x] Approve principal -> permission -> warehouse scope -> role-template authorization model and OIDC-first identity direction
- [x] Replace the previous M8B-first sequence with the S1–S8 system roadmap

The governing detail is the [Approved Product Experience Direction](../product/approved-product-experience-direction.md).

## S1 — Accountable Access and Deployment Safety

Status: Complete — verified 2026-10-03

- [x] Establish provider-neutral principal/session contracts while retaining the demo identity as a replaceable adapter
- [x] Define effective user permissions independently from service permissions and role-name conditionals
- [x] Derive allowed demo warehouse scopes and require an explicit current warehouse context; persistent production assignments remain planned
- [x] Separate lifecycle environment, deployment profile, and equipment source; reject incompatible profile/source combinations at deployment validation and API startup
- [x] Restore API/Web OCI build parity and remove `/platform` from Compose health semantics
- [x] Revalidate permission plus warehouse scope at SSR, BFF, and API boundaries
- [x] Surface current warehouse, environment, equipment source, principal, and relevant freshness/connectivity in the application shell
- [x] Define human, anonymous-demo, and service principal semantics plus a bounded server-issued demo-session carrier without prematurely implementing the S3 data lifecycle
- [x] Add permission-aware navigation/actions plus explicit access-denied and expired anonymous-demo session behavior; the backend remains authoritative
- [x] Add bounded multi-warehouse context selection and warehouse-scoped context-change evidence
- [x] Resolve human permissions and warehouse-local grants from persistent assignments rather than deployment environment
- [x] Persist active human sessions and add assignment revalidation, bounded expiry, sign-out/administrative revocation, and lifecycle evidence
- [x] Add failed-login evidence/throttling and revocation delivery/retry observability without guessing production retention duration
- [x] Enable deny-by-default non-owner PostgreSQL access and verify the managed database security advisor
- [x] Require the configured application origin on every custom browser operational mutation
- [x] Complete the S1 security review and record unresolved production-identity/operability gates without blocking S2

## S2 — Operational Work Center, Inventory Visibility and Spatial Read Foundation

Status: Complete for approved S2 foundation — checkpoint `842503d`, CI/deployments/runtime verified.

Evidence: [S2 acceptance matrix](s2-acceptance-evidence.md) and
[S2 work center plan](s2-operational-work-center-plan.md). Advanced controls,
physical authoring and commercial readiness remain separate milestones.

- [x] First actionable Home slice: server-classified attention/work, readable locations/states, bounded coverage, freshness, and responsive bilingual presentation
- [x] Scoped active/all task queue with keyset pagination; task detail with work/load, recorded route, open alarm, and permission-gated audit context
- [x] First inventory workspace: scoped search/keyset pages, stock/reservation balances, load/location context and receipt evidence links
- [x] Loads read-model foundation: scoped receipt/location lineage, separate received/current quantities, null unrecorded inventory and paginated literal search
- [x] Loads operator workspace: searchable received/current quantity context, null/shipped semantics and inventory/history navigation
- [x] Locations read-model foundation: scoped configured locations, active version bindings and separately labelled record counts
- [x] Dedicated Locations operator workspace: configured-state meaning, active binding diagnostics and related stock/load searches
- [x] Navigation/identity quality checkpoints: reduced overview reads, pending navigation feedback and owned SWP icons/metadata; authenticated production p95 remains unmeasured
- [x] Configurable GET-only human-session read freshness and stage timing; strict mutation/switch validation, independent security review and honest delayed-read revocation contract (ADR 0022)
- [x] Topology inspection evidence correction: explicit bindings, bounded stock row counts and obsolete/stale projection handling
- [x] Live View read foundation: server-qualified current/last-known/unknown equipment position, scoped observed-versus-assigned work and conservative coverage
- [x] Authenticated bilingual searchable manual web foundation and shipped-workflow contextual help; effective-permission links, versioned single content source
- [x] Versioned bilingual private PDF export from the same source; hash/source/extracted-content drift gate and standalone artifact tracing
- [x] Inbound/outbound request review with readable item/location context, scoped task investigation and bounded stock-hint qualification; no mutation authority change
- [x] Alarm/recovery work context: readable state/severity, bounded affected-work context, scoped investigation and explicit unknown-outcome/recovery-impact meaning
- [x] Cross-workflow read hardening: both task endpoints and stock receipt/load lineage scoped; unresolved alarm evidence prioritized before bounded history

- [x] Actionable Operations Home, task queue/detail, inbound/outbound context, inventory/load/location visibility, and contextual history
- [x] Human-readable states, blocking reasons, impacts, permitted next actions, and operational deep links (advanced overrides remain S4)
- [x] Operations Live View foundation distinct from readable engineering topology inspection
- [x] Preserve and extend explicit Location-to-Topology-Node binding correctness, including persisted unbound/retired/foreign-reference regressions
- [x] Complete the approved spatial/normalized-position read vocabulary: qualify coordinate system, unknown floor/frame/unit/calibration and node-level versus physical evidence without adding S6 authoring
- [x] Built-in operation manual, contextual help, searchable navigation, and single-source bilingual PDF foundation

## S3 — Public and Private Demo Product

Status: In progress (supersedes M8B)

Active plan: [S3 demo lifecycle](s3-demo-lifecycle-plan.md). First slice is the
admission/expiry control ledger; provisioning reservations do not authorize
operations. Public issuance and old browser carriers remain unavailable until
isolated workspace/persisted-access/cleanup gates are implemented (ADR 0023).

- Admission/expiry control ledger checkpoint `6b06868` is CI/deployment/runtime
  stable, with capacity retained until verified cleanup.
- Inactive reference-workspace snapshots establish distinct persisted identities
  and versioned bindings (ADR 0024), not completed virtual equipment provisioning
  or public access. Do not mark the aggregate S3 requirements below complete.
- Leased/fenced inactive-reference cleanup archives ownership evidence and only
  releases capacity after atomic verified removal (ADR 0025). Active simulator
  cleanup, enabled workers, persisted access and abuse gates remain unfinished.
- Global committed-creation rate is independently bounded in a persistent
  DB-time fixed window (ADR 0026); cleanup/retries cannot replenish it. This does
  not complete HTTP abuse controls or scenario/per-session storage quotas.
- Fresh local simulator bundles isolate equipment state, command replay and
  virtual time with owned observation guards and resource bounds (ADR 0027).
  They are not activated or authorized public runtimes; persisted leases/fencing,
  restart and active cleanup must precede service registration.
- Durable simulator ownership has trusted DB-time claim/renew/activation,
  unknown takeover and scoped/fresh token-fenced observation persistence (ADR
  0028), with isolated inbound/outbound PostgreSQL execution proof. It remains
  unwired; restart restoration, persisted browser authority and active cleanup
  are not complete.

- [ ] Isolated public-demo session persistence with TTL, restart-resumable cleanup, quotas, global capacity guards, and bounded creation/scenario rates
- [ ] Guided public scenarios and safe sandbox through the real WMS Lite/WCS/simulator/observation path
- [ ] Authenticated private-demo scenario, replay, fault, diagnostics, and advanced simulator controls
- [ ] Session-scoped reset/run identities, permission/confirmation/idempotency/concurrency policy, reset evidence outside resettable rows, and production hard-deny

## S4 — Safe Task Control and Reconciliation

Status: Planned

- [ ] Human-readable blocked/unknown context and command timeline
- [ ] Authorized retry, reassign, replan, cancel, expected-versus-observed reconciliation, and outcome verification

## S5 — Scheduling and Resource Coordination

Status: Planned

- [ ] Priority, automatic assignment, reservation/lease, contention, fairness, reassignment, and restart consistency

## S6 — Governed Warehouse Configuration and Map Authoring

Status: Planned

- [ ] Warehouse/floor/spatial-frame, physical/semantic layout, location/zone/station, topology/bindings, equipment, and integration configuration
- [ ] Floorplan import, coordinate calibration, validation, and Live View preview without customer-specific React code
- [ ] Draft, validation, impact preview, review, activation, monitoring, rollback, and active-work compatibility

## S7 — External Integration and Commissioning

Status: Planned

- [ ] Versioned external WMS contracts, delivery/dead-letter/reconciliation, and integration status
- [ ] Productized real-equipment adapter registration, health, conformance evidence, diagnostics, and commissioning

## S8 — Commercial Delivery and Production Operability

Status: Planned

- [ ] SLOs, mature metrics/tracing/alerting, incident support, capacity, access review, and production diagnostics
- [ ] Versioned Docker/on-prem/edge artifacts, compatibility/release policy, backup/restore/DR, upgrade/rollback, retention governance, supportability, and customer handoff evidence

Observability is cross-cutting from S1 onward. At each verified milestone, reassess remaining order against repository reality, dependencies, safety, user flow, and commercial maturity; record material changes.

## Immediate next task

Owner update (2026-10-08): close D delivery only, including authenticated
production journey, material UX limitations, durable evidence, exact-HEAD CI,
both deployments and runtime smoke. Stop at the clean checkpoint for Owner
review; do not begin theme work or S3 implementation. This supersedes the
automatic-return-to-S3 instruction below until Owner resumes it.

Owner update (2026-10-04): freshness foundation `2e90c6e` and independent brand/
journey update `d95609b` are pushed with successful exact CI, both exact provider
SHAs and managed/authenticated runtime checks; tree was clean before A.
The cache is a tested inactive primitive, not a runtime optimization.
Work spine A is delivered at `d8605d4`; B exact context handoffs are delivered at
`7d0e93d`, with exact CI, both deployment SHAs and authenticated runtime verified.
C job continuity/human meaning is delivered at `178ff9e`, with exact-HEAD CI,
both provider SHAs, managed smoke and authenticated read-only resume/reload
verified. D operator IA/end-to-end convergence is delivered at `4d13cf1`, with
exact CI `37329376012`, both provider SHAs, managed smoke and authenticated
production read-only contextual/reload/owned-return journey verified on
2026-10-08. Delivery evidence is synchronized; after final checkpoint gates,
stop for Owner review as directed above. The deferred S3 direction remains
restart/persisted-access/active-cleanup. The completed
Operator Experience A → B → C → D: reloadable server-resolved Work read spine,
exact context handoffs, job continuity/human meaning, then Operator IA convergence.
Work is the top-level user model; Task remains WCS execution. Templates are UX
defaults/permission bundles, not role-name backend branches. Do not invent
business stages, progress or unshipped S4–S7 capabilities. External WMS manual
fallback remains undecided until S7. Return to S3 after A–D, keeping marketing
deferred. See operator-experience-convergence-plan.md for current slice gates;
operations-navigation-workflow-plan.md records the completed foundation.

The following records the superseded immediate-next-task state before this Owner
approval; ownership/rolling-startup delivery must not be reimplemented.

S2 and S3 admission/reference-snapshot/inactive-cleanup/creation-budget/local-bundle
delivery gates are complete. Finish durable ownership's exact delivery gates,
then take the Owner-directed independent freshness/navigation/operator-workflow
slice recorded in the active S3 plan. Default read freshness becomes configurable
900 seconds only in that slice; timing and operator workflow outcomes must be
separately demonstrated, not inferred from auth speed. Resume S3 restart,
every-request persisted access and active cleanup before any public entry.
Do not implement an
unscoped reset/replay UI prematurely. Preserve
audit evidence outside resettable scenario state, production hard-deny and bounded
resource ownership. Follow the existing approved S3–S8 sequence, not a new roadmap.
Authenticated production latency remains unmeasured; PDFs are searchable but not
PDF/UA certified. Calibrated physical layout remains S6; marketing stays deferred.
