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

1. S2 foundations are accepted against the [cross-workflow evidence matrix](s2-acceptance-evidence.md): actionable Home, task queue/detail, readable inbound/outbound and alarm/recovery context, Inventory/Loads/Locations, qualified daily Live View with separate engineering inspection, explicit persisted binding correctness, spatial read vocabulary, and synchronized single-source bilingual Web/PDF manual. Calibrated physical layout stays S6; authenticated deployed performance remains unmeasured, and exported Unicode PDFs are not tagged/PDF-UA certified. More than 100 unresolved alarms still require future paginated exception-control work (S4); bounded absence is not clearance. S3 is the next dependency, not another S2 rebuild.
2. Demo reset is still a global truncate that deletes operational audit rows. S3 has a separate bounded reservation/expiry control ledger, inactive owned reference snapshots and a leased/fenced inactive-reference cleanup repository with atomic archived evidence/capacity release. No worker is enabled; this is not active simulator cleanup or a completed public TTL/quota lifecycle. Public browser issuance and old carriers fail closed pending virtual equipment/runtime isolation, every-request persisted access, runtime cleanup and abuse gates. Accountable scenario/replay and production hard-deny remain S3 work.
3. WCS execution lacks product-level reconciliation, scheduling, shared-resource coordination, and governed warehouse/equipment configuration (S4–S6).
4. The enabled product still uses a single credentials-backed private-demo identity proof. The S1 authorization/session foundation is complete, but production OIDC, provider logout, MFA/conditional-access policy, assignment administration/access review, durable revocation delivery, shared edge abuse controls, and security-event retention/export remain production gates rather than S2 blockers (S8).
5. External WMS/real-equipment integration administration plus production metrics, diagnostics, SLOs, and incident evidence remain incomplete (S7–S8).

## Exit rule

A row leaves this table only when acceptance evidence exists in tests, verification output, or an operational runbook. Documentation alone does not close an implementation gap.
