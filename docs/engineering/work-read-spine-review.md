# A — Reloadable Work read spine review

2026-10-04. Independent security review and Operator/Emil review of ADR 0030.
This establishes a business-work read foundation, not B–D completion.

| Before                                                    | After                                                                 | Why                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Task exposes origin alias without a durable business page | Server-resolved receipt/order Work URL and Task → Work link           | Reopen the same job without remembering identifiers or repeating search |
| Business request visible only through task cards          | Recorded contents and outbound destination above execution            | Empty/unresolved execution must not erase the known request             |
| A task result could be mistaken for whole-job progress    | Recorded root state, whole-qualified task counts and coverage warning | Preserve split-outbound meaning and unknown/incomplete evidence         |
| Engineers' raw identities dominate investigation          | Human reference, readable states, route and quantity; UUID disclosed  | Reuse neutral tokens and avoid new motion or diagram truth              |

Independent review found no security blockers. It required explicit root/load-
receipt warehouse and historical allocation-source qualification, one transaction
client and independent audit permissions. Review of business summary found a
32-bit aggregate overflow edge; safe numeric conversion and a 3-billion quantity
regression resolve it without expanding supported command quantities.

## Evidence and limits

- Full repository gate: 542 fast tests, 83 real disposable PostgreSQL tests,
  36 production-build Chromium tests, public-demo denial harness; separate API
  build passes. Secrets, formatting, icon/manual/PDF checks and dependency audit
  pass; zero production vulnerabilities, existing 15 legacy lint warnings remain.
- PostgreSQL checks root/warehouse/flow identity, keyset ties and cursor binding,
  multi-task outbound with partial task completion, historical-versus-current
  locations, broken allocation source/source-receipt lineage, foreign task/load
  locations and equipment, coverage omissions and concurrent-write snapshot.
- Independent focused review: 4 files / 36 tests. UI unit tests separately prove
  no-audit-permission and empty/unresolved request presentation. Browser tests
  exercise direct/new-tab/reload, malformed identity, noindex, read-only BFF and
  switch-complete foreign-root 404. Two initial browser test races were corrected
  by waiting for navigation/switch completion rather than weakening assertions.
- Starting at Tasks: open Task → Work → Task → Work = four link transitions.
  After the initial queue there is no sidebar, search, manual ID entry or Browser
  Back dependency. Reopening/reloading Work is server-resolved. Keyboard Enter,
  Axe, no horizontal page overflow, 1440/768/390 CSS-pixel widths, both locales
  and light/dark are covered. These are viewport tests, not physical tablet tests.
- Existing inbound/outbound/recovery browser journeys remain green; new Work
  browser projection is a deterministic fixture, while read SQL uses real local
  PostgreSQL integration. No authenticated production performance claim.
- Manual revision `2026-10-04.1` synchronizes shipped Task → Work guidance, with
  both PDF artifacts/manifest regenerated; all nine rendered pages reviewed and
  changed English/Chinese sections inspected at readable scale.

Remaining UX: exact Live/entity/exception selections and owned returns (B),
created-job continuation/action/outcome meaning (C), consolidated operator IA and
five complete jobs (D). Read evidence never authorizes commands. Deployment,
exact-HEAD CI, authenticated runtime and clean state are post-push delivery gates.
