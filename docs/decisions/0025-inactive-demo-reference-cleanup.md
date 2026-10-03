# ADR 0025 — Fenced cleanup of inactive demo references

Status: Accepted

## Evidence and decision

ADR 0024 creates atomic, inactive reference snapshots, not running simulators.
Expired reservations still consume admission capacity. Deleting a warehouse by
label or TTL alone would be unsafe; weakening ownership foreign keys would also
lose the current isolation proof.

Add a restart-resumable database-time lease with a fresh fencing UUID for each
attempt. Cleanup uses the same global admission lock and READ COMMITTED
transaction as reservation/snapshot. A valid, unexpired lease may remove only its
expired reservation's never-activated reference namespace. Active descriptors,
any observations, human assignments, operational evidence or unexpected reference
identities refuse cleanup. Foreign keys remain an additional fail-closed guard.

Archive immutable reference metadata outside the deleted resource foreign keys,
verify scoped resources are absent, record control evidence and close the
reservation atomically. Only closed reservations cease consuming capacity.
Closed UUID retries retain their original expiry/state and cannot reprovision.
Lease expiry, stale workers or evidence failure roll back deletion and capacity
release. Failed provisioning with no resource metadata may close only when the
deterministic workspace code is also absent.

## Scope and limits

This is a trusted public-demo/simulation repository contract, not a public route
or enabled managed cleanup worker. Lease duration is validated server-owned
configuration, 30–300 seconds. Control/archive/lease records survive the existing
operational reset and retain deny-by-default RLS. No business retention/purge
policy is invented. No live adapter drain, simulator clock isolation, running
workspace cleanup, anonymous authorization, quota/rate enforcement or public
activation is claimed. Those remain S3 gates. No production deletion is invoked
by this implementation or its disposable PostgreSQL tests.

`active=false` and absent observations prove current absence of execution
evidence, not that an administrator never activated and later removed evidence.
No runtime activation path is enabled for these workspaces. Before that changes,
the lifecycle must add durable activation/adapter ownership and drain proof;
this repository must not be reused as an active-runtime cleanup shortcut.
