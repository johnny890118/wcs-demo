# S2 Operational Work Center Plan

Status: Active

## Autonomous continuation

Owner queued two product-quality slices on 2026-10-03, after the active Locations
checkpoint: (1) measure and improve operations navigation latency, including SSR,
persisted session revalidation and repeated Vercel/Render/PostgreSQL round trips;
never weaken S1 fail-closed revalidation, scope, permissions or audit, and do not
cache authority across requests; (2) inventory active titles/icons/metadata/OG,
login/operations/entry/navigation and replace legacy WCS Demo/female.png identity
with Smart Warehouse Platform and a neutral replaceable SWP placeholder icon.
Each requires runtime review, full verification, clean commit/push/CI and deployed
confirmation before resuming the next S2 feature slice. Keep both separate from
the currently active Locations capability.

Owner confirmed on 2026-10-03: after each verified, pushed, CI-stable clean
checkpoint, continue directly to the next coherent roadmap slice. Routine
checkpoint acceptance is not an Owner gate. Stop only for an Owner-only decision
or authorization blocker; do not broaden scope or skip verification to continue.

## Next load-read foundation

Before Loads UI, add a scoped searchable paginated load projection. Preserve
original received quantity separately from optional current inventory balance;
missing inventory is unknown/not recorded, never asserted zero. Read load's
persisted location without inferring live position. Scope both load and optional
inventory location; inconsistent foreign inventory lineage fails closed. Receipt
context is readable; audit access remains separately enforced. No load mutation,
transfer, adjustment, or reconciliation is added. This is a medium-risk read
boundary using the existing plan and authorization, not a new ADR decision.

Loads foundation implementation: `/api/v1/operations/loads` requires
`operations.view` plus current warehouse scope; source receipt, recorded load
location and optional inventory location all belong to that warehouse. Inventory
reads also validate receipt warehouse ownership. Literal search, bounded UUID
keyset pages and surface/warehouse/search-bound cursors preserve isolation.
Missing inventory remains null; shipped historical inventory projects zero
current stock; original received quantity stays separate. API permission/query
contracts and PostgreSQL partial/shipped/unrecorded balances, literal search,
pagination, cursor replay and foreign receipt tests cover this foundation. The
operator Loads UI is the next slice, not implied complete by the API checkpoint.

## Loads operator workspace

`/operations/loads` uses the scoped read projection, SSR authentication and a
read-only BFF. Shared Inventory workspace navigation connects stock and loads
without adding marketing or another top-level application concern. Search is
literal and bounded; load-more state resets by warehouse/search/projection.
Unavailable results are visibly noncurrent. Null inventory is not recorded,
shipped inventory is zero current balance, and original receipt quantity is
separate. Both load and inventory recorded states remain readable; location
disagreement warns rather than fabricating a position. `audit.view` gates receipt
history links while inventory context remains available under `operations.view`.

| Before                                              | After                                                                       | Why                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Loads exist only in task/diagnostic context         | Searchable dedicated read workspace                                         | Investigate received loads even before inventory exists                       |
| Received quantity can be mistaken for current stock | Separate original quantity and optional current balance                     | Missing stock evidence is not zero and shipped history is not available stock |
| Inventory/load navigation is disconnected           | Shared local workspace navigation with visible and accessible current state | Preserve the approved Inventory information architecture                      |
| Stock state could be hidden behind a number         | Readable quarantine/reserved/shipped state plus inventory context link      | Quantity alone is not allocation readiness                                    |

The slice is medium-risk UI/read security work with no mutation or auth-model
change. Contract/BFF/SSR tests and production-browser keyboard search, empty
state, unknown/shipped evidence, stock deep link, warehouse switching, theme,
locale, axe/reflow and desktop/mobile screenshot review are the acceptance gates.
Locations workspace, Live View and Help remain subsequent S2 slices.

## Locations read/view acceptance

Medium-risk read-only inventory workspace slice. Use persisted warehouse-local
locations, active versioned bindings, recorded load counts and non-shipped stock
record counts. Never sum mixed SKU quantities, infer physical occupancy/capacity,
or equate matching codes to topology identity. Search and keyset pagination stay
bounded and scoped; disabled/blocked/unbound locations remain visible. Link to
related load/stock searches with explicit search semantics, not exact location
filters. No configuration mutation (S6), task control (S4) or hardware inference.
Verify permissions/scope, binding revision, foreign/terminal record counts,
pagination, empty/unavailable states, keyboard, language/theme, and mobile.

Locations is split into independently verifiable read-model and operator UI
checkpoints, as Loads was. The foundation exposes
`/api/v1/operations/locations` under existing `operations.view` and current
warehouse guards. SQL selects explicit bindings for the active topology revision;
codes never substitute for node identity. Receipt/load/inventory lineage is
warehouse-scoped. Recorded load counts retain shipped history; non-shipped stock
record counts are not quantity or occupancy. Literal code/kind search and UUID
keyset cursors are surface/warehouse/search-bound. Disabled, blocked and unbound
configuration remains readable. HTTP/query/contract and PostgreSQL lineage,
pagination, active binding and shipped-record checks cover the foundation; UI
acceptance remains pending until the subsequent workspace slice.

