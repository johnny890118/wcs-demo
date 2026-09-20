# Current architecture assessment

Assessment date: 2026-09-21. Baseline: verified M8A plus the system-first frontend boundary checkpoint.

## Supported product path

- The repository is one Next.js Pages Router deployment with an internal NestJS API and PostgreSQL. `/operations` is the supported operational home; its focused workflows and projections are server-session protected. `/legacy/*` retains the original prototype only as migration reference.
- The framework-independent core covers versioned directed topology, capability-based routing/assignment, deterministic inbound and outbound execution, inventory allocation, equipment simulation/observations, alarms, recovery, unknown outcomes, outbox delivery, and adapter conformance contracts.
- PostgreSQL migrations, transaction boundaries, container/deployment adapters, CI, unit/API/PostgreSQL/Chromium tests, bilingual catalogs, themes, accessibility checks, backup/restore tooling, structured logging, request IDs, health endpoints, and a persisted audit store exist.
- M8A adds a dedicated `audit.view` read projection and `/operations/audit`: keyset pagination, actor/action/resource/correlation semantics, action-specific evidence allowlists, unknown-action fail-closed behavior, workflow links, and explicit retention/reset limitations.

## Product limitations

- Authentication is still a single environment-backed demo identity. Service permissions are deny-by-default, but production user RBAC, identity lifecycle, session revocation, and warehouse/site scope are not implemented.
- Warehouse, topology, equipment, and adapter models exist, but governed administration (draft, review, activation, rollback, compatibility impact) does not.
- Execution proves deterministic vertical slices, not fleet-scale scheduling, resource coordination, or complete operator reconciliation.
- External WMS and real equipment integrations are contracts/reference proofs rather than production integration products.
- Structured logs, request IDs, health checks, deployment smoke gates, and backup/restore exist; metrics, tracing, SLOs, alerting, capacity evidence, and production incident diagnostics remain incomplete.
- Audit storage is not claimed to be immutable or tamper-evident. The current demo reset truncates `audit_events`; accountable reset/replay remains M8B.

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

1. Guarded demo reset/replay with evidence surviving reset.
2. Production identity, user RBAC, and warehouse scope.
3. Governed warehouse/topology/equipment administration.
4. WCS scheduling, resource coordination, and reconciliation.
5. External integration productization and production operability/diagnostics.
