# Gap Analysis

| Area                 | Current                            | Target                                                      | Priority |
| -------------------- | ---------------------------------- | ----------------------------------------------------------- | -------- |
| Domain               | React state and numeric codes      | Typed aggregates, explicit lifecycle/invariants             | P0       |
| WCS execution        | Timers/effects in UI               | Persisted orchestration with idempotency and uncertainty    | P0       |
| Simulator            | UI animation                       | Deterministic state-machine adapter                         | P0       |
| Equipment boundary   | Echo API                           | Capability/command/telemetry port                           | P0       |
| Security             | Hard-coded login; unauthorised API | Identity, RBAC, validation, audit, protected actions        | P0       |
| Dependencies         | 25 known vulnerabilities           | Supported versions; automated scanning                      | P0       |
| Persistence          | None                               | PostgreSQL migrations and transaction policy                | P0       |
| Testing              | None                               | Unit, integration, simulator, API, a11y, E2E                | P0       |
| Verification         | Lint/build only                    | One local/CI verification entry point                       | P0       |
| UI                   | Prototype dark dashboard           | Industrial operations design system                         | P1       |
| Accessibility        | Ad hoc                             | WCAG 2.2 AA workflow and automated checks                   | P1       |
| i18n                 | Hard-coded zh-TW                   | First-class `zh-TW` and `en` glossary/catalogs              | P1       |
| Theme                | Dark-only                          | Tokenized light/dark/system                                 | P1       |
| Observability        | Console logs                       | Structured logs, request IDs, metrics, health, tracing path | P1       |
| Deployment           | Vercel-oriented Next app           | Docker Compose plus portable web/API images                 | P1       |
| SEO/product identity | Prototype title                    | Public landing/about/contact and private noindex            | P2       |
| Backup/restore       | None                               | Tested runbook and environment-specific retention           | P2       |

## Current operational deltas after product-experience alignment

The original table is retained as discovery history. Current system-side gaps, in dependency order, are:

1. The application still has a single credentials-backed human identity proof. Human grants, warehouse-local permissions, bounded active sessions, and explicit revocation now persist; every JWT restore revalidates current authority. OIDC, assignment administration/access review, failed-login evidence/throttling, revocation retry/administration UI, and the persisted public-demo lifecycle remain incomplete (S1/S3).
2. The operational UI does not yet provide the approved actionable Home, task-centered work context, Operations Live View, or built-in manual/contextual help foundation (S2).
3. Demo reset is still a global truncate that deletes operational audit rows. There is no first-class demo session, TTL/cleanup/quota/capacity lifecycle, or accountable scenario/replay product; S3 must isolate sessions, retain reset-governance evidence separately, and hard-deny production controls.
4. WCS execution lacks product-level reconciliation, scheduling, shared-resource coordination, and governed warehouse/equipment configuration (S4–S6).
5. External WMS/real-equipment integration administration plus production metrics, diagnostics, SLOs, and incident evidence remain incomplete (S7–S8).

## Exit rule

A row leaves this table only when acceptance evidence exists in tests, verification output, or an operational runbook. Documentation alone does not close an implementation gap.