## Locations operator workspace

`/operations/locations` completes the read-only Inventory subworkspace with
authenticated SSR and scalar-query/session guarded BFF. Warehouse/search changes
remount loaded state. Search, refresh, deduplicated load-more, empty and
unavailable states preserve evidence without claiming currency. Configuration
status is explicitly labelled as configured, not safe-to-command. Unbound active
topology is visible as requiring review; raw version/node identity and capability
codes stay in keyboard-accessible diagnostics. Related stock/load links are
explicitly substring searches, not exact location inventories. Counts are rows,
not mixed-SKU quantity or occupancy; shipped load history can remain recorded.
No configuration writes, controls, marketing or reset/replay are included.

| Before                                                  | After                                                    | Why                                                            |
| ------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| Locations only appear inside technical diagnostics      | Searchable dedicated Inventory subworkspace              | Operators can investigate location context without source code |
| Configuration may be mistaken for physical availability | Configured-state wording and safety caveat               | No read-only flag authorizes movement                          |
| Binding identity is implicit in readable code           | Explicit active-version binding with diagnostic identity | Location codes are not topology node IDs                       |
| Record counts may imply capacity or occupancy           | Separate historical load rows and non-shipped stock rows | Persisted records are not physical observations                |

Self-review applies the Emil skill: calm token-based styling, 44px controls,
localized human meaning before raw identifiers and native keyboard disclosure.
Production-browser review covers blocked/disabled/unbound states, failed
load-more retaining evidence, successful retry/deduplication, keyboard search and
empty results, related searches, warehouse switch, mobile light/dark axe/reflow,
and desktop/mobile screenshots. Locations configuration administration remains
S6, task controls S4. Live View/readable topology is the next S2 slice.

## Outcome

Turn the authenticated operations surface into a task-centered work center that
explains current work, exceptions, inventory, and trustworthy equipment state in
human-readable terms. Reuse persisted projections; the browser must not infer
warehouse truth.

## Risk and decision record

This is a medium-risk, multi-slice product and read-model change. A persistent
plan is required because Home, task detail, inventory visibility, Live View, and
help cannot safely ship as one change. No new ADR is required for the first
slice: it applies the approved product-experience direction and reuses the
existing warehouse-scoped operations projection rather than introducing a new
source of truth.

## Slices

1. **Actionable Operations Home** — replace the KPI-first overview with a
   server-derived, warehouse-scoped work and attention projection; provide
   readable locations, state meaning, next navigation, freshness, bilingual
   responsive UI, and contract/runtime coverage.
2. **Task queue and task detail** — progressive disclosure from human meaning to
   route, equipment, load/order/receipt origin, commands, alarms, and audit
   evidence.
3. **Inventory, loads, and locations** — searchable operational inventory truth
   with readable location context and history links.
4. **Live View and readable topology** — build on qualified observations and
   explicit location-to-node bindings; never infer physical state from task
   assignment.
5. **Manual foundation and contextual help** — structured bilingual operational
   guidance connected to shipped workflows.

## Slice 1 acceptance

- `/operations` prioritizes attention and waiting/active work over KPI analytics.
- The API, not the browser, classifies blocked/unknown work, actionable alarms,
  and unhealthy/stale/disconnected equipment.
- The projection is authorized by `operations.view` and current warehouse scope.
- Human-readable source/destination codes are primary; raw identifiers remain
  secondary.
- Empty, unavailable, stale, light/dark, `zh-TW`/`en`, keyboard, mobile, and
  desktop states are verified.
- Existing details, alarm recovery, warehouse, inbound/outbound, and audit
  projections remain the sources for deeper workflows.

## Explicit non-scope

- Public Website or Public Demo work
- Manual task override or scheduler behavior
- M8B reset/replay
- A second dashboard aggregate or browser-derived operational truth
- Production hardware commissioning claims

## First Home slice implementation and review

The `/api/v1/operations/home` contract reuses `OperationsSummaryService`
warehouse-scoped queries and a pure application projection. The Home query
selects nonterminal tasks before the existing 100-record bound and prioritizes
unknown/blocked work; alarm rows are limited to unresolved states. Legacy
summary/details remain compatible. Visible inventory values are bounded record
counts, not warehouse-wide available-stock totals. Conservative coverage flags
warn at each collection limit. Home's independent refresh timestamp and failure
notice preserve last-known evidence without claiming it is current.

| Before                                                   | After                                                                       | Why                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| KPI cards precede operational exceptions                 | Attention and waiting/active work precede counts                            | Operators can identify the next place to investigate              |
| UUIDs and raw status enums lead the task table           | Readable locations, localized state/next-step meaning, technical disclosure | Routine decisions should not require database knowledge           |
| Recent terminal history can displace older unknown tasks | Server query selects nonterminal work and prioritizes uncertainty           | Unknown physical outcomes must remain visible                     |
| Overview has no bounded-coverage warning                 | Explicit collection-limit warning and projection timestamp                  | A partial overview cannot assert warehouse-wide absence of faults |

