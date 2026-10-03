# ADR 0024 — Isolated demo reference workspaces before activation

Status: Accepted

## Evidence

Existing operational repositories authorize and query by warehouse; location
bindings and topology identities have composite database scope constraints.
Equipment IDs are globally unique, and the simulator currently registers active
descriptors at startup. Reusing the template warehouse, equipment IDs or observed
state would cross session ownership. Adding demo conditionals to every domain
workflow would fork a working warehouse-scoped core.

## Decision

Snapshot validated reference configuration into a distinct warehouse namespace
for each reserved session, with new topology/location/equipment identities and
explicit copied bindings. Preserve semantic graph node/edge IDs within their new
versioned topology; never derive location identity from a matching label. Persist
source version and explicit source-to-owned identity maps as reference evidence,
not as authorization. Read the template in one consistent database statement,
then validate through existing topology/equipment contracts before copying.

No receipts, loads, inventory, tasks, alarms, audit, observations, command state
or adapter state are copied. Equipment descriptors are inactive; reservations
remain provisioning. This reference snapshot is not completed simulator
provisioning, active anonymous access or safety authorization. Published source
diagram coordinates remain presentation metadata, not physical calibration.

Snapshot creation is atomic/idempotent under the same admission lock and
database-time expiry check. Persist snapshot/control evidence in separate
non-resettable tables with deny-by-default RLS. Source adapters must belong to a
server-provided simulation registry allowlist; no vendor/type dispatch branches
or browser-selected mode. Bounded configuration size prevents unbounded cloning.
No public HTTP entry or new human warehouse grant is added in this slice.

## Following work and limits

The next activation boundary must register isolated virtual equipment with
per-session runtime ownership, restore safely after restart, perform persisted
request authorization and implement leased/fenced cleanup/quota/rate controls.
Only then can public issuance be enabled. Source-to-owned maps are a snapshot
record; warehouse scope and current persisted lifecycle remain authoritative.
S6 owns later governed configuration authoring; this slice does not create a map
editor or clone a customer deployment's operational/sensitive records.
