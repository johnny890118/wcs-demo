# Current architecture assessment

Assessment date: 2026-09-21. Baseline: verified M8A, system-first frontend boundary, deterministic theme/operations fixes, and approved product-experience alignment.

## Supported product path

- The repository is one Next.js Pages Router deployment with an internal NestJS API and PostgreSQL. `/operations` is the supported operational home; its focused workflows and projections are server-session protected. `/legacy/*` retains the original prototype only as migration reference.
- The framework-independent core covers versioned directed topology, capability-based routing/assignment, deterministic inbound and outbound execution, inventory allocation, equipment simulation/observations, alarms, recovery, unknown outcomes, outbox delivery, and adapter conformance contracts.
- PostgreSQL migrations, transaction boundaries, container/deployment adapters, CI, unit/API/PostgreSQL/Chromium tests, bilingual catalogs, themes, accessibility checks, backup/restore tooling, structured logging, request IDs, health endpoints, and a persisted audit store exist.
- M8A adds a dedicated `audit.view` read projection and `/operations/audit`: keyset pagination, actor/action/resource/correlation semantics, action-specific evidence allowlists, unknown-action fail-closed behavior, workflow links, and explicit retention/reset limitations.
- Simulation already runs through the real WMS Lite -> WCS -> EquipmentPort -> observation path. Production Hardware and mixed per-equipment sources remain architectural boundaries rather than finished product capabilities.

## Product limitations

- Authentication is still a single environment-backed demo identity. Service permissions are deny-by-default, but production user RBAC, identity lifecycle, session revocation, and warehouse/site scope are not implemented.
- The header does not yet expose an accountable current warehouse/environment/equipment-source/principal context, and operations queries are not warehouse-scoped end to end.
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

1. S1 accountable principal, effective permissions, explicit warehouse context, session lifecycle, and role-aware Home/navigation foundation.
2. S2 actionable work center, inventory visibility, Operations Live View foundation, readable topology, and manual/contextual-help foundation.
3. S3 guarded scenario lifecycle with evidence surviving reset and production hard-deny.
4. S4–S6 reconciliation, scheduling/resource coordination, and governed configuration.
5. S7–S8 external integration, commissioning, and commercial production operability.

See the approved [Product Experience Direction](../product/approved-product-experience-direction.md) for the governing sequence and user-facing definition of done.
