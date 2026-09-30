# Current architecture assessment

Assessment date: 2026-09-30. Baseline: verified M8A, system-first frontend boundary, deterministic theme/operations fixes, approved product-experience alignment, S1A deployment safety, S1B command isolation, and S1C principal semantics.

## Supported product path

- The repository is one Next.js Pages Router deployment with an internal NestJS API and PostgreSQL. `/operations` is the supported operational home; its focused workflows and projections are server-session protected. `/legacy/*` retains the original prototype only as migration reference.
- The framework-independent core covers versioned directed topology, capability-based routing/assignment, deterministic inbound and outbound execution, inventory allocation, equipment simulation/observations, alarms, recovery, unknown outcomes, outbox delivery, and adapter conformance contracts.
- PostgreSQL migrations, transaction boundaries, container/deployment adapters, CI, unit/API/PostgreSQL/Chromium tests, bilingual catalogs, themes, accessibility checks, backup/restore tooling, structured logging, request IDs, health endpoints, and a persisted audit store exist.
- M8A adds a dedicated `audit.view` read projection and `/operations/audit`: keyset pagination, actor/action/resource/correlation semantics, action-specific evidence allowlists, unknown-action fail-closed behavior, workflow links, and explicit retention/reset limitations.
- Simulation already runs through the real WMS Lite -> WCS -> EquipmentPort -> observation path. Production Hardware and mixed per-equipment sources remain architectural boundaries rather than finished product capabilities.
- S1 read and supported human-command paths now carry a provider-neutral principal, effective user permissions, allowed warehouse scopes, and an explicit current warehouse through SSR/BFF/API validation. Summary, detail, and audit projections plus inbound, outbound, execution, acknowledgement, and recovery repositories constrain referenced records to that warehouse. Command audit rows persist the same principal and warehouse identity.
- Lifecycle environment, deployment profile, and equipment source are distinct server-owned runtime values. API startup and deployment validation reject incompatible profile/source combinations; public and private demos are simulation-only.
- Human, anonymous-demo, and service principals now have distinct validation and audit semantics. Public Demo can issue a short-lived, signed, HttpOnly carrier only from the configured origin in simulation; permissions and warehouse scope are derived server-side, and API boundaries revalidate the forwarded demo-session UUID and expiry.

## Product limitations

- Authentication is still a single environment-backed demo identity. Service permissions and identities are deny-by-default and read scope is explicit, but production OIDC, persistent role/grant administration, identity lifecycle, session revocation, and persisted anonymous-demo lifecycle are not implemented.
- The shell exposes current warehouse, principal, lifecycle environment, deployment profile, equipment source, and projection freshness. The simulator fault-injection endpoint is attributed to its configured service principal; Public Demo issuance and validation contracts exist, but UI entry, persisted sessions, quotas, reset ownership, and cleanup remain S3.
- `/operations` and focused projections expose useful facts but do not yet form the approved actionable Home, task-centered work center, or human-readable next-action experience.
- The current warehouse map is primarily a readable topology/observation view. It is not yet the approved Operations Live View, and topology usability remains limited.
- No built-in single-source web/PDF operation manual or contextual-help foundation exists.
- Warehouse, topology, equipment, and adapter models exist, but governed administration (draft, review, activation, rollback, compatibility impact) does not.
- Execution proves deterministic vertical slices, not fleet-scale scheduling, resource coordination, or complete operator reconciliation.
- External WMS and real equipment integrations are contracts/reference proofs rather than production integration products.
- Structured logs, request IDs, health checks, deployment smoke gates, and backup/restore exist; metrics, tracing, SLOs, alerting, capacity evidence, and production incident diagnostics remain incomplete.
- Audit storage is not claimed to be immutable or tamper-evident. The current demo reset truncates `audit_events`; accountable scenario/reset evidence remains S3.

## Frontend surfaces

- Product intent is system-first: `/` is a thin bilingual system entry whose single primary action resolves to `/login` for anonymous visitors and `/operations` for authenticated operators. It is not a marketing landing page.
- `/login` is the formal, responsive, accessible, noindex sign-in surface. Operations SSR guards preserve only validated internal `/operations` callback destinations; external, credential-bearing, malformed, legacy, login, and paused marketing destinations fail closed to `/operations`.
- `/operations` is the authenticated system home and `/operations/*` contains active operational capabilities. Active operations navigation contains no About, Contact, Legacy, repository, or sales links.
- `/legacy/*` remains a noindex migration reference. `/about` and `/contact` source routes remain available for possible future reuse but are absent from the active entry/navigation and the current sitemap.
- Public, login, operations, BFF/API, and legacy route policy is centralized for classification and response headers. Public pages omit the NextAuth session provider; login/operations receive auth, locale, and theme providers; legacy receives only the session provider required by the prototype.
- Pages Router still requires legacy global CSS imports in `_app.js`, so stylesheet payload/isolation is not complete. Removing that coupling requires a separately characterized legacy migration or router/build boundary and was not justified for this checkpoint.

## Legacy migration reference

The original React/SVG prototype still contains large stateful map/task components, UI-owned timers, fixed-coordinate/path assumptions, and engineering controls that are not supported product capabilities. It remains useful for visual and scenario characterization only. It must not define routing truth, equipment state, authorization, or a physical-control safety boundary.

## Next architecture priorities

1. Complete S1 session/access-denied behavior, permission-aware navigation/actions, and bounded warehouse-context selection/evidence.
2. S2 actionable work center, inventory visibility, Operations Live View foundation, readable topology, and manual/contextual-help foundation.
3. S3 guarded scenario lifecycle with evidence surviving reset and production hard-deny.
4. S4–S6 reconciliation, scheduling/resource coordination, and governed configuration.
5. S7–S8 external integration, commissioning, and commercial production operability.

See the approved [Product Experience Direction](../product/approved-product-experience-direction.md) for the governing sequence and user-facing definition of done.
