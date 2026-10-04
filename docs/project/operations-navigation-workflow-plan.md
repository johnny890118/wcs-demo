# Operations navigation and operator workflow slice

Status: Active — independent freshness/read-foundation checkpoint verification

## Owner-approved scope correction (2026-10-04)

The Owner approved Work-centered Operator Experience A → B → C → D after this
existing WIP reaches its own verified, pushed, exact-CI/deployed clean checkpoint.
Do not combine UX implementation with this checkpoint or start with sidebar
changes. Resume S3 after the approved UX sequence, not directly after this WIP.
Earlier operator-context/IA items below are historical planning, not this
commit's acceptance. Preserve current pages and command authority.

This checkpoint retains the configurable 900-second default, privacy-safe timing,
request-isolated opaque read metadata and tested bounded cache primitive. The
cache remains unwired: no client navigation deferral, persistent shell or prefetch
is claimed. Activation requires a separately measured use case and complete
invalidation/UX/security integration. Do not discard the primitive or claim it
improves runtime navigation.

Independent security review required pending-result authority expiry/missing
metadata checks. Regression tests cover null/invalid/changed scope, exact deadline
and late invalidation. SSR/BFF wrappers add private/no-store across success and
denial. Strict mutation/switch and expiry remain unchanged. Full verification and
same-workload after measurement gate commit; exact HEAD CI, both providers and
managed smoke gate continuation to A.

| Before                                                             | After                                           | Why                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Proposed cache/layout changes without demonstrated runtime benefit | Existing UI retained; cache explicitly inactive | Avoid hiding workflow friction behind unsupported performance claims   |
| Task-context UX bundled with auth WIP                              | Work read spine and A–D delivered independently | Keep security checkpoint coherent and follow approved product ordering |

No new motion, navigation or visual design is introduced by this foundation.

## Entry checkpoint

S3 ownership `3288ffc` and rolling-startup repair
`d945795ad371d30192ace76477f938afdef6283b` are pushed. Exact repair CI
`37182536826` has both jobs successful; Vercel succeeds, Render Live points at the
same full SHA, managed runtime smoke passes and the tree is clean. No public
issuance/worker was enabled. This is an independent Owner-directed slice; resume
S3 after its own delivery gates, not during its WIP.

## Risk and decision process

High risk: authorization freshness, warehouse/permission-sensitive read caching,
and operational action UX. Persistent plan and independent security review are
required. Follow intent → repository evidence/baseline → ADR → implementation.
Use the installed UI workflow/Emil skill for operator-oriented review; safety and
WCAG 2.2 AA override cosmetic motion. Keep Pages Router/single deployment and no
new large state library absent evidence. No marketing or wholesale IA rewrite.

## Separate acceptance concerns

1. Configurable read freshness default 900 seconds; 0 strict, exact deadline,
   missing/malformed/future stamp, independent expiry, durable withdrawals and
   strict warehouse switch/all mutations remain verified. Explicitly document
   worst-case stale read authority until the earlier freshness/expiry deadline.
2. Measure click → usable view and stages before changing navigation. Distinguish
   browser testing overhead from event-to-render timing, local production build
   from production-like and deployed production. Prefer immediate persistent-shell
   reaction plus safe bounded read loading/prefetch/cache only where evidence
   supports it. Scope cache by warehouse, authority, locale and filters; invalidate
   on context/permission/session changes and mutations. Clearly label retained
   stale data/failed refresh; cached read data never authorizes commands.
3. Human-readable and operator-actionable hierarchy: attention before KPIs,
   readable entity/location/state/impact/next action, diagnostics disclosed rather
   than primary UUID/enum output, contextual Task → entity → Live → back → action
   → history. Record actual workflow navigation count and scenario gaps rather
   than claiming whole-product UX completion from visual polish.

## Work and delivery gates

- [x] Inspect SSR/auth/projection/navigation/session-provider state and measure
      same-workload before baseline, including API/query timings where available.
- [ ] Record evidence-backed minimal architecture decision and cache/freshness
      contracts before implementation.
- [ ] Implement and separately test auth, read navigation and operator context.
- [ ] Full verify/API build; security review and operator scenario screenshots,
      bilingual themes/mobile/keyboard/axe, direct entry/back/forward.
- [ ] Same-workload after timing/cache/validation and workflow-count comparison;
      no speedup claim if total does not improve, no fabricated production p95.
- [ ] Durable knowledge/manual synchronization where changed guidance requires it.
- [ ] Staged/secret review → coherent commit/push → exact CI → exact Vercel/Render
      → managed runtime → clean, then automatically resume established S3 gates.

## Initial repository observations

OperationsShell is mounted inside each page component; `_app` provides session,
theme, locale and timing but no persistent Operations layout. Existing route
progress signals waiting while Pages Router getServerSideProps still fetches
projection before replacing the view. Inventory search uses native GET navigation;
pagination has local state, not a shared projection cache. Existing measurement
script labels before as strict 0 and after as 3600 and times Playwright click
completion plus a generic h1: it must be adapted/calibrated for this slice's
same-auth workload and reliable usable-state comparison. These observations are
hypotheses about bottlenecks, not measured production conclusions.

## Before evidence

`node scripts/measure-navigation.mjs before workflow` on stable production builds
produced 60 measured navigations with identical 3600-second pre-change read policy:
Home, Tasks, Inventory → Loads → Locations, Live and Exceptions. Loopback real
Nest/PostgreSQL; temporary generated identity only, not deployed credentials.

| Stage                                        | p50 ms | p95 ms | Qualification                                                  |
| -------------------------------------------- | -----: | -----: | -------------------------------------------------------------- |
| Automation start to settled view             |  83.20 |  84.67 | Includes Playwright click overhead                             |
| Actual click event to two-frame settled view |  47.40 |  49.10 | Browser usable-view upper bound, not paint instrumentation     |
| Next SSR                                     |   7.03 |  11.14 | Server-Timing                                                  |
| Projection HTTP                              |   6.32 |  10.35 | Server-Timing                                                  |
| API handler                                  |   4.94 |   8.86 | Server-Timing                                                  |
| Accumulated DB/query                         |   7.70 |  33.43 | Concurrent query time is not additive wall-clock critical path |

Persisted validation spans: 0/60. This baseline cannot show deployed WAN/cold-start
latency and does not prove authentication dominates. The first attempted workload
incorrectly assumed a Loads sidebar link; it timed out and cleaned up its own
temporary resources. Corrected workload follows actual Inventory subnavigation.
Evidence is `tmp/navigation/workflow-before.json`; retain the same workload and
measurement conventions for after. Prior freshness-only before/after files remain
unchanged.
