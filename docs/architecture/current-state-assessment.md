# Current architecture assessment

Assessment date: 2026-10-04. Baseline: verified M8A, system-first frontend boundary, completed S1 accountable access/deployment safety, and accepted S2 operational read/workflow foundation. See the S2 acceptance matrix for tested responsibilities and remaining product limits.

## Supported product path

- Spatial read contract v1 qualifies positions as versioned topology-node references,
  not measured physical coordinates. Diagram coordinate-system identifiers are
  preserved separately; units, floors, coordinate frames and calibration remain
  unrecorded. Live View and engineering inspection expose the same qualification.
  Unknown position has no normalized reference. Physical authoring remains S6.

- S3 begins with a bounded persisted anonymous admission/expiry control ledger,
  isolated from resettable operational audit. Database transactions serialize
  capacity/replay and atomically record evidence. Provisioning/expired rows grant
  no access and remain capacity-consuming until verified cleanup. Isolated
  reference-workspace snapshots use new warehouse/topology/location/equipment
  identities, explicit bindings and inactive descriptors, without operational
  history, observation or human-grant copy. Virtual equipment runtime ownership
  and persisted request authorization are not yet implemented; browser issuance
  and old carriers fail closed. Source diagram/opaque metadata is not runtime
  isolation or physical calibration evidence (ADR 0024). A leased/fenced trusted
  repository now removes only inactive reference namespaces, archives identity
  evidence, verifies absence and atomically closes reservations to release
  capacity (ADR 0025). It refuses active/observed/assigned/operational resources;
  no cleanup worker is enabled and live simulator drain is not implemented.

- Inbound/outbound reviews now lead with submitted reference, item/quantity and readable route context, with persisted task investigation and diagnostic disclosure. Recorded outbound SKU hints do not assert reservation-adjusted availability. Alarm/recovery views qualify bounded context and unknown outcomes; unknown recovery results are not reported as resumed/completed. Summary/alarm task endpoints and stock receipt/load-location lineage enforce warehouse isolation consistently. Independent review found no introduced read-scope blockers; production-scale query plans remain unmeasured.

- The repository is one Next.js Pages Router deployment with an internal NestJS API and PostgreSQL. `/operations` is the supported operational home; its focused workflows and projections are server-session protected. `/legacy/*` retains the original prototype only as migration reference.
- The framework-independent core covers versioned directed topology, capability-based routing/assignment, deterministic inbound and outbound execution, inventory allocation, equipment simulation/observations, alarms, recovery, unknown outcomes, outbox delivery, and adapter conformance contracts.
- PostgreSQL migrations, transaction boundaries, container/deployment adapters, CI, unit/API/PostgreSQL/Chromium tests, bilingual catalogs, themes, accessibility checks, backup/restore tooling, structured logging, request IDs, health endpoints, and a persisted audit store exist.
- M8A adds a dedicated `audit.view` read projection and `/operations/audit`: keyset pagination, actor/action/resource/correlation semantics, action-specific evidence allowlists, unknown-action fail-closed behavior, workflow links, and explicit retention/reset limitations.
- Simulation already runs through the real WMS Lite -> WCS -> EquipmentPort -> observation path. Production Hardware and mixed per-equipment sources remain architectural boundaries rather than finished product capabilities.
- S1 read and supported human-command paths now carry a provider-neutral principal, effective user permissions, allowed warehouse scopes, and an explicit current warehouse through SSR/BFF/API validation. Summary, detail, and audit projections plus inbound, outbound, execution, acknowledgement, and recovery repositories constrain referenced records to that warehouse. Command audit rows persist the same principal and warehouse identity.
- Lifecycle environment, deployment profile, and equipment source are distinct server-owned runtime values. API startup and deployment validation reject incompatible profile/source combinations; public and private demos are simulation-only.
- Human, anonymous-demo, and service principals have distinct validation and audit semantics. The signed anonymous carrier is a characterized primitive; S3 pauses browser issuance and old-carrier operational authorization until isolated persisted provisioning/access exist (ADR 0023). Trusted service-only forwarded anonymous contexts retain compatibility validation, not completed public isolation.
- Operations pages derive action capabilities from the validated server-side access context. Inbound, outbound, execution, acknowledgement, recovery, audit navigation, and workflow-evidence links are hidden or disabled when their permission is absent, with an operator-readable explanation; BFF/API enforcement remains authoritative. Expired anonymous-demo sessions return to `/login` with a validated operations callback and an explicit bilingual notice.
- Multi-scope human sessions expose a responsive, bilingual current-warehouse selector. The browser proposes only a target UUID; the signed-session callback and authenticated API independently revalidate scope, atomically record source/destination warehouse audit evidence, and update the current claim only after persistence succeeds. Single-scope sessions retain a static context label.
- Human identity is resolved by stable provider/subject into persisted, warehouse-local assignments after the demo credentials adapter proves identity. The resolver requires the dedicated `access.resolve` service permission, fails closed for disabled/expired/ambiguous grants, and records successful login evidence without storing credentials or cross-warehouse grant details.
- Human sessions have a persisted UUID, bounded expiry, current warehouse, and revocation state. Strict restores revalidate the session/current assignments; explicitly wrapped GET-only Operations reads may reuse encrypted claims for configurable bounded freshness (default 60 minutes, 0 restores immediate read revalidation). Expiry, warehouse updates and mutation validation remain independent. No event-driven invalidation exists: read revocation/outage detection can be delayed until freshness or expiry. Sign-out and administrative revocation are idempotent and attributable. See ADR 0022.
- Custom browser-facing operational mutations require the configured `NEXTAUTH_URL` application origin before session resolution; this remains independent of the public-site origin for a future `www`/`app` deployment split.

