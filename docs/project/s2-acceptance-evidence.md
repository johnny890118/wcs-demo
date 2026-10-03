# S2 Operational Foundation Acceptance

Review date: 2026-10-04. Scope: approved S2 read/workflow foundation, not a
commercial-readiness, physical-position or safety certification.

## Requirement-to-evidence map

| Approved S2 responsibility                            | Shipped evidence                                                                                      | Verification and limits                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actionable Home and work investigation                | `operations-home.ts`, Home panels, `home-investigation.ts`, task queue/detail                         | Home prioritization and keyboard fault investigation; active/all keyset traversal and detail history; bounded work is not complete warehouse coverage                                              |
| Inbound/outbound operational context                  | Workflow panels and scoped create/execute BFF/API/repositories                                        | Browser create → readable request review → reason/confirmation → execution → task/audit; PostgreSQL allocation/idempotency/uncertainty tests; no browser equipment authority                       |
| Inventory/Loads/Locations                             | Three scoped paginated read models and local Inventory navigation                                     | Literal search, quantities/reservations, receipt lineage, null unrecorded versus zero shipped, disabled/blocked/unbound labels; rows are not physical occupancy or an atomic snapshot              |
| Human-readable states, reasons, impact and next steps | Localized Home/task/stock/alarm text and progressive technical disclosures                            | Keyboard/bilingual/theme/mobile/axe coverage; missing blocking evidence is explicit; advanced retry/reassign/replan/cancel/reconciliation remains S4                                               |
| Contextual history and permissions                    | M8A audit projection, dedicated `audit.view`, resource/correlation deep links                         | Redaction, pagination and protected audit/BFF/download routes; viewing a link grants no permission; retention production decisions remain explicit                                                 |
| Daily Live View distinct from engineering inspection  | Qualified observations, `WarehouseLiveView`, separate topology inspector                              | Current → last-known → unknown tests; assignment versus observed work, refresh failure/expiry, topology/binding races; node references are not measured XY/floor positions                         |
| Explicit versioned Location-to-Topology-Node binding  | Composite database foreign keys, active-version joins, scoped projections and topology display helper | Real PostgreSQL rejects foreign warehouse/node bindings and returns null for unbound/retired same-label locations; activation requires valid complete bindings; no label-to-node identity fallback |
| Spatial read vocabulary                               | Versioned node references and qualified spatial metadata contract                                     | Invalid node/version references rejected; floor/frame/unit/calibration remain explicitly unrecorded; governed physical map authoring remains S6                                                    |
| Manual/contextual help                                | Single-source revision `2026-10-03.3`, Web manual and private bilingual PDFs                          | Literal search, permission-derived links, private no-store/noindex downloads and source/hash/text/release drift checks; accessible Web is primary, PDFs are untagged/not PDF-UA                    |
| Secure usable navigation and product boundary         | System-first entry/login/Operations, owned SWP identity, ADR 0022 read freshness                      | Signed bounded GET reads, strict mutation/update/audit/manual/NextAuth; real local 24 mutation denials; no event-driven read revocation; authenticated production p50/p95 remains unmeasured       |

The matrix maps to source files and existing domain/API/browser tests rather than
claiming documentation itself closes implementation gaps. Four added PostgreSQL
negative binding regressions close the previously missing persisted-boundary
evidence. No UI, domain, configuration mutation or authentication is rewritten.

Full `npm run verify` passes: 452 fast tests, 29 real PostgreSQL tests and 34
production-build Chromium tests; formatting, secrets, dependency audit, lint,
typecheck, icons and manual integrity/text gates pass. Lint retains 15 documented
legacy warnings and zero errors; production dependency audit reports zero
vulnerabilities. Separate API build passes. Delivery gates are recorded separately
after exact-commit CI and deployment/runtime confirmation, not inferred here.

## Runtime and UX review

Production-build Chromium tests exercise actual Next SSR/BFF/UI with a mocked
equipment/backend fixture; they are not real hardware or a deployed operator
benchmark. Real PostgreSQL tests verify persistence separately, and the session
measurement harness uses real production-build Next/Nest/PostgreSQL. Managed
runtime checks prove deployment readiness/private unauthenticated boundaries,
not authenticated production latency. Keep these evidence classes distinct.

Review inspected runtime desktop/mobile Home, Inventory, Loads, Locations,
Live View, manual and inbound confirmation screenshots. Human labels precede
technical IDs; quantities and unknown evidence remain distinct; mobile controls
reflow; stale equipment is explicitly last-known. Automated keyboard/locale/theme
and axe checks supplement visual review, not a formal WCAG certification.

| Before                                                                | After                                                                          | Why                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Aggregate S2 items remain unchecked despite many delivered slices     | Traceable acceptance matrix with explicit limitations                          | Close only evidence-backed foundations, not infer commercial completeness         |
| Binding tests prove a valid version but omit negative persisted reads | Same-label unbound/retired and foreign warehouse/node regressions              | Never equate labels, retired versions or foreign references with routing identity |
| Historical active plan contains completed future imperatives          | Current completion/continuation order separated from historical slice evidence | Avoid redoing shipped work or silently skipping remaining milestones              |

## Remaining product limits and continuation

- S3 owns first-class isolated demo sessions, TTL/cleanup/quota/capacity,
  accountable scenario/reset/replay and production hard-deny. The current global
  reset can remove `audit_events`; it is not an approved public demo lifecycle.
- S4 owns governed task overrides, command/reconciliation timelines and paginated
  exception control beyond the bounded 100-alarm projection. Unknown is not success.
- S5 owns scheduler/resource fairness, reservations/leases and restart consistency.
- S6 owns persisted physical floors/frames/layout/calibration and configuration
  authoring/activation; the current diagram is not a calibrated floorplan.
- S7 requires an actual external WMS/equipment target and commissioning evidence.
- S8 owns production OIDC/MFA/provider logout/access administration, durable
  revocation delivery, retention/business policy, metrics/SLOs/DR and commercial
  commissioning/support. Session read revocation is bounded as ADR 0022 states.
- Full Public Website/marketing is not part of this system milestone. Legacy
  remains migration reference, not a shipped operational capability.

Do not enter S3 until this acceptance checkpoint's full verification, push,
exact-commit CI/deployment/runtime and clean-tree gates pass. No routine Owner
acceptance pause is required by the autonomous charter.

Delivery confirmed: checkpoint `842503d1e0ed02e15e5c422360a0986692f02932`,
Verify `37137046354` both jobs successful, Vercel/Render exact-commit deployments,
managed runtime pass and clean tree. S3 starts independently after those gates.
