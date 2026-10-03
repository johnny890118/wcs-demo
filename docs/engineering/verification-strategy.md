# Verification Strategy

Latest S3 persisted creation budget: full gate passes 487 fast, 68 real
PostgreSQL (59 prior + 9 budget), 34 production-build browser checks and
closed-public-boundary HTTP harness; API build passes. Independent review has no
blockers. DB-time concurrent/restart window bounds, immutable replay, closed-slot
cycling, policy mismatch, first-counter and existing-increment atomic rollback,
capacity failure, immutable configuration, actual reset survival, singleton
constraints and RLS are covered. This counts successful new reservations, not
HTTP traffic or scenario/storage quotas; fixed-window boundary bursts are
documented and public issuance remains unavailable (ADR 0026).

Latest S3 fenced inactive-reference cleanup: full gate passes 486 fast, 59 real
PostgreSQL (29 operational + 9 admission + 9 workspace + 12 cleanup), 34
production-build browser tests and closed-public-boundary runtime harness;
separate API build passes. Independent security review found no blockers after
adding both independent-connection observation insert/parent-lock orderings and
evidence-time lease expiry. Other checks cover atomic deletion/archive/capacity,
stable closed replay, concurrent claims, restart reclaim/stale fencing, missing
namespace versus unknown orphan, active/observed/assigned/audit/unexpected
reference refusal, failure/deadline rollback, actual reset-list survival and RLS.
No managed deletion or live simulator drain is claimed; ADR 0025 is inactive-only.

Latest S3 inactive reference-workspace snapshot: 483 fast, 47 real PostgreSQL
(29 operational + 9 admission + 9 workspace), 34 production-build browser tests,
public-profile denial harness and separate API build pass. Independent security
review found no blockers. Scoped identity/bindings, inactive equipment/no grants,
absence of copied operational rows/observations, concurrent replay, invalid
references/adapters, atomic event failure, mid-copy deadline rollback, actual
reset-list survival and database ownership/RLS are covered. Opaque configuration
and copied semantic graph resources do not establish simulator runtime isolation;
activation/public access/cleanup remain gated by ADR 0024.

Latest S3 admission/expiry foundation: 475 fast tests, 38 real PostgreSQL tests
(29 operational + 9 ledger), 34 production-build browser tests and separate API
build pass. Independent security review has no blockers. An actual local
production-build public-profile HTTP harness checks issuance503/no-cookie,
valid old-carrier read/mutation401, SSR login redirect and zero upstream calls;
`test:demo-boundary` is part of the full gate. PostgreSQL covers concurrent
admission/retries, non-sliding database TTL, retained expired capacity, atomic
reserve/expiry evidence rollback, actual reset-list survival and non-owner RLS.
Explicit READ COMMITTED admission remains capacity-safe even when connections
default to REPEATABLE READ.
CI fresh/restore smoke compares exact migration manifests rather than a stale
hardcoded count; missing, wrong-same-count and duplicate names fail closed.
No active isolated public session, verified resource cleanup or hardware safety
is inferred; see ADR 0023 and the active S3 plan.

Latest S2 acceptance closure: full gate passes 452 fast, 29 real PostgreSQL
and 34 production-build browser tests; separate API build passes. Four added
persisted regressions reject foreign warehouse/node bindings and prove unbound
or retired same-label locations remain unbound. Runtime screenshot review covers
Home, stock/load/location views, Live View, manual and inbound review. Evidence
classes and remaining S3–S8 limits are recorded in the S2 acceptance matrix;
neither mocked browser fixtures nor local measurements imply hardware safety or
authenticated production performance.

Latest S2 bounded-session freshness: full gate passes 452 fast, 25 real
PostgreSQL and 34 production-build browser tests; API build passes. Exact
freshness/expiry, malformed stamps, strict update/mutations, read-vs-mutation
isolation, registry failure, changed permissions and API warehouse denial are
covered. Independent security review found no blockers. A separate real local
production-stack harness checks all six mutation routes after four kinds of
withdrawal (24 denials), explicitly verifies delayed reads, and compares 60
authenticated sidebar navigations before/after. Validation spans drop 60→0;
local total click timing remains approximately 50 ms, not a measured production
speedup. Browser-local bounded Performance entries and server stage timing are
privacy-safe diagnostics. See the S2 freshness plan/ADR 0022 for evidence and the
read-revocation trade-off; session expiry/strict command authority remain.

