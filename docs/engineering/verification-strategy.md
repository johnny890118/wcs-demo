# Verification Strategy

## Main entry point

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
