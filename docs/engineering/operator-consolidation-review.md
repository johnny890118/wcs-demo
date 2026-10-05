# D — Operator context consolidation review

2026-10-05. Full local gate passed; delivery gates pending.

## Operator and Emil review

| Before                                                             | After                                                                                             | Why                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tasks, Inbound and Outbound are peer modules                       | Persisted Work queue with creation/execution subcontexts                                          | Begin with the same business job, including empty and split roots                     |
| Task-page dedup could masquerade as all jobs                       | Warehouse-owned receipt/order union, root-wide qualified counts and keyset pagination             | Root identity and coverage must be server truth, not client inference                 |
| Technical tools and history compete with repeated operator actions | Six shared primary destinations; independently guarded secondary disclosure                       | Reduce module fragmentation without removing engineering capability or authorization  |
| Environment/source context disappears on small screens             | Wrapped warehouse/environment/profile/source controls on mobile                                   | A small viewport must not hide safety-relevant operating context                      |
| Alarm-only entry would merely be renamed Exceptions                | Existing qualified alarm/task/equipment attention with exact destinations                         | Investigate unknown/blocked and equipment observations without inventing new controls |
| Old equipment telemetry could hand off to a reassigned task/device | Always preserve equipment identity in Live; alarm UUID preserved independently of duplicate codes | Human-readable labels and observed Task links are not identity authority              |

The existing neutral-first tokens, brand accent, focus rings, 44px targets,
semantic status colors and navigation-progress feedback remain. No new motion,
dependency, role picker, authorization branch or cache is added. Work labels,
recorded outcome and qualified execution counts do not claim physical completion.

## End-to-end acceptance and limits

Work queue → same Work → selected Task → exact Live → reload → same Task → same
Work → Work queue needs seven link activations and a reload, no sidebar, ID entry,
search or Browser Back after the entry. Contextual inventory/source/destination/
exception/history handoffs retain B's fixed owned returns. Creation → Work →
review queued Task → explicit command → same persisted outcome retains C's flow.
Exceptions alarm selection carries alarm UUID even if codes repeat; unknown
tasks link to investigation, not fabricated retry. Equipment links preserve the
selected equipment even after task reassignment. Inventory retains stock/load/
location subnavigation and exact owned relationships.

Browser acceptance covers 1440/768/390 widths, both locales and themes, Axe,
overflow and keyboard flows. These are production-build deterministic viewport
tests, not physical industrial-tablet, hardware, production-command or usability
study evidence. Many non-movement administrative/scheduling capabilities remain
S4–S7; disclosure does not imply shipment. Empty bounded attention is not health
clearance. Observations require reload and backend command validation.

Manual revision 2026-10-05.2 uses the existing structured bilingual source and
PDF pipeline. All five English and four Chinese rendered pages were inspected:
no clipping, missing glyphs or footer collision. Accessible web remains primary;
PDF/UA or tagged-PDF conformance is not claimed.

Independent review found an equipment-context exactness defect, corrected with
a reassignment/shared-observed-task regression. Work queue retains operations.view,
current warehouse, session freshness/expiry, private no-store and independent
backend service/user authorization. SQL roots/counts share one statement snapshot;
pagination is not a cross-request snapshot. Large-scale aggregate query cost and
authenticated production p50/p95 remain unmeasured; do not claim a speedup.

## Verification and delivery

Full `npm run verify` passed: 608 fast tests, 88 real PostgreSQL tests, 41
production-build browser tests and the production public-demo denial harness.
Separate API build passed. Format, secrets, icon/manual source/hash/extracted-text,
type and dependency checks pass; production audit reports zero vulnerabilities.
Only the 15 existing legacy lint warnings remain. Independent final re-review
confirmed the equipment-context blocker resolved. Initial locator/routing-wait
failures were corrected with exact disclosure/context waits, not skipped tests.
Local PDF text tooling was resolved using the bundled Poppler binary path.

Exact-HEAD CI and deployment/runtime outcomes remain post-checkpoint gates;
do not infer deployment readiness from local tests.