Latest S2 manual correction: full gate passes 431 fast, 21 real PostgreSQL and
34 production-build browser tests; API build passes. Regression tests assert real
All work/load-more guidance instead of nonexistent task search. PDF source/release,
hash and full text gates pass; all nine rendered pages inspected. Private download
authorization, no-store/noindex and Web accessibility remain unchanged. The prior
interruption did not invalidate or restart the completed verification process.

Latest S2 contextual Home investigation: full verification passes 430 fast tests,
21 PostgreSQL integration tests and 34 production-build browser tests; API build
passes. Unit checks reject unresolved telemetry task references and verify internal
contextual destinations/fallbacks. Browser keyboard investigation reaches scoped
fault detail and readable exception evidence; equipment attention targets Live View.
The new mutable scenario is restored in `finally`, so later tests remain independent.
An initial fixture omission and a technical-code-versus-readable-message assertion
were fixed; no production check was weakened. Existing bilingual/mobile/axe remain green.

Latest S2 manual synchronization: full verification passes 427 fast tests,
21 real PostgreSQL tests and 33 production-build browser tests; API build passes.
The real drift gate rejects software-release mismatch as well as manual/source,
filename and byte drift. Both regenerated PDFs pass complete text extraction;
all eight rendered pages were visually reviewed for wrapping/glyphs/continuity
and footer clearance. Web runtime verifies bilingual package-release labels,
keyboard navigation, mobile themes/axe and private downloads/standalone assets.
One stale hard-coded filename assertion was fixed to use the canonical revision;
no test or guard was disabled. PDFs remain untagged, with accessible Web primary.

Latest S2 spatial-read checkpoint: full verification passes 426 fast tests,
21 real ephemeral PostgreSQL tests and 33 production-build browser tests; separate
API build passes. Contract tests reject fabricated physical metadata and invalid
topology/node/revision references. Live View runtime asserts the normalized
reference and bilingual diagram-versus-physical qualification; existing theme,
mobile, keyboard and axe checks remain green. No command authority, observation
freshness rule, database schema or physical-coordinate claim is introduced.

Latest S2 read-scope checkpoint: complete verification passes 422 fast tests,
21 real ephemeral PostgreSQL tests and 33 production-build browser tests; API
build passes. New PostgreSQL assertions reject cross-endpoint summary/alarm
access, foreign stock receipt/load-location lineage and prioritize older active
and acknowledged alarms before 101 newer cleared records. Independent
fresh-context review found no introduced blockers; query counts/bounds and
mutation authority remain unchanged. Production-scale query plans are not measured.
Empty alarm runtime review covers both locales/themes, mobile reflow, axe and
keyboard task-queue investigation without a clearance claim.

Latest S2 alarm-context checkpoint: complete verification passes 421 fast tests,
19 ephemeral PostgreSQL integration tests and 32 production-build Chromium tests;
separate API build passes. Tests cover missing bounded task context, unknown alarm
vocabulary with disabled action, permission denial and an accepted unknown
recovery result that must not appear resumed/completed. Browser review covers
acknowledgement and recovery preparation in both locales/themes at 390 px, zero
axe findings, keyboard task investigation and confirmed recovery/audit navigation.
The existing recovery-response guard and backend contracts are unchanged.

Latest S2 workflow-context checkpoint: complete verification passes 418 fast
tests, 19 ephemeral PostgreSQL integration tests and 32 production-build Chromium
tests; separate API build passes. Browser checks review created inbound/outbound
context in both locales/themes at 390 px, native keyboard task investigation,
confirmation/execution and audit links with zero axe findings. A focused regression
asserts bounded recorded SKU hints do not publish raw quantities or impose a false
availability ceiling. Backend allocation/authorization remains authoritative.

## Main entry point

