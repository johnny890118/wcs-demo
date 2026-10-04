# B — Exact context handoffs review

2026-10-04. Operator/Emil and independent security review of ADR 0031.
Delivery gates remain pending until exact CI and deployed runtime are recorded.

## Decision and review

Use a Task-anchored contextual inspector, not seven new top-level modules.
Persisted server-qualified Work/Task relationships resolve load, stock, recorded
endpoints, equipment observations, selected alarm and permitted history. Fixed
owned Work/Task returns survive direct URLs and reload. No arbitrary return URL,
label-search identity, browser cache authority or warehouse query override.

| Before                                              | After                                                                  | Why                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Readable labels link through broad substring search | Exact persisted load/location filters and server-resolved task context | Similar names and bounded lists cannot substitute another record                  |
| Live selection disappears on reload                 | Equipment selection is URL-owned and filtered before SQL bounds        | Reopen the selected equipment, or show unresolved instead of the first device     |
| Task alarm opens a general list                     | Exact task-bound, warehouse-qualified alarm and preserved selection    | Historical/cleared alarms and reassignment must not change the investigated event |
| History loses the investigating job                 | Task/Alarm-scoped history with visible Work/Task returns               | Continue investigation without Browser Back, remembering IDs or another search    |
| Frozen context can appear permanently current       | Wall-clock freshness downgrade and explicit reload                     | A snapshot cannot indefinitely claim current physical position                    |

Neutral-first existing theme tokens, human references, recorded state and owned
returns precede technical evidence. Tabs are ordinary semantic links with visible
focus and 44-pixel controls; no extra animation or command mechanism. Green stays
semantic; the brand token is unchanged. History action vocabulary is existing
audit evidence, not a fabricated business stage. Further human-meaning work is C.

Independent review found and required fixes for Live clock ageing and alarm
equipment warehouse qualification. Snapshot service serializes the shared client
and drains queued reads before rollback. Explicit alarm selection, including
history pagination/reload, does not silently change Task history to Alarm history.
After reassignment, explicit Alarm Live targets its recorded equipment; ordinary
Task Live targets current assignment. Neither is observed physical position.
Final independent focused review passed 7 files / 43 tests with no open blocker.

## Evidence and limits

- Complete repository gate: 558 fast, 86 real PostgreSQL and 38 production-build
  browser tests, public-demo denial harness and API build. Secrets, dependency
  audit, formatting, manual/icon integrity and types pass; zero production
  vulnerabilities and the existing 15 legacy lint warnings remain. Local worker
  concurrency was limited to two without changing assertions or timeouts.

- Real PostgreSQL tests exercise a repeatable-read snapshot while another
  connection moves the load, malformed/foreign/mismatched identity rejection,
  cleared alarms beyond list bounds, foreign alarm equipment suppression, exact
  equipment beyond the 100-item bound, and historical alarm/current assignment
  distinction. Existing historical outbound/partial lineage checks remain.
- UI tests enforce both operations.view and audit.view before history reads.
  A mocked mutation 401 proves rejected feedback and reuse of the strict existing
  command endpoint; real withdrawal enforcement is covered separately by the
  existing persisted human-session/server authorization regression suite.
- Starting at Task: load → inventory → source → destination → Live → exception
  → history → same Task → Work is nine owned link transitions. No sidebar,
  re-search, manual ID entry or Browser Back is required after the initial task.
  Context contains the business reference and source/destination throughout.
- Production-build browser tests directly reopen/reload all seven surfaces,
  preserve an explicit alarm through inventory/history/reload, reject forged and
  ambiguous identities, and retain no-store responses. Keyboard Enter, Axe,
  1440/768/390 CSS-pixel widths, both locales and light/dark are exercised.
  These are viewport tests, not physical industrial-tablet tests.
- The browser backend is deterministic; real SQL correctness comes from the
  disposable PostgreSQL suite. No hardware commissioning or production latency
  benchmark is inferred. Unassigned/unknown equipment, missing stock and empty
  exact location results do not prove idle equipment, zero stock or physical
  absence. Existing mutations and authentication contracts are unchanged.
- Manual revision 2026-10-04.2 synchronizes exact handoffs and record filters.
  Both existing PDFs/manifest regenerated; all five English and four Chinese
  rendered pages inspected, without clipping, replacement glyphs or overlap.

Remaining: create-to-Work continuation and split-job outcome meaning (C), operator
IA/end-to-end consolidation (D), unshipped S4–S7 capabilities. B does not create
configuration, reconciliation, physical safety or external-WMS fallback controls.
