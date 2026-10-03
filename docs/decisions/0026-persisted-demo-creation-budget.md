# ADR 0026 — Persisted global demo creation budget

Status: Accepted

## Evidence and decision

Verified inactive cleanup now releases concurrent admission slots. Capacity alone
does not bound rapid create/cleanup cycles. Add a configurable, database-time
global fixed-window budget to the existing serialized admission transaction.
Only newly committed reservations consume budget; immutable UUID retries do not.
Template/evidence failure rolls back both reservation and budget. Cleanup never
resets this counter and the operational reset cannot erase it.

Use one bounded control row, not client identifiers or a growing attempt ledger.
Server configuration defaults to 60 successful creations per 60 seconds; validate
window 10–3600 seconds and limit 1–1000. API instances must agree on the active
window policy; disagreement fails closed until the persisted window expires.
Database time, not caller timestamps, starts and rolls the window. Retain
deny-by-default RLS and public-demo/simulation runtime gating.

## Limits

This bounds globally successful creation, not HTTP attempts, per-client fairness,
edge traffic, scenario rates or per-session storage. Fixed windows permit up to
two budgets across a boundary. Public issuance remains closed; trusted-ingress
abuse controls, virtual runtime ownership, persisted access, live cleanup and
scenario/storage quotas remain activation prerequisites. No raw IP, credential
or fingerprint is collected, and no managed public-demo switch is enabled.