Latest S2 manual PDF checkpoint: full verification passes 417 fast tests,
19 ephemeral PostgreSQL tests and 32 production-build Chromium checks; API build
passes. The complete gate includes source/version, PDF-byte integrity and all
extracted bilingual paragraphs/paths/permissions; negative tests prove stale
source/version, unsafe filenames and tampered artifacts fail. Builds separately
enforce integrity without authoring dependencies. Authenticated download tests
cover per-request revalidation, permission/scope denial, scalar locale/path
allowlisting, no-store/noindex, sanitized failure, both languages and standalone
asset presence. All seven final pages were rendered and reviewed; pinned-font
repeated generation gives identical artifact manifests after fixing FontTools
timestamp recalculation. These exports are not PDF/UA certified.

S2 manual web checkpoint: complete verification passes 406 fast tests,
19 ephemeral PostgreSQL tests and 31 production-build Chromium checks; API build
also passes. Guard/query contracts, localized literal-search/version/link-source
checks, unauthorized audit-link omission, contextual keyboard navigation and
mobile bilingual light/dark axe/reflow pass. Desktop/mobile screenshots were
reviewed. Static manual content reads no warehouse data and grants no authority;
SSR still revalidates session/scope and destination routes independently guard
operations. Versioned PDF export/drift verification remains a subsequent slice.

S2 Live View UI checkpoint: complete verification passes 401 fast tests,
19 ephemeral PostgreSQL integration tests and 30 production-build Chromium
checks. API compilation passes separately. Browser runtime covers scoped work
deep links, native keyboard disclosure, observation expiry, failed-refresh
retention, warehouse context clearing, bilingual mobile light/dark axe and reflow;
desktop/mobile screenshots were reviewed. Pure/guard tests enforce the exact
shared observation deadline; UI tests cover unknown/unresolved equipment and
noncurrent empty evidence. The topology inspector remains independently guarded
at `/operations/warehouse/topology`. This is a qualified read view, not a
calibrated physical layout, atomic snapshot, command authorization or hardware
commissioning evidence. Deployed checks remain nonmutating/unauthenticated;
authenticated production performance remains unmeasured.

`npm run verify` is the required repository-level gate. During M0 it covers the checks the legacy repository can support; each milestone extends it without replacing prior protection.

## Target layers

| Layer             | Evidence                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Formatting/static | Prettier check, ESLint, TypeScript strict typecheck, boundary lint                         |
| Domain            | Fast unit tests for invariants and transitions                                             |
| Simulator         | Deterministic state-machine/scenario tests with a virtual clock                            |
| Persistence/API   | PostgreSQL integration tests, migration up/down checks, authorization/validation contracts |
| Web               | Component tests, accessible-name/focus tests, translation-key parity                       |
| E2E               | Inbound, outbound, fault/recovery, auth/RBAC, responsive and critical keyboard flows       |
| Security          | Production dependency audit, secret scan, headers, abuse/permission tests                  |
| Delivery          | Production builds, image builds, Compose health, migration smoke test                      |

## Principles

- A failure is fixed or explicitly time-boxed with an owner and reason; tests are not deleted to make CI green.
- Randomness is seeded and clocks are injected in domain/simulator tests.
- Hardware adapters pass a shared contract suite with recorded/synthetic device fixtures.
- E2E asserts domain outcomes, not only visible clicks.
- Accessibility combines automated checks with keyboard, zoom, screen-reader, contrast, and reduced-motion review.
- `exit 0` from the complete gate is the only meaning of “verification passed.”

## Current S2 Home baseline

Live View read foundation passes the complete gate: 396 fast tests, 19 PostgreSQL
integration checks and 29 production-build browser flows, plus API build. New
read contracts cover qualifier/unknown semantics, scoped observed and assigned
work, private diagnostic omission, guard consistency, query budgets, HTTP/BFF
permission and per-request scope validation, no-store, sanitized failures,
revision-race rejection, PostgreSQL current/stale bindings and older unknown
work. These checks establish an API foundation, not completed user-facing Live
View. The previous topology correction passed 373/19/29; no checks were disabled.

The active-identity slice adds catalog/asset contracts and source-derived icon
drift checking to the gate: 369 fast tests, 19 PostgreSQL integration tests,
28 production-build E2E checks and API build. Browser checks cover owned icon
availability and all active workspace titles/noindex/Open Graph identity, while
existing locale/theme/mobile/keyboard/axe checks review the shared mark. This
does not add marketing or index private surfaces.

