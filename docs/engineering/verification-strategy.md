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
- `npm run test`: 43 fast tests pass across legacy API safety, Nest inbound HTTP contracts, request correlation, outbox retry behavior, route characterization, application services, deterministic domain/simulator behavior, topology routing, capability rejection, and topology activation.
- `npm run build`: passes on Next.js 16.3 after install.
- Production and full audits currently report no known findings; the gate rejects high/critical production findings.
- Four ephemeral PostgreSQL integration tests pass, including migrations through `0003_configurable_topology.sql`, persisted capability configuration, atomic topology activation, inbound transactions, outbox delivery, and safe demo reset. They run inside `npm run verify` locally and in CI.
- Accessibility, responsive, and browser E2E coverage remain open.

This baseline is recorded to make debt visible; it is not an acceptable public-deployment gate.
