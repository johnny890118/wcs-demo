# Operator Experience A–D convergence

Status: A–D implementation delivered; delivery evidence synchronization checkpoint
in progress. Owner requires a clean handoff and no S3 implementation (2026-10-08).
Owner-approved ordering, 2026-10-04.

## Entry and boundaries

Freshness foundation `2e90c6e` and the independent brand/journey requirement
`d95609b` are pushed, exact-HEAD CI successful, Vercel Ready/Render Live at their
respective full SHAs, managed smoke and authenticated read navigation verified.
Working tree was clean before A. Unwired read cache is not a delivered speedup.

Work is the operator's business-work context; Task is WCS execution. Workspace
templates never become backend role-name authorization. Keep scope, permission,
unknown outcomes, qualified observations, audit and command safety authoritative.
No sidebar-first implementation or fabricated downstream capabilities.

## Approved slices

| Slice | Goal / operator job                                                       | Scope                                                                             | Explicitly later                                   |
| ----- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| A     | Reload/open the same inbound/outbound Work without IDs or repeated search | Server-owned root, qualified paged tasks/counts, durable Work URL and origin link | Entity handoffs, command UX, IA                    |
| B     | Move between Work/Task/entity/Live/exception without losing exact context | Server-qualified selected references and owned return paths                       | New domain controls or fake physical positions     |
| C     | Continue the created job and understand recorded outcome                  | Durable create-to-Work resume, split-task meaning and outcome/evidence            | S4 controls/reconciliation, S7 WMS fallback policy |
| D     | Complete coherent operator journeys                                       | Home/Work/Live/Exceptions/Inventory/Help grouping and role workspace presentation | Marketing, undisclosed permissions, fake maturity  |

## A acceptance and execution

Persona: operator investigating an existing inbound/outbound job. Current gap:
task detail exposes origin alias but loses business-work continuity on reload.
Reuse persisted receipts/orders, task projection mapping, session wrappers,
OperationsShell, tokens/locales and existing authorized API transport. ADR 0030
records the load-bearing read boundary. No schema/domain lifecycle changes.

- [x] Root cannot resolve outside current warehouse; all relationships qualified.
- [x] Pagination is bounded/root-bound; full qualifying status counts remain
      independent of page size. Recorded job status is not invented progress.
- [x] Direct/reload Task → Work → Task → Work works without browser Back or
      manually remembering UUIDs; 1:N outbound and empty/error states honest.
- [x] Focused contract/API/BFF tests and real PostgreSQL isolation/pagination.
- [x] Full `verify`, API build, independent security, operator/Emil review.
- [x] End-to-end journey desktop/tablet/mobile widths, themes/locales/keyboard/
      Axe; record actual evidence versus hardware or future-capability limits.
- [x] Durable knowledge/evidence, staged/secret review, independent checkpoint/
      push/exact CI/both deployment SHAs/runtime/clean; automatically continue B.

A checkpoint `d8605d4c26b35e12fbae52f507ab81d43a18f342` is pushed. Exact-HEAD
CI run `37203351423` passed both verification and deployment-smoke jobs. Vercel
Ready and Render Live resolve that full SHA; managed checks and authenticated
production Task → Work → reload → Task pass. This is read-only runtime evidence,
not a production latency benchmark or complete B–D operator journey.

Each slice repeats the same engineering/delivery gates. Tests alone do not prove
operator understanding. Report missing handoffs as next-slice gaps, not success.
External WMS manual fallback remains an Owner decision when S7 has a real target.

## B execution

Risk: security-sensitive qualified read relationships and multi-page continuity.
ADR 0031 records the load-bearing distinction between exact identity, readable
labels and current observations. Existing commands and IA are not redesigned.

- [x] Review current Task/entity/Live/Exception/History evidence and A roots.
- [x] Implement qualified exact selection and fixed owned contextual returns.
- [x] Focused contracts, authorization and PostgreSQL adversarial relationships.
- [x] Full verification and independent security review; repair findings.
- [x] Operator/Emil review and direct/reload end-to-end viewport journeys.
- [x] Durable evidence, checkpoint, push, exact CI, both deployments, authenticated
      runtime and clean working tree; then start C without waiting for Owner.

