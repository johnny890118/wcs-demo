# S3 Demo Lifecycle Plan

Status: Active — isolated simulator-bundle slice.

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

Admission/expiry checkpoint `be721e6` plus CI correction `6b06868` are pushed.
Verify `37139224445` has both jobs successful; exact Vercel/Render deployment,
managed runtime and clean-tree evidence are confirmed. Historical first-slice
scope below is complete, not an instruction to redo it.

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

Correction delivery is now confirmed by the entry evidence above.

## Current coherent slice — isolated reference snapshot

High-risk resource/warehouse isolation foundation; retain this plan and ADR 0024,
use independent review and real PostgreSQL proof. Create one atomic/idempotent
reference workspace for an unexpired provisioning reservation. Read one consistent
versioned template snapshot, validate topology/equipment/bindings and bounded
configuration size, then generate owned warehouse/topology/location/equipment
identities. Preserve explicit mapping and copied semantic graph references.
Equipment stays inactive; copy no operational rows or observations. Do not grant
access or claim runtime isolation before adapter ownership/access/cleanup gates.
Full verification, API build, security review, checkpoint/push, exact-commit
CI/deployment/runtime and clean tree precede the next slice.

Snapshot verification: 8 focused preparation regressions cover disjoint identity,
explicit non-matching-label bindings, deep-copy isolation, invalid scope/contracts,
bounded size, generated-ID collisions and prototype-like equipment map keys.
Nine real PostgreSQL regressions prove inactive scoped reference rows, no
operational/history/observation copy or human grant, concurrent idempotency,
expired/missing denial, missing binding/unknown adapter rejection, event failure
and mid-copy expiry rollback, actual reset-list survival and composite FK/RLS.
An initial test assumed a nonexistent direct task warehouse column; corrected to
the real location relation, without schema changes or relaxed assertions.
Independent security review found no blockers; recommended deadline/reset proof
was added. Full gate passes 483 fast, 47 real PostgreSQL (29 + 9 + 9), 34 browser
tests plus production-build public-boundary harness; API build passes.

Opaque reference constraints/attributes and semantic resource IDs are not proof
of runtime resource isolation. Activation must review their safe interpretation
and public projection exposure, authoritative adapter ownership, persisted
request authorization, cleanup and quotas before any public carrier is enabled.

## Current coherent slice — inactive reference cleanup

Snapshot checkpoint `ceee211169516e5903f2fd85c15b88f5b6559d06` is pushed;
Verify `37141069003` has both jobs successful, Vercel/Render deploy that exact
commit, managed runtime passes and working tree is clean. Do not redo it.

Work type: high-risk resource lifecycle/security foundation. ADR 0025 and this
persistent plan govern the next independent slice. Implement validated leased/
fenced claims, atomic scoped deletion/archive/evidence and capacity release only
after verified never-activated cleanup. Preserve reference ownership FKs and
deny active/observed/assigned/operational or unexpected resources. No public
endpoint, managed worker or live simulator cleanup. Required gates: focused
policy tests, real PostgreSQL concurrent/restart/fencing/rollback/ownership/reset/
RLS regressions, complete verification, API build, independent security review,
checkpoint/push, exact CI/deployment/runtime and clean tree before continuing.

Focused evidence: 3 policy checks and 12 new real PostgreSQL regressions pass.
The existing 47 PostgreSQL checks also pass; API build succeeds. Initial audit
fixture failures (required correlation and UUID/text parameter typing) were
fixed to match the existing schema, without changing production audit contracts.
Independent review found no code blockers and requested observation-insert lock
races and evidence-time lease expiry. Both competing-connection orderings and
event-time rollback are now proved. No UI/PDF changes; full gate remains required.

Full verification now passes: 486 fast, 59 real PostgreSQL (29 + 9 + 9 + 12),
34 production-build browser tests and closed-public-boundary runtime harness.
Separate API build passes, dependency audit has zero vulnerabilities and secret
scan passes. Existing bilingual/theme/mobile/keyboard/accessibility regressions
remain green; no new UI or PDF surface is introduced. Final independent review
found no blockers after the competing-connection/deadline additions. Checkpoint
delivery gates remain separate from this local evidence.

## Current coherent slice — persisted creation budget

Inactive-reference cleanup checkpoint `f23881d6f4e453ff1914b932f42c7388c9a90112`
is pushed; Verify `37142430784` has both jobs successful, exact Vercel/Render
deployment and post-deployment managed runtime pass, and working tree is clean.
Do not redo prior work. Next high-risk admission/abuse foundation uses ADR 0026:
bound committed new creations across processes and cleanup cycles in one DB-time
control row, preserve replay and atomic rollback, fail closed for conflicting
active-window configuration. No public endpoint enablement or UI change.
Required gates: focused policy and PostgreSQL concurrency/replay/window/cleanup/
rollback/reset/RLS tests, full verification, API build, independent security
review, checkpoint/push, exact CI/deployment/runtime and clean tree.

Focused evidence: 20 admission-policy tests and the sequential real PostgreSQL
suites pass (59 prior + 8 initial budget checks); separate API build succeeds.
Independent review found no blockers and correctly qualifies fixed-window bursts
and unfinished HTTP/scenario/storage limits. The suggested existing-counter
increment/evidence-failure rollback regression was also added before full gate.

Full verification passes 487 fast, 68 real PostgreSQL (29 + 9 + 9 + 12 + 9),
34 production-build browser checks and the closed-public-boundary HTTP harness.
API build passes; secrets/dependency gates pass with zero vulnerabilities and
only the existing 15 legacy lint warnings. Existing-counter rollback leaves
both count and original window unchanged. UI/locale/theme/mobile/keyboard and
manual/PDF drift gates remain green without introducing or regenerating UI/PDF.

## Current coherent slice — isolated simulator bundle

Creation-budget checkpoint `0b721f0673460ef3ad5ead2fec43a34f6c913442` is pushed;
Verify `37143208241` has both jobs successful; exact Vercel/Render deployment,
managed runtime and clean tree are confirmed. Next high-risk runtime-isolation
foundation uses ADR 0027. Create independent owned virtual state/time/dedup and
qualified observation publication with bounded command memory and fail-closed
stop semantics. No HTTP/NestJS/public activation, warehouse grant or managed
simulator registration. Durable ownership/fencing remains a subsequent gate.
Required evidence: cross-session state/clock/command/observation isolation,
scope/config rejection, defensive copies, command-budget replay, stop/drain and
failure regressions; full verification, API build, independent security review,
checkpoint/push, exact CI/deployment/runtime and clean tree.

Simulator review found and fixed delayed envelope cloning: capture/validate
command and dedup identity before enqueue, never retain a caller-mutable pending
request. A gated-publication mutation regression proves the original intent.
The shared observation publisher now re-reads current state on duplicate rather
than timestamping cached historical state; replay after later transitions is
covered. Local operations serialize state capture/publication with a bounded
pending queue; cancelled schedules also count toward their lifetime bound.

Final independent review confirms the queue-input issue is fixed with no
remaining blockers. Full gate and API build pass: 501 fast, 68 real PostgreSQL,
34 production-build browser checks plus closed-public-boundary HTTP harness.
Thirteen factory regressions exercise independent state/clock/cache/observations,
foreign references, defensive copies, dedup limits, cancelled schedule budgets,
stop/disconnect failure, in-flight publication, serialized bounded work,
caller-mutated queued intent and runtime/config/command rejection. One shared
publisher regression verifies current-state publication on duplicate. These are
local in-process bundle tests, not persisted worker ownership or deployed public
session evidence. Existing human UI/UX gates pass without UI/PDF changes.