Remaining limitations: existing deeper pages are still broad evidence views;
manual/help, exact aggregate
inventory visibility, and reducing unused topology data in the reused query are
follow-up S2 slices. Read-model queries are separate observations, not an atomic
warehouse snapshot or command precondition.

## Task queue/detail slice

Read-only `/api/v1/operations/tasks` and `/:taskId` require `operations.view`
and current warehouse scope. The BFF and SSR use existing session authorization.
Source/destination, assigned equipment, inventory/load location, and outbound
allocation/order lineage are scoped; inconsistent lineage fails closed. Missing
and outside-scope details share 404 semantics. Queue ordering uses immutable
creation time plus task UUID, preserving PostgreSQL microseconds in an opaque
cursor bound to warehouse and view. It is observation pagination, not a snapshot:
status changes require refresh. A warehouse/view change remounts queue state.

Home links to task detail. Detail shows readable work origin, allocated quantity
(not the whole outbound load quantity), recorded route, open alarm, and scoped
history links. `audit.view` gates links without expanding `operations.view` into
audit access. Assignment is not physical position; recorded routes are not live
availability. No command timeline is invented: full lifecycle controls remain S4.

| Before                                            | After                                                                | Why                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Home tasks lead to a broad technical projection   | Dedicated readable task context                                      | Operators can investigate the selected work                      |
| Fixed bounded task list                           | Active/all keyset queue with explicit refresh semantics              | Older work remains reachable without claiming an atomic snapshot |
| Task/order/load facts must be correlated manually | Persisted receipt/order, allocation quantity, load and alarm context | Preserve accountable warehouse meaning                           |
| Raw identifiers dominate                          | Human context first; recorded route IDs under keyboard disclosure    | Reduce routine technical burden without hiding evidence          |

Self-review found and fixed invalid calendar cursor handling, ambiguous query
arrays, and inconsistent receipt/load lineage. Verification covers API/BFF
permission and validation, PostgreSQL microsecond pagination and cross-warehouse
rejection, protected SSR, production browser navigation, audit links, language,
theme, mobile reflow, and axe accessibility. The existing legacy-only 15 lint
warnings remain; no checks were disabled. Remaining S2 work: inventory workspace,
Live View/readable topology, and manual/contextual help.

## Inventory visibility slice acceptance and decision

Medium-risk read-model/UI change under the existing S2 plan; no new ADR or
permission model is needed. First ship `/operations/inventory`: warehouse-scoped
search and keyset pages with persisted stock, active reservation sum, unreserved
quantity, state, readable location/load context and receipt history. Reuse
`operations.view`; history remains gated by `audit.view`. This is not allocation
authorization, stock adjustment, warehouse-wide totals, or physical observation.
Never treat load's received quantity as current inventory balance. Quarantined or
reserved inventory must not appear allocatable. Search/cursor are bounded and
bound to warehouse/query. Test partial reservations, quarantined inventory,
cross-warehouse lineage, pagination, unavailable/empty states and authenticated
bilingual mobile accessibility. Full load/location workspaces remain subsequent
S2 slices.

## Inventory implementation and review

Inventory search uses parameterized literal case-insensitive substring matching
for SKU, external load ID and location (not SQL wildcard expansion). UUID keyset
pagination is bound to warehouse and normalized search, with a 50-row default and
100-row maximum. Inventory and load location joins both enforce warehouse scope.
Active reservations are summed in the same SQL statement as each stock balance;
released/consumed allocations do not count. Unreserved available-state stock is
`max(0, balance - active reservations)` only for `available` inventory, otherwise
zero. It is not allocation authorization or physical truth. Separate pages can
observe mutations; refresh restarts traversal and resets loaded state.

The existing outbound allocator currently considers available inventory state
and active reservation quantity; subsequent execution validates configured
location/topology/equipment. This read slice does not silently change allocation
or claim that its residual quantity proves movement safety. Blocked/disabled
locations, load-location disagreement and over-reservation display a review
warning. Missing/foreign load lineage is excluded, not replaced with fabricated
data. No global stock totals or unit-of-measure conversion is introduced.

| Before                                             | After                                                           | Why                                                    |
| -------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Inventory is a bounded diagnostic table            | Dedicated searchable paginated workspace                        | Find older stock without reading code or raw IDs       |
| Stock quantity appears without reservation context | Balance, active reservations and residual quantity are separate | Partial allocation must not make all stock appear free |
| Inventory identity is detached from receipt/load   | Readable load/location/receipt context and gated evidence link  | Operators can trace the stock origin                   |
| Primary navigation puts Tasks before Home          | Home, Tasks, Inventory precede warehouse diagnostics            | Preserve the system-first daily-work hierarchy         |

Review scope is read authorization and warehouse isolation, not new identity or
mutation enforcement. API/BFF guard tests, malformed-query tests, PostgreSQL
partial-reservation/quarantine/pagination/foreign-lineage checks and production
browser keyboard search, empty state, warehouse switching, locale/theme and axe
mobile reflow cover this slice. Full Loads/Locations workspaces, outbound order
history from stock and inventory adjustments remain unshipped.
