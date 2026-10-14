# Repository-wide legacy UI dependency migration

Status: Planned independent checkpoint, after current bounded UI delivery.
Owner requires eventual removal of `@heroicons/react` and `@headlessui/react`
from the entire repository, not a permanent Legacy exemption. This plan does
not start migration, change S1–S8, resume S3 or authorize route/function retirement.

## Preliminary source evidence, not completed inventory

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
