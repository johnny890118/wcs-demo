# S2 Human Session Freshness and Navigation Timing

Status: Engineering verification/review complete; independent slice after
verified checkpoint `375d6f0`. Checkpoint pipeline must confirm exact remote SHA,
CI/deployments and managed runtime before continuing S2 acceptance closure.

## Intent and risk

Owner requests fewer Vercel-to-API-to-database round trips during ordinary
authenticated read navigation, with configurable 60-minute claim freshness,
unchanged expiry, immediate mutation/warehouse-switch validation and observable
security trade-offs. High-risk authorization change: persistent plan, ADR,
fresh-context independent security review and full verification are required.
Do not redesign identity/RBAC, add marketing, begin S3 or cache mutation authority.

## Repository evidence and decision

NextAuth currently validates persisted human session/assignments on every JWT
restore (ADR 0018). Protected SSR then fetches a separate projection. Nest API
authenticates the BFF and evaluates forwarded permissions/current warehouse for
each request; it does not independently re-query human sessions. Therefore cached
read claims necessarily delay principal/assignment/permission/session invalidation.
There is no event-driven revocation channel. Preserve strict validation as the
default for unknown callers, NextAuth endpoints, all mutations and warehouse updates.
Only explicitly wrapped read-only Operations SSR/BFF requests may reuse claims.
Request-local context must be isolated across concurrent requests, never global.

Use a bounded configurable read freshness interval, default 3600 seconds and
range 0–3600; 0 restores per-read validation. Check persisted reference expiry
even inside the window. Stamp last successful server validation inside encrypted
JWT only; missing/malformed/future timestamp forces validation. Exactly at the
boundary revalidate. Window reuse must not renew its timestamp. Update/switch
ignores window; validate before supported mutation forwarding. On required
validation failure clear authority. A registry outage inside an already verified
window is not observed until the window expires; document that limitation rather
than calling it immediate revocation or outage detection.

## Work sequence

1. Record ADR 0022 and add privacy-safe request timing for session validation,
   projection API, API handler and accumulated database queries; browser timing
   measures total authenticated navigation separately.
2. Capture baseline against a production-build Next/Nest/PostgreSQL local stack,
   not the mocked browser fixture. Use disposable test-only identity/configuration;
   never print cookies, credentials, session IDs, query text/parameters or raw URLs.
3. Implement bounded signed read claims with explicit read-only request policy.
4. Test disable/revoke/permission changes, session expiry, warehouse switch,
   mutation revalidation, exact window edges, invalid config/claims, concurrent
   policy isolation, outage/fail-closed and API permission/warehouse denial.
5. Capture matched post-change navigation p50/p95 and validation request counts;
   label production-like local measurements distinct from production.
6. Independent security review; fix findings; full `npm run verify`, API build,
   secret/diff review, coherent commit/push, exact Verify/deployment-smoke,
   Vercel/Render and managed runtime. Continue S2 acceptance closure after clean.

## Acceptance and limitations

## Matched production-like measurement

`scripts/measure-navigation.mjs before|after` uses the same production-build
Next/Nest stack with disposable loopback PostgreSQL and generated test-only
credentials; 3 warm-up navigations followed by 60 actual sidebar clicks across
Tasks, Inventory and Live View at 1440×900. No mocked API, production credentials
or deployed measurement. Raw timing-only JSON remains ignored under
`tmp/navigation/`. The exact disposable container is removed after the run;
no shared database or container is reset.

| Stage (ms)                    | Before p50 / p95    | After p50 / p95    |
| ----------------------------- | ------------------- | ------------------ |
| Browser navigation total      | 49.91 / 52.05       | 49.84 / 51.44      |
| SSR navigation handler        | 9.93 / 15.57        | 6.24 / 10.34       |
| Session validation            | 5.68 / 7.42 (60/60) | not invoked (0/60) |
| Projection API                | 3.61 / 7.45         | 5.56 / 9.60        |
| Accumulated API handlers      | 7.46 / 12.76        | 4.36 / 7.86        |
| Accumulated client query time | 9.38 / 16.37        | 6.00 / 18.97       |

The eliminated validation round trip and reduced SSR timings are observable.
Total local click latency is effectively unchanged; projection/query variation
precludes claiming universal speedup. Parallel query totals can exceed handler
wall time. Network/cold-start production effects remain unmeasured. Audit/help/
manual, root/login and NextAuth-owned session endpoints stay strict. Approved
ordinary Operations SSR and read BFF wrappers allow only GET, not HEAD or POST;
all six supported mutation BFFs remain unwrapped/strict. Future unknown routes
inherit strict validation.

## Security acceptance

Independent fresh-context review found no blocking defects. Its optional complete
route-chain regression is now exercised against the real local stack: the same
fresh encrypted JWT is restored separately for each of six mutation routes after
principal disable, assignment revoke, permission removal and session revoke.
All 24 attempts are denied (401 for withdrawn identity/session/scope, 403 for
removed mutation permissions), while fresh reads return 200 as explicitly
authorized by the bounded-read trade-off. Real PostgreSQL tests additionally
cover persisted expiry and nonrenewal, and callback tests cover strict warehouse
updates. No test database mutation touches the managed deployment.

Full gate passes 452 fast, 25 real PostgreSQL and 34 production-build browser
tests; separate API build passes. Initial full gate identified an obsolete SSR
test response without `setHeader`; the fixture now models that real response
method, with no guard disabled. Subsequent full gate passes. Runtime rerun confirms
13 bounded browser navigation entries and all 24 real mutation denials. Existing
15 legacy lint warnings remain tracked; production dependency audit reports zero
vulnerabilities. Timing-only benchmark output is ignored, not staged.

Operations records bounded browser-local `swp.navigation_total` and
`swp.navigation_interrupted` Performance entries without route/query identity,
credentials or remote telemetry. Server-Timing separates session/projection/
handler/accumulated query stages; fixed vocabulary excludes upstream descriptions.
API handler timing starts at interceptor entry (after guards), not network ingress.
Query timing includes pg client execution/wait, not database server CPU;
concurrent query sums are not serial critical-path duration.

Warm read navigation within the configured window avoids persisted validate calls
without caching projections or weakening each API's permission/scope checks.
Strict paths always revalidate. Session expiry is independent and authoritative.
No claim of immediate read revocation: old read authority may last until the
earlier of freshness deadline and session expiry. True production authenticated
p50/p95 require production credentials; unavailable credentials do not justify
password reset or an invented production result. SQL totals may exceed wall time
when queries run concurrently, and must be labelled accumulated query time.

| Before                                                       | After                                                         | Why                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Every read navigation revalidates persisted identity/session | Explicit bounded signed read claims; strict default elsewhere | Reduce actual auth round trips without granting cached command authority |
| Navigation latency has no stage attribution                  | Separate client total/auth/projection/API/query timing        | Identify real critical-path cost rather than hide it with animation      |
