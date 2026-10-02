# S2 Navigation Product Quality Plan

Status: Active

Owner requested this cleanup after the verified Locations checkpoint. Two
independent checkpoints follow: navigation latency, then active product identity.
Both precede the next Live View slice. No marketing or new roadmap is introduced.

## Navigation evidence and decision

Medium-risk read-model/UX optimization; persistent plan required. No new ADR:
reuse existing session, permission and scoped read contracts without a cache,
authority lifetime or security-model change.

Repository baseline: Home SSR validates the persisted session once, then fetches
summary and Home separately. Home reuses `getDetails(..., true)`, not `getSummary`;
their facts differ, so blindly deleting summary would change product meaning.
Home unnecessarily reads locations, active topology, nodes and edges that its
pure projector never consumes: eight SQL reads with active topology. Summary
adds three. Two independent 10-second browser refresh loops also each perform
their own NextAuth persisted-session revalidation. Main navigation provides no
pending feedback while SSR waits for Vercel → Render → PostgreSQL.

Selected change: preserve summary/Home semantics but combine same-screen reads
behind one authorized overview endpoint and one BFF refresh. Reduce Home to four
consumed collections (tasks, equipment, inventory, alarms). Keep independent
partial/unavailable projection states, no atomic-snapshot claim. Preserve all
existing endpoints. Add localized accessible navigation-pending feedback with
error/cancel completion and reduced-motion support. Avoid overlapping refreshes
and abort obsolete UI requests. Keep per-request auth validation, warehouse
scope, permission enforcement, context-switch audit and mutation contracts.

No cross-request session/result cache, speculative authorization prefetch,
relaxed failure handling or longer authority TTL is permitted. Pages Router
prefetch behavior must be inspected from the installed runtime; do not assume
App Router cache semantics. Deployment region/provider changes are out of scope.

Acceptance: query-budget/output tests, overview HTTP/BFF scope and failure tests,
SSR and production-browser single-read/pending/partial/unavailable checks,
session-revocation/warehouse-switch regression, bilingual themes/mobile/keyboard
review, complete verify plus API build, staged secret/diff review, push and CI,
deployed private boundary and readiness. Runtime timings without an authenticated
deployed session do not establish real operator-navigation p95; document that
limitation rather than claim a measured production speedup.

## Navigation implementation and review

`/api/v1/operations/overview` and `/api/operations/overview` preserve the
summary/Home read models under the same `operations.view` and validated current
warehouse. One SSR session read and one API call replace the two data calls;
one nonoverlapping, abortable browser refresh replaces two independently
revalidated BFF reads. Null branches preserve independent failure meaning and
last-known evidence, not current state. Existing summary/home/details endpoints
remain compatible. Home state remounts by warehouse and initial projection so
context changes cannot retain the previous warehouse's UI collection.

The normal Home query budget drops from eight to four collections (locations,
topology, nodes and edges are unused by the projector). Summary still uses three
queries: total read budget 11 → 7. Persisted session validation is unchanged and
still precedes reading operational data; transaction locks, expiry/revocation,
permission/scope resolution, audit and context-switch behavior remain intact.
No TTL/result cache or speculative authorization was introduced.
Partial projection failures emit a request-correlated warning through the
existing runtime logger with only availability booleans, never raw errors,
credentials or principal details. Self-review added this signal so a 200 partial
read cannot silently erase operational failure evidence.
Review also suppresses empty-list "currently no work/attention" assertions after
a failed Home refresh; only successfully refreshed evidence may assert absence.

Installed Next.js Pages Router `link.js`/`router.js` confirms SSR Link prefetch
loads route code rather than SSG data; `__N_SSP` data is evicted after navigation.
Keep code prefetch. Do not transplant App Router caching assumptions or issue
authorized projection reads speculatively. SSR and Vercel/Render/PostgreSQL
network latency remains real; cold starts/region alignment require separate
deployment evidence and are not claimed fixed by a loading indicator.

| Before                                                | After                                                        | Why                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Silent wait during SSR navigation                     | Localized high-contrast polite status for pending navigation | Immediate keyboard/touch feedback without pretending data is ready              |
| Independent Home refreshes each revalidate            | One scoped overview BFF read per interval                    | Eliminate duplicate same-screen validation and network work                     |
| Home loads unused topology collections                | Four consumed collections, seven total overview reads        | Reduce database work and dependent query waves without changing displayed facts |
| Previous Home state can survive warehouse replacement | Projection/context-keyed remount                             | Prevent old warehouse evidence from appearing as new context                    |

Emil review uses static feedback (no decorative or reduced-motion-sensitive
animation), token contrast, nonblocking pointer behavior and native route
events. Cancellation/completion removes feedback; obsolete completion cannot
clear a newer destination. Query/output tests, HTTP/BFF guard and per-request
validation tests, persisted-session regressions, PostgreSQL scoped equivalence
and authenticated production-build single-refresh/partial-failure/delayed-route
checks are required. No new auth decision or authority cache warrants a new ADR.

Actual authenticated deployed navigation p95 is not yet measured: no reusable
authenticated deployment session is available to this runner. Local
production-browser runtime and scoped query budgets provide reproducible
evidence, not a production latency guarantee; deployed private endpoints and
readiness are checked separately. Do not reset credentials merely to collect
performance evidence.

## Product identity follow-up

Inventory active titles, favicon/app icon, metadata/Open Graph, login, operations,
entry and navigation. Replace legacy WCS Demo/female.png identity with Smart
Warehouse Platform and a neutral replaceable SWP icon, without redesigning the
Public Website. Dormant legacy source is explicitly reference-only.
