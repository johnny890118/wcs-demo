# S2 Operational Work Center Plan

Status: Active

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