The navigation-quality slice adds overview query-budget/partial-contract,
per-request BFF authorization, route-event cleanup and PostgreSQL scoped output
equivalence checks. Full acceptance is 366 fast tests, 19 PostgreSQL integration
tests and 27 production-build E2E checks plus API build. Browser evidence covers
single combined background refresh, partial Home failure preserving stale
evidence and feedback during held SSR navigation. Auth validation implementation
and its existing revocation/context-switch regression coverage are unchanged.

The Locations operator workspace extends the baseline to 352 fast tests,
19 PostgreSQL integration tests and 26 production-build E2E checks, plus API
build. Authenticated keyboard search, failed pagination retaining existing
evidence, retry/deduplication, configured blocked/disabled and unbound semantics,
related stock/load searches, warehouse switch, bilingual mobile light/dark
axe/reflow and desktop/mobile visual review cover the new read-only surface.

The Locations read-model foundation adds bounded query/contract and HTTP guard
coverage plus a PostgreSQL location/binding/record-count regression. Its full
gate covers 350 fast tests, 19 PostgreSQL integration tests and the existing
25 production-build browser checks; API build is separate. The user-facing
Locations workspace is not included in this foundation checkpoint.

The Loads UI checkpoint passes 334 fast tests, 18 PostgreSQL integration tests
and 25 production-build E2E checks via the complete gate, plus the API build.
New browser evidence covers protected Loads entry, unknown inventory versus
shipped zero balance, keyboard search/empty results, receipt/history and stock
navigation, warehouse switching, bilingual mobile light/dark axe/reflow and
desktop/mobile screenshot review. The shared Inventory subnavigation provides
visible current state and accessible `aria-current`; no movement controls were
added.

The shipped-history correction and Loads read foundation add contract checks for
terminal zero stock, scoped load guards/query validation, and PostgreSQL
unrecorded/partial/shipped load inventory plus foreign receipt isolation. The
complete gate now passes 326 fast tests, 18 PostgreSQL integration tests and 24
production-build E2E checks; API build passes separately. Loads UI remains a
follow-up, so these checks do not imply user-facing Loads completion.

The first inventory visibility checkpoint passes 313 fast tests, 17 ephemeral
PostgreSQL integration tests and 24 production-build Chromium E2E checks in the
complete `npm run verify`; the API build passes separately. New evidence covers
inventory read permissions/scope, bounded scalar search, warehouse/search-bound
keyset cursors, literal wildcard searches, partial outbound reservations,
quarantined residual quantity, stock-versus-received-load quantity, foreign load
lineage, keyboard search/empty state, audit links, warehouse switching and
bilingual mobile light/dark axe/reflow. The prior slice counts below are retained
as historical evidence. Legacy lint warnings remain at 15 with no new errors.

The task queue/detail checkpoint passes the complete `npm run verify`: 300 fast
tests, 16 ephemeral PostgreSQL integration tests, and 23 production-build Chromium
E2E checks. `npm run build:api` also passes. Task coverage adds scoped read guards,
BFF scalar-query/error contracts, microsecond keyset pagination, active/all view
binding, outbound allocation quantity, absent/foreign detail semantics, protected
SSR, contextual audit links, warehouse switching, bilingual mobile dark-theme
axe/reflow, and screenshot review. This supersedes the counts below.

The first S2 Home slice passes 277 fast tests, 15 ephemeral PostgreSQL integration
tests, and 22 production-build Chromium E2E checks. New checks cover nonterminal
work selection, older unknown tasks surviving newer completed history, equipment
observation failure meaning, bounded coverage, Home permission/scope enforcement,
and bilingual mobile light/dark accessibility. The API build passes separately.
The prior S1 evidence below remains relevant; its counts are the S1 checkpoint.

## S1 checkpoint baseline

