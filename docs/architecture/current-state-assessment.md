# Current architecture assessment

Assessment date: 2026-10-03. Baseline: verified M8A, system-first frontend boundary, deterministic theme/operations fixes, approved product-experience alignment, and completed S1 accountable access/deployment safety including persisted assignments/sessions, failed-proof protection, database direct-access denial, and operational mutation-origin enforcement.

## Supported product path

- The repository is one Next.js Pages Router deployment with an internal NestJS API and PostgreSQL. `/operations` is the supported operational home; its focused workflows and projections are server-session protected. `/legacy/*` retains the original prototype only as migration reference.
- The framework-independent core covers versioned directed topology, capability-based routing/assignment, deterministic inbound and outbound execution, inventory allocation, equipment simulation/observations, alarms, recovery, unknown outcomes, outbox delivery, and adapter conformance contracts.
- PostgreSQL migrations, transaction boundaries, container/deployment adapters, CI, unit/API/PostgreSQL/Chromium tests, bilingual catalogs, themes, accessibility checks, backup/restore tooling, structured logging, request IDs, health endpoints, and a persisted audit store exist.
- M8A adds a dedicated `audit.view` read projection and `/operations/audit`: keyset pagination, actor/action/resource/correlation semantics, action-specific evidence allowlists, unknown-action fail-closed behavior, workflow links, and explicit retention/reset limitations.
- Simulation already runs through the real WMS Lite -> WCS -> EquipmentPort -> observation path. Production Hardware and mixed per-equipment sources remain architectural boundaries rather than finished product capabilities.
- S1 read and supported human-command paths now carry a provider-neutral principal, effective user permissions, allowed warehouse scopes, and an explicit current warehouse through SSR/BFF/API validation. Summary, detail, and audit projections plus inbound, outbound, execution, acknowledgement, and recovery repositories constrain referenced records to that warehouse. Command audit rows persist the same principal and warehouse identity.
- Lifecycle environment, deployment profile, and equipment source are distinct server-owned runtime values. API startup and deployment validation reject incompatible profile/source combinations; public and private demos are simulation-only.
- Human, anonymous-demo, and service principals now have distinct validation and audit semantics. Public Demo can issue a short-lived, signed, HttpOnly carrier only from the configured origin in simulation; permissions and warehouse scope are derived server-side, and API boundaries revalidate the forwarded demo-session UUID and expiry.
- Operations pages derive action capabilities from the validated server-side access context. Inbound, outbound, execution, acknowledgement, recovery, audit navigation, and workflow-evidence links are hidden or disabled when their permission is absent, with an operator-readable explanation; BFF/API enforcement remains authoritative. Expired anonymous-demo sessions return to `/login` with a validated operations callback and an explicit bilingual notice.
- Multi-scope human sessions expose a responsive, bilingual current-warehouse selector. The browser proposes only a target UUID; the signed-session callback and authenticated API independently revalidate scope, atomically record source/destination warehouse audit evidence, and update the current claim only after persistence succeeds. Single-scope sessions retain a static context label.
- Human identity is resolved by stable provider/subject into persisted, warehouse-local assignments after the demo credentials adapter proves identity. The resolver requires the dedicated `access.resolve` service permission, fails closed for disabled/expired/ambiguous grants, and records successful login evidence without storing credentials or cross-warehouse grant details.
- Human sessions now have a persisted UUID, bounded expiry, current warehouse, and revocation state. Every JWT restore revalidates the session and current assignments; sign-out and administrative revocation are idempotent and attributable.
- Custom browser-facing operational mutations require the configured `NEXTAUTH_URL` application origin before session resolution; this remains independent of the public-site origin for a future `www`/`app` deployment split.

## Product limitations

- Authentication is still a single environment-backed demo identity proof. Human grants, sessions, opaque failed-proof evidence, and shared throttling are persisted; service permissions/identities remain deny-by-default, and sign-out revocation has bounded observable retry. Production OIDC, assignment/role administration, durable revocation delivery/administration UI, security-event retention/export, and persisted anonymous-demo lifecycle are not implemented.
- PostgreSQL platform tables use deny-by-default row-level security for non-owner roles. The dedicated table-owning API connection remains the only data path; warehouse permission and scope enforcement stays at the authorized API boundary rather than being duplicated into provider-facing database policies.
- The shell exposes current warehouse, principal, lifecycle environment, deployment profile, equipment source, and projection freshness. The simulator fault-injection endpoint is attributed to its configured service principal; Public Demo issuance and validation contracts exist, but UI entry, persisted sessions, quotas, reset ownership, and cleanup remain S3.
- `/operations` prioritizes server-classified attention and active/waiting work with readable location/state meaning and evidence navigation. Home explicitly reports bounded coverage and last-known data on refresh failure. `/operations/tasks` provides a warehouse-scoped active/all paginated queue; detail exposes persisted work/load/route/alarm context and `audit.view`-gated evidence links. The full approved work-center experience remains S2 work.
- `/operations/inventory` now provides warehouse-scoped literal search and keyset pages, stock balances, active reservations, residual available-state stock, readable load/location context, and permission-gated receipt history. It is not physical observation or allocation authorization. Full load/location workspaces and Live View/help remain S2 work.
- `/api/v1/operations/loads` and authenticated `/operations/loads` provide scoped paginated load context. Received quantity and optional current inventory remain distinct; shipped history is zero current stock, missing inventory is unknown. Inventory workspace navigation connects stock, loads and `/operations/locations`. Locations reads scoped configured state and active-version bindings, with separate historical load/non-shipped stock record counts and related substring searches; no physical occupancy, safety authorization or configuration mutation is implied.
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

1. S2 actionable work center, inventory visibility, Operations Live View foundation, readable topology, and manual/contextual-help foundation.
2. S3 guarded scenario lifecycle with evidence surviving reset and production hard-deny.
3. S4–S6 reconciliation, scheduling/resource coordination, and governed configuration.
4. S7–S8 external integration, production identity, commissioning, and commercial production operability.

See the approved [Product Experience Direction](../product/approved-product-experience-direction.md) for the governing sequence and user-facing definition of done.
