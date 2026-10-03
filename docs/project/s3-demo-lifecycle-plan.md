# S3 Demo Lifecycle Plan

Status: Active — first admission/expiry control-ledger slice.

## Entry evidence and workflow

S2 checkpoint `842503d1e0ed02e15e5c422360a0986692f02932` is pushed to main;
Verify `37137046354` has successful verify/deployment-smoke jobs. Vercel and
Render deploy that exact commit; managed runtime checks pass and the tree was
clean before this slice. S2 acceptance is recorded in its evidence matrix.

Work type: incremental infrastructure/security foundation. Risk: high because
anonymous isolation and resource admission are load-bearing product boundaries.
Persistent plan and ADR 0023 are required; independent security review follows
implementation. No new marketing work or physical equipment integration.

## First coherent slice

- Persist a bounded, idempotent anonymous demo admission reservation and expiry
  control evidence, separately from resettable operational audit/scenario rows.
- Serialize global admission across API processes; expired reservations continue
  consuming capacity until a future verified cleanup protocol releases resources.
- Use database time for TTL; malformed policy/input and non-public-demo or
  non-simulation runtime fail closed before database work.
- A reservation is **provisioning**, never an active authorization claim. Do not
  connect existing shared warehouse projections or simulator state to it.
- Close the unpersisted issuance endpoint: no anonymous cookie until isolation,
  provisioning and every-request persisted authorization are implemented.
- Add real PostgreSQL concurrency/idempotency/expiry/reset-survival/RLS evidence,
  focused policy/endpoint tests, full gate, separate API build and runtime review.
- Independent security review, fixes, secret/staged review, commit/push,
  exact-commit CI/deployments/managed runtime and clean tree before next slice.

## Following slices (existing S3 direction, not a new roadmap)

1. Isolated workspace provisioning from validated versioned warehouse reference
   data; per-session virtual equipment/operational ownership and persisted access
   lookup. No browser-controlled mode or tenant selection.
2. Restart-resumable leased/fenced cleanup with resource deletion verification,
   bounded creation/scenario rates and per-session/global quotas. Only verified
   cleanup can release admission capacity; TTL alone is not cleanup.
3. Guided public scenario/sandbox entry only after isolation and abuse gates.
   Authenticated private-demo controls remain separately authorized.
4. Session/run-scoped accountable reset/replay with reason, confirmation,
   idempotency/concurrency policy and evidence outside resettable state.

Current global CLI reset still truncates `audit_events`; this slice does not
silently turn it into a session-scoped reset or claim S3 completion.

## Review and verification evidence

Focused policy/carrier/endpoint tests pass (24). Real PostgreSQL tests prove
immutable replay, independent-connection concurrent capacity and duplicate UUID
retries, bounded durable expiry, retained capacity, template/event failure
rollback, reset-list survival and non-owner read/write denial. Expiry-event
failure rollback and non-owner UPDATE/DELETE checks were added following review.
The runtime harness now bounds HTTP waits and escalates shutdown only for its own
spawned Next process, following the independent robustness review.
The initial SQL parameter inference failure was fixed with an integer cast,
not by weakening tests. Independent security review found no blockers.

Full verification passes 475 fast, 38 real PostgreSQL (29 existing + 9 ledger),
34 production-build browser tests; API build passes. The added actual
production-build public-profile HTTP harness verifies closed issuance, denial
of an old valid carrier on read/mutation/SSR and zero upstream calls. It runs
in the full gate, uses generated in-memory loopback-only secrets, and is not a
managed authenticated benchmark. Existing human UI/keyboard/theme/locale
regressions pass; this slice adds no UI or PDF revision. Delivery gates follow
the checkpoint, rather than being inferred from local tests.

Checkpoint `be721e6` exposed a CI smoke defect: applied migration count was
hardcoded at 15. Migration 0016 is valid, but smoke exited before backup/restore.
The correction compares exact applied migration names with the repository for
both fresh and restored databases, rejecting missing, wrong or duplicate names;
four regression checks cover the manifest verifier. No check is disabled and
no managed database reset is performed. Delivery remains pending corrected CI.
