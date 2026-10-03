# ADR 0023 — Demo admission control ledger before public activation

Status: Accepted

## Evidence and decision

ADR 0015's signed carrier has UUID/expiry but no persisted reservation, isolated
warehouse/equipment state or cleanup. Existing projections are warehouse scoped,
and global CLI reset truncates operational audit. Issuing that carrier cannot
establish session isolation. The managed deployment is private demo; no supported
public entry depends on enabling the incomplete carrier endpoint.

First persist a separate public-demo control ledger. Reservations bind immutable
session UUID, template warehouse, profile and bounded TTL; use database time and
transaction-scoped global admission locking. Stable UUID replay returns its
original record without renewing expiry or consuming another slot. Admission
explicitly selects READ COMMITTED so a changed connection isolation default
cannot take a stale capacity snapshot before the lock. Changed
immutable intent conflicts. Reservations and expired-but-not-cleaned resources
both consume global capacity. This avoids mistaking TTL for resource release.

Initial states are `provisioning` and `expired`, neither grants operational
access. No active state, workspace assignment or cleanup-complete transition is
implemented until its corresponding isolation/cleanup proof exists. Expiry is
bounded, durable and idempotent; its evidence lives in separate control events,
not `audit_events`. Non-owner roles have deny-by-default RLS. The owning API
connection remains the trusted data path, not a claim of tamper-proof storage.

The application contract is provider-neutral; PostgreSQL implements persistence
and multi-process serialization. Runtime/policy come from trusted server
composition, never browser input. Only `public_demo` + `simulation` admits this
anonymous reservation; production/pilot/hardware/hybrid and private-demo paths
are denied. A production lifecycle environment is allowed for a hosted public
demo profile, never confused with a production deployment profile.

The current browser issuance endpoint fails closed, even for a valid public
origin, until persisted isolation and per-request authorization exist. Previously
signed carriers also cannot authorize Operations reads or mutations. No feature
flag bypass, migration-time carrier backfill or activation of shared demo data.

## Consequences and remaining proof

This additive migration changes no operational rows or existing human sessions.
The ledger is a foundation, not public-demo enablement or completed cleanup.
Capacity can intentionally exhaust because this slice has no release operation.
The next slice must establish isolated resource ownership and versioned template
provisioning, then leased/fenced restart-resumable cleanup, quotas/rates and
persisted access before public entry. Private training lifecycle, reset/replay
and control-event retention remain explicit follow-up work. Production retention
duration is not invented; control rows/events are retained, with no purge here.
