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

Status: In progress

- [x] Transactional, idempotent outbound order allocation across persisted inventory units
- [x] Capability-based shipping destination validation, SKU-scoped concurrency serialization, queued transport tasks, outbox, and audit evidence
- [ ] Outbound equipment execution, inventory consumption, and shipping confirmation
- [ ] Fault injection, alarm lifecycle, recovery/reassignment, uncertain-state handling
- [ ] Three deterministic end-to-end operational scenarios in Playwright
- [ ] RBAC and high-risk action confirmation/audit

## M5 — Deployment and public demo

- Web/API OCI images and Docker Compose
- Vercel/Render/Supabase deployment adapters and environment runbooks
- Backup/restore exercise, secret management, security headers/rate limits
- Public SEO/contact/about; private noindex policy
- Published demo only after security and scenario gates pass

## M6 — Hardware readiness

- Adapter conformance kit and recorded simulator traces
- First protocol proof (selected from validated customer/device need)
- Connection-loss, stale telemetry, retry, reconciliation, and edge/WAN-loss drills
- OT threat model aligned with NIST SP 800-82 and ISA/IEC 62443 concepts

## Immediate next task

Complete outbound equipment execution and atomic inventory consumption/shipping confirmation, including unknown-outcome reconciliation. Warehouse visualization remains deferred until it can consume topology projections without defining routes or domain state.