- `npm run lint`: passes; 15 warnings isolate the effect-driven legacy map/task state machine.
- `npm run typecheck`: strict TypeScript checks the new domain/application/infrastructure modules.
- `npm run test`: 269 fast tests pass across legacy API safety, system-entry/session routing, persisted human-assignment/session issuance, revalidation, revocation and lifecycle evidence, constant-time demo credential proof, opaque failed-login evidence, shared throttling, bounded revocation delivery retry, exact-origin operational mutation enforcement, operational-runtime fail-closed behavior, explicit anonymous-demo expiry, callback rejection, five-surface policy and noindex headers, Nest inbound/outbound/fault-recovery/audit/context-switch HTTP contracts, authenticated operations and permission-gated command-workflow proxies and controls, bounded signed-session warehouse selection with warehouse-local permissions and source/destination-scoped audit evidence, accountable human/anonymous-demo/service attribution and confirmation contracts, deployment-profile/equipment-source fail-closed validation, bounded anonymous-demo carrier issuance, audit pagination/redaction/unknown-action behavior, equipment-observation validation and serialized publication, axe-core UI checks, WCAG token contrast checks, request and audit correlation, outbox retry behavior, route characterization, deterministic inbound/outbound execution, alarm recovery, unknown-outcome reconciliation, topology routing, capability rejection, adapter conformance/trace replay, VDA 5050 v3 mapping, link-loss/stale-telemetry handling, WAN-loss drills, and topology activation.
- `npm run build`: passes on Next.js 16.3.8 after install.
- Production and full audits currently report no known findings; the gate rejects high/critical production findings.
- Fourteen ephemeral PostgreSQL integration tests pass, including fifteen migrations through `0015_enable_platform_row_security.sql`, deny-by-default non-owner table access even after explicit grants, guarded demo backfill, persisted human-session issuance, assignment revalidation, revocation and lifecycle evidence, shared failed-login throttling/security evidence, legacy audit-correlation backfill, warehouse-local idempotency, cross-warehouse task/equipment/audit denial, warehouse-local context-transition evidence, audit projection pagination/redaction/request correlation, principal-specific audit attribution, operations and timestamped equipment-observation projections, monotonic observation writes, stale-to-current heartbeat recovery, persisted capability configuration, binding-complete atomic topology activation, topology-qualified inbound/outbound execution, serialized outbound allocation, deterministic outbound shipping, atomic inventory consumption, idempotent replay, insufficient-inventory rollback, alarm recovery, outbox delivery, and safe demo reset. They run inside `npm run verify` locally and in CI.
- Production build covers the bilingual canonical thin `/` system entry, formal `/login`, dormant `/about` and `/contact` source routes, dynamic robots/root-only sitemap responses, the noindex `/legacy/*` migration-reference namespace, plus SSR-protected `/operations`, `/operations/projections`, `/operations/warehouse`, `/operations/inbound`, `/operations/outbound`, `/operations/alarms`, and `/operations/audit` routes. `/platform`, `/fdp`, and `/engineeringMode` remain permanent compatibility redirects rather than duplicate product surfaces.
- Twenty-one Chromium E2E checks run the production build plus an isolated authenticated WCS fixture. They cover anonymous/authenticated system-entry routing, all operations login redirects, malicious callback rejection, bounded multi-warehouse session switching, private/legacy indexing boundaries, absence of marketing/legacy active navigation, keyboard skip navigation, persisted `zh-TW`/English and exactly-one light/dark/system preference behavior, 200%-equivalent and 390 px reflow, focused and audit projection semantics, topology-qualified equipment observations, warehouse-map and command-workflow mobile reflow, accountable confirmed inbound/outbound/alarm-recovery browser workflows, audit unknown-action and mobile behavior, and deterministic inbound, outbound, and fault/recovery scenarios.
- Manual browser review covers locale and theme switching, server-side auth redirect, desktop layout, and a 390 × 844 mobile viewport. The supported-entry migration was reviewed at desktop and mobile widths in light and dark themes; the 390 px viewport reported matching client and scroll widths, and direct HTTP checks proved all three compatibility redirects plus the legacy noindex header. `npm run test:managed-demo` repeats the public Vercel entry/redirect/indexing/auth-boundary checks and Render liveness check without credentials or mutations. The jsdom axe gate caught duplicate navigation labels; the browser gate caught nested main landmarks, an unfocusable horizontally scrollable table, and a transient low-contrast theme-switch state; the design-token gate caught invalid dark-mode primary-control and danger-control foregrounds.

This baseline is recorded to make debt visible; it is not an acceptable public-deployment gate.
