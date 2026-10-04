# ADR 0028 — Durable demo simulator ownership and fenced observations

Status: Accepted

## Evidence and decision

ADR 0027 proves local isolation, not cross-process ownership. Before a fresh
bundle can write persisted observations, claim an exclusive database-time lease
for its existing reference workspace. Persist the first claim and all takeover
generations outside resettable operational rows. Claim, renewal, activation and
observation writes use transactional owner-token/deadline checks; reservation
expiry independently denies every operation. Lease lifetime is server-configured
30–300 seconds and capped by the session deadline.

First ownership is initializing. Only fresh offline/no-position/no-task/no-load
observations may initialize it. Activation requires complete good connected
offline initialization for every owned descriptor and no operational/human-use
evidence; descriptors then become available only to their owned runtime. The
private singleton explicitly excludes owned workspace descriptors. Runtime
activation is not an anonymous session grant or public issuance authorization.

Expired takeover receives a new fencing UUID/generation and enters unknown;
it cannot publish, activate or renew as if it were a fresh idle runtime. Future
restart reconciliation must establish restoration proof before this changes.
Fenced observation writes check equipment/topology/node and task/load warehouse
lineage, including inbound receipt ownership and outbound order/allocation load
ownership, before the existing monotonic sequence upsert. Observations
retain the existing outbound executor's inventory-unit carrier identity:
it is accepted only with its matching outbound task/allocation and owned
inventory/load/receipt lineage, never as an unscoped load alias. Normalizing that
older carrier vocabulary across all adapters is a separate migration concern.
Observation timestamps
must be non-future and strictly within the shared 30-second evidence window using
DB time, checked again before commit. Initialization/activation also requires
fresh received time; activation rechecks freshness after recording evidence.
Simulator clocks must be synchronized with the DB; future timestamps fail closed
rather than inventing a clock-skew allowance. Expired/stale owners
cannot write even a higher sequence. Inactive-reference cleanup refuses any
runtime ownership marker, including initialization/unknown, rather than deleting
past activation evidence or guessing a worker has drained.

## Limits

No owner repository, worker or public HTTP route is registered/enabled. This
slice adds trusted persistence contracts and disposable PostgreSQL execution
proof, not a running managed public product. Command permission/warehouse checks
remain independent; a publication fence is not physical command authorization.
Local state may advance before a rejected publication, which remains a failed/
unknown operation rather than success. Active cleanup, restart reconciliation,
persisted browser request resolution, HTTP/scenario/storage abuse controls and
accountable reset/replay remain S3 prerequisites. No production delete/reset or
physical equipment action is invoked.
