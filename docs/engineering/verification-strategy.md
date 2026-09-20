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

## Current baseline

- `npm run lint`: passes; 15 warnings isolate the effect-driven legacy map/task state machine.
- `npm run typecheck`: strict TypeScript checks the new domain/application/infrastructure modules.
- `npm run test`: 192 fast tests pass across legacy API safety, system-entry/session routing, callback rejection, five-surface policy and noindex headers, Nest inbound/outbound/fault-recovery/audit HTTP contracts, authenticated operations and command-workflow proxies, accountable operator identity and confirmation contracts, audit pagination/redaction/unknown-action behavior, equipment-observation validation and publication, axe-core UI checks, WCAG token contrast checks, request and audit correlation, outbox retry behavior, route characterization, deterministic inbound/outbound execution, alarm recovery, unknown-outcome reconciliation, topology routing, capability rejection, adapter conformance/trace replay, VDA 5050 v3 mapping, link-loss/stale-telemetry handling, WAN-loss drills, and topology activation.
- `npm run build`: passes on Next.js 16.3 after install.
- Production and full audits currently report no known findings; the gate rejects high/critical production findings.
- Nine ephemeral PostgreSQL integration tests pass, including nine migrations through `0009_audit_correlation.sql`, legacy audit-correlation backfill, audit projection pagination/redaction/request correlation, operations and timestamped equipment-observation projections, monotonic observation writes, stale-to-current heartbeat recovery, persisted capability configuration, binding-complete atomic topology activation, topology-qualified inbound/outbound execution, serialized outbound allocation, deterministic outbound shipping, atomic inventory consumption, idempotent replay, insufficient-inventory rollback, alarm recovery, outbox delivery, and safe demo reset. They run inside `npm run verify` locally and in CI.
- Production build covers the bilingual canonical thin `/` system entry, formal `/login`, dormant `/about` and `/contact` source routes, dynamic robots/root-only sitemap responses, the noindex `/legacy/*` migration-reference namespace, plus SSR-protected `/operations`, `/operations/projections`, `/operations/warehouse`, `/operations/inbound`, `/operations/outbound`, `/operations/alarms`, and `/operations/audit` routes. `/platform`, `/fdp`, and `/engineeringMode` remain permanent compatibility redirects rather than duplicate product surfaces.
- Nineteen Chromium E2E checks run the production build plus an isolated authenticated WCS fixture. They cover anonymous/authenticated system-entry routing, all operations login redirects, malicious callback rejection, private/legacy indexing boundaries, absence of marketing/legacy active navigation, keyboard skip navigation, persisted `zh-TW`/English and light/dark/system behavior, 200%-equivalent and 390 px reflow, focused and audit projection semantics, topology-qualified equipment observations, warehouse-map and command-workflow mobile reflow, accountable confirmed inbound/outbound/alarm-recovery browser workflows, audit unknown-action and mobile behavior, and deterministic inbound, outbound, and fault/recovery scenarios.
- Manual browser review covers locale and theme switching, server-side auth redirect, desktop layout, and a 390 × 844 mobile viewport. The supported-entry migration was reviewed at desktop and mobile widths in light and dark themes; the 390 px viewport reported matching client and scroll widths, and direct HTTP checks proved all three compatibility redirects plus the legacy noindex header. `npm run test:managed-demo` repeats the public Vercel entry/redirect/indexing/auth-boundary checks and Render liveness check without credentials or mutations. The jsdom axe gate caught duplicate navigation labels; the browser gate caught nested main landmarks, an unfocusable horizontally scrollable table, and a transient low-contrast theme-switch state; the design-token gate caught invalid dark-mode primary-control and danger-control foregrounds.

This baseline is recorded to make debt visible; it is not an acceptable public-deployment gate.
