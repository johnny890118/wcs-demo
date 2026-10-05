# ADR 0033 — Operator Work queue and context navigation

Status: Accepted, 2026-10-05

## Evidence and decision

A–C provide durable roots and qualified task/entity handoffs. The current primary
shell is still module-oriented; there is no persisted Work queue. Deduplicating
the first task page would omit empty jobs, split roots and roots whose tasks are
unqualified, and falsely imply coverage. D therefore adds a bounded union of
warehouse-owned inbound receipts and outbound orders as its Work entry.

The read list includes persisted root identity, reference, flow, recorded status,
timestamps and root-wide referenced/qualified task counts with qualified status
counts. It does not invent business stages, progress or physical completion.
Counts and roots share one read snapshot; the existing qualified task selection
is reused. A root with unresolved task relationships remains visible with
incomplete evidence, without leaking foreign task metadata.

Keyset pagination binds cursor to warehouse and active/all selection and orders
by precise created timestamp, root UUID and flow. Active includes open business
roots or nonterminal/unqualified execution; empty requested roots stay visible.
GET requests retain `operations.view`, current warehouse, existing signed
freshness policy, private no-store and backend service/user authorization. No
warehouse override or role-name branch is accepted. This is not a cross-request
snapshot or real-time queue; refresh starts a new observation.

Work links lead to A/C roots. Inbound/outbound creation and WCS tasks become Work
subcontexts; Inventory keeps its existing inventory/load/location subcontexts.
Home, Work, Live, Exceptions, Inventory and Help become shared primary operator
navigation. Existing independently guarded engineering/history pages remain
secondary, never substituted for missing S4–S7 features. Legacy URLs remain
usable. B's fixed owned contextual returns do not depend on generic navigation.

Exceptions combines existing qualified alarms, blocked/unknown tasks and equipment
attention without a new projection round trip. Alarm links retain exact alarm
and task identity, not display-code matching. Equipment without a qualified task
links to the exact equipment Live query. B's context resolver re-authorizes every
destination. The bounded timestamped read is explicitly not health clearance or
command authority; existing guarded recovery remains separate below it.

Workspace templates are presentation defaults, not identity/permission labels.
Do not add an unneeded role selector or pretend Engineer/Admin capabilities have
shipped. Secondary tools can be found through explicit disclosure with their
current permissions; every destination still authorizes independently.

## Verification and consequences

Test keyset ties, warehouse/view-bound cursors, invalid query before SQL,
permission fail-closed, empty/split/unqualified roots, production build, and
operator inbound/outbound/investigation/inventory journeys with direct reload
and exact contextual returns on desktop/tablet/mobile, both locales/themes.
Independent security and Emil/Operator review are required. Root summaries may
become expensive at large scale; measure before claiming performance or adding
indexes/cache. No schema/mutation/security-policy change is needed for D.
