# Repository-wide legacy UI dependency migration

Status: Engineering complete independent checkpoint — Owner authorized after `197148c`.
Owner requires eventual removal of `@heroicons/react` and `@headlessui/react`
from the entire repository, not a permanent Legacy exemption. This checkpoint
does not change S1–S8, resume S3 or authorize route/function retirement.

## Execution boundary

Risk: medium interaction/dependency migration, not an auth or domain redesign.
The controlled Legacy login must retain its existing signIn parameters and
engineering-mode gating. Use the installed Radix Dialog foundation; preserve
legacy content/callbacks and improve only necessary migration semantics.
No new ADR is needed: the Owner's current frontend authority already decides
the library boundary. This persistent plan and the migration review record the
implementation decision and evidence. S3 and final visual acceptance stay paused.

Initial Git check: local main and origin/main both
`197148cccb923548e745d977ee336ca2452ade20`, clean tree, no inherited WIP.
Delivery gates: baseline browser characterization before source migration,
focused regression, full verify/API build, package/source/bundle absence,
security/design review, independent checkpoint/push, exact CI/provider SHA and
safe deployed smoke. Fresh production login remains unverified without credentials.

Implementation, behavior characterization, dependency removal and complete local
verification are complete: 659 fast / 88 real PostgreSQL / 60 browser tests,
production and API builds, package/source/generated absence proof. Exact pushed
CI/provider SHA and managed smoke are checked at handoff; see the
[migration review](../engineering/legacy-ui-library-migration-review.md) and its
external delivery evidence. S3 stays paused; this is not Owner visual acceptance.

## Historical initial source evidence

The complete reachability/behavior/replacement inventory is in the review above.

- Heroicons: `components/nav.js`, dormant `pages/about.tsx`.
- Headless UI: `components/nav.js`, `goModal.js`, `carInfo.js`, `mapDetail.js`,
  `logIn.js` (under `components/`). These include Disclosure, Dialog and Transition.
- Chart.js, Axios and classnames remain for their characterized consumers; they
  are not silently added to the removal target.

## Required independent sequence

1. Complete static/dynamic imports, route reachability, scripts, tests, bundle and
   lockfile inventory. Record each component's supported behavior before editing.
2. Characterize Legacy navigation, dialog focus/Escape/return, field and callback
   behavior, keyboard/touch, locale/theme and route/function continuity.
3. Replace icons with named Lucide imports; migrate interactions to inspected
   owned shadcn/Radix or appropriate native composition while preserving behavior.
   Do not blanket initialize, overwrite formal components or delete Legacy routes.
4. Verify every consumer and negative state, then prove no old imports, dynamic
   consumers or compiled runtime references remain. Only then remove packages and
   lock entries; retain upstream attribution where applicable.
5. Full verification, API build, secrets/dependency review, separate coherent
   commit/push, exact CI/provider SHA and safe runtime smoke.

Any proposed function/route retirement needs Owner decision before removal.
An installed old dependency during migration is not a new formal-UI standard.