B checkpoint `7d0e93dd925de04cd9dac4287e77c570299292ac` is pushed. Exact-HEAD
CI run `37208994692` passed verify and deployment-smoke. Vercel Ready and Render
Live identify that full SHA. Managed deployment checks passed. On 2026-10-05,
authenticated production Task → load → inventory → source → destination → Live
→ exception → history → reload → same Task → same Work passed without sidebar,
search, ID entry or Browser Back. The inspected task was unassigned with no open
alarm: Live correctly reports unavailable qualified evidence, inventory does not
claim zero stock, and history retains the selected Task. Active/historical alarm
and assigned equipment cases are covered by deterministic browser and real SQL
tests, not claimed as production cases. Working tree was clean before C.

## C execution

Persona: operator continuing a newly created or partially executed job after
reload. Evidence: creation panels retain created IDs and completion bookkeeping
only in React state, while A's owned Work root can reconstruct persisted status
and qualified execution counts. B supplies exact investigation and history.

Risk: high, because resume UX reaches existing command boundaries. Keep commands,
strict session validation, confirmation, permission and warehouse checks intact.
Resume must resolve persisted Work/Task relationships on the server; query input
is selection, never command authority. Do not infer full job completion from a
paged task list or replace unknown outcomes with retry/success.

- [x] Record evidence-backed resume/meaning contract and acceptance cases.
- [x] Implement durable create-to-Work continuation and qualified resume UI.
- [x] Verify split-job, incomplete, unknown, permission and scope cases.
- [x] Full verification, independent security and operator/Emil journey review.
- [x] Durable evidence, checkpoint/push/exact CI/deployments/runtime/clean.

C checkpoint `178ff9e6ea0f377f6e214f36c9c9fa0ee1941268` is pushed. Exact-HEAD
CI run `37323480352` passed verification and deployment-smoke. Vercel Ready and
Render Live resolve that full SHA; managed checks pass after deployment. On
2026-10-05 authenticated production Task → same Work → exact queued resume →
reload → owned Work return passed. Reload clears reason/confirmation, equipment
is not preselected and aged observations remove availability. No production
command was submitted. An existing Chrome Tasks page displayed one 504; reload
recovered and subsequent reads passed. This is not proof of its cause or a
latency benchmark. Working tree was clean before D.

## D execution

Evidence: A–C restore exact individual Work contexts, but no server-owned Work
queue exists. The primary shell still exposes Tasks, Inbound, Outbound,
Projections and Audit as peer modules. Inventory already has a reusable shared
navigation; B's contextual returns remain authoritative and must survive D.

Risk: security-sensitive read aggregation and major operator journey change.
First establish a bounded, warehouse-scoped persisted Work queue (including
empty/split jobs), not client deduplication of one task page. Then consolidate
Home / Work / Live / Exceptions / Inventory / Help around real capabilities.
Technical/history surfaces stay independently authorized and secondary. Workspace
presentation does not branch authorization by role name. No new recovery,
administration, scheduling or external WMS controls.

- [x] Record Work queue/IA contract and operator acceptance journeys.
- [x] Implement server-resolved Work list and contextual navigation.
- [x] Verify root pagination, scope/permission and truthful partial states.
- [x] Complete independent security, operator/Emil and full journey review.
- [x] Full gates, durable knowledge, checkpoint/push/exact CI/deploy/runtime/clean.

D local gate passes 608 fast, 88 real PostgreSQL and 41 production-build browser
tests plus public-demo denial harness; separate API build passes. ADR 0033 and
[operator consolidation review](../engineering/operator-consolidation-review.md)
record exact root/attention semantics, review correction and evidence limits.
Implementation checkpoint `4d13cf1884e4ea1025a55f3c05b76efe9942734f` is pushed;
exact CI `37329376012` succeeds, both providers resolve the full SHA, and managed
smoke passes. Authenticated production read-only Work/Task/Live reload/Inventory/
History/owned-return journey passed on 2026-10-08 without search, ID entry or
Browser Back. No production command or full inbound/outbound execution is
claimed. The tree was clean before this evidence-only synchronization; finish
its verification/checkpoint/delivery, then stop at the clean checkpoint for Owner
review. The 2026-10-08 Owner hold supersedes automatic continuation into S3.