## Product limitations

- Authentication is still a single environment-backed demo identity proof. Human grants, sessions, opaque failed-proof evidence, and shared throttling are persisted; service permissions/identities remain deny-by-default, and sign-out revocation has bounded observable retry. Production OIDC, assignment/role administration, durable revocation delivery/administration UI, security-event retention/export, and persisted anonymous-demo lifecycle are not implemented.
- PostgreSQL platform tables use deny-by-default row-level security for non-owner roles. The dedicated table-owning API connection remains the only data path; warehouse permission and scope enforcement stays at the authorized API boundary rather than being duplicated into provider-facing database policies.
- The shell exposes current warehouse, principal, lifecycle environment, deployment profile, equipment source, and projection freshness. The simulator fault-injection endpoint is attributed to its configured service principal; Public Demo issuance and validation contracts exist, but UI entry, persisted sessions, quotas, reset ownership, and cleanup remain S3.
- `/operations` prioritizes server-classified attention and active/waiting work with readable location/state meaning and evidence navigation. Home explicitly reports bounded coverage and last-known data on refresh failure. `/operations/tasks` provides a warehouse-scoped active/all paginated queue; detail exposes persisted work/load/route/alarm context and `audit.view`-gated evidence links. The approved S2 foundation is accepted; advanced overrides and reconciliation remain S4, not an implied shipped capability.
- `/operations/inventory` provides warehouse-scoped literal search and keyset pages, stock balances, active reservations, residual available-state stock, readable load/location context, and permission-gated receipt history. It is not physical observation or allocation authorization.
- `/api/v1/operations/loads` and authenticated `/operations/loads` provide scoped paginated load context. Received quantity and optional current inventory remain distinct; shipped history is zero current stock, missing inventory is unknown. Inventory workspace navigation connects stock, loads and `/operations/locations`. Locations reads scoped configured state and active-version bindings, with separate historical load/non-shipped stock record counts and related substring searches; no physical occupancy, safety authorization or configuration mutation is implied.
- `/operations/warehouse` provides the qualified daily Live View foundation: readable equipment state, current/last-known/unknown position, observed-versus-assigned work, alarm context and scoped deep links. Serialized observation deadlines allow browser downgrade only. `/operations/warehouse/topology` preserves the engineering diagram; neither is a calibrated floorplan or command authorization.
- `/operations/help` provides a versioned bilingual searchable manual and workflow-specific contextual links. A single structured source produces offline PDF artifacts; authenticated no-store/noindex download routes revalidate session/permission/scope. Source/hash/extracted-text checks prevent drift, and standalone tracing includes private assets. The accessible web manual is primary; exported PDFs are searchable Unicode but not tagged/PDF-UA certified. See [S2 acceptance evidence](../project/s2-acceptance-evidence.md).
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

1. S3 isolated persisted demo-session lifecycle, with evidence surviving reset and production hard-deny; only after S2 delivery gates pass.
2. S4–S6 reconciliation, scheduling/resource coordination, and governed configuration.
3. S7–S8 external integration, production identity, commissioning, and commercial production operability.

See the approved [Product Experience Direction](../product/approved-product-experience-direction.md) for the governing sequence and user-facing definition of done.
