# S1 access security review

Review date: 2026-10-03

Status: Complete for the accountable-access foundation. This review does not
authorize production identity or physical commissioning.

Historical S1 evidence below predates ADR 0022. Current approved read-only
freshness deliberately delays read revocation/outage detection up to the earlier
of the configured window and expiry; strict mutations/updates remain immediate.
See the S2 freshness plan and current security baseline, not an unchanged
per-restore guarantee, for the current disposition.

## Scope and threat boundaries

The review re-read the product and S1 decisions, then traced the supported path
from NextAuth identity proof through persisted sessions, BFF authorization,
service authentication, forwarded user context, warehouse-scoped repositories,
audit evidence, PostgreSQL access, logout revocation, and deployment runtime.
It also enumerated every Nest controller and every active browser-facing
operational mutation.

The reviewed trust model is:

```text
browser -> configured application origin -> signed/revalidated human session
        -> authenticated BFF service -> permission + warehouse-scoped API
        -> table-owning PostgreSQL connection
```

Anonymous Public Demo persistence and production OIDC are not enabled product
paths and were reviewed only at their existing contract seams.

## Findings resolved

1. The demo credential comparison initially short-circuited the password digest
   when the username digest differed. Commit `935b589` now performs both
   fixed-size comparisons on every configured proof, persists only a keyed
   identifier fingerprint, adds shared throttling/evidence, and keeps denial
   generic.
2. Managed PostgreSQL exposed SWP tables in `public` without row-level security.
   Commit `45140f3` enables deny-by-default RLS on all 26 platform/migration
   tables. A granted non-owner probe observes zero rows and cannot insert while
   the table-owning API, migration, seed/reset, backup/restore, and worker paths
   continue to pass. Supabase Security Advisor reports zero errors and zero
   warnings after deployment.
3. Custom operational BFF mutations relied on cookie `SameSite` behavior without
   an explicit origin contract. Commit `d414e11` requires the exact
   `NEXTAUTH_URL` origin before session resolution on all six inbound, outbound,
   execution, acknowledgement, and recovery routes. The public-site origin is
   deliberately not an implicit command origin.

No unresolved finding permits an unauthenticated browser, a foreign origin, a
non-owner database role, or an out-of-scope authenticated operator to enter the
supported operational command path.

## Accepted limitations and production gates

- The credentials adapter proves one private-demo identity. Production identity
  remains OIDC-first and requires provider discovery/configuration, provider
  logout semantics, MFA/conditional-access policy, account lifecycle, and access
  review before enablement.
- Per-identifier throttling does not replace shared edge abuse controls and does
  not bound security-event growth across arbitrary identifiers. Alert routing
  and deployment-specific retention/export remain required.
- Sign-out revocation has bounded retry and structured delivery outcomes, not a
  durable delivery queue. Sessions still fail closed on every restore and have a
  bounded absolute lifetime.
- The BFF-to-API bearer credential and PostgreSQL owner credential remain
  high-impact server secrets. Rotation, multiple service identities, mature
  alerting, and customer access review remain commercial-operability work.
- RLS is a direct-access deny boundary, not a second warehouse authorization
  model. Effective permission and warehouse scope remain authoritative in the
  API.
- Public Demo persistence, isolation, quota/capacity, cleanup, reset evidence,
  and replay remain S3. Physical deployment still requires the separate OT
  threat/risk and commissioning controls.

These limitations do not block S2 product work in the current authenticated
private-demo/simulation deployment. They do block any claim that the current
identity adapter or deployment is production-ready.

## Verification evidence

- Commit `935b589`: GitHub Actions run
  [37050898708](https://github.com/johnny890118/wcs-demo/actions/runs/37050898708)
  passed `verify` and `deployment-smoke`; Render and Vercel deployed the exact
  commit and the managed-demo gate passed.
- Commit `45140f3`: GitHub Actions run
  [37051878566](https://github.com/johnny890118/wcs-demo/actions/runs/37051878566)
  passed both jobs; Render deployment `dep-db00170ae00c73e3s5o0` was Live, API
  readiness passed, and the managed database advisor reported zero security
  errors/warnings.
- Commit `d414e11`: GitHub Actions run
  [37052939060](https://github.com/johnny890118/wcs-demo/actions/runs/37052939060)
  passed both jobs; Vercel production deployment
  `dpl_DW4c9utPcBXjZEs2SdwTeDjj6BqY` was Ready for the exact commit. A live
  foreign-origin mutation returned `403 ORIGIN_FORBIDDEN`, the same-origin
  unauthenticated request returned `401`, and `npm run test:managed-demo`
  passed.
- The final local gate passed formatting, secret scan, production dependency
  audit, lint with 15 isolated legacy warnings and zero errors, typecheck, 269
  fast tests, 14 PostgreSQL integration tests through migration 0015, 21
  Chromium E2E flows, production Next.js build, and API build.

## Conclusion

S1 has a verified, fail-closed access foundation for continued system-first
development. The next coherent milestone is S2 Operational Work Center and
Inventory Visibility. Production identity and commercial-operability gates stay
explicitly open; they are not silently reclassified as complete.
