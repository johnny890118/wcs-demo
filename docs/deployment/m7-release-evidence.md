# M7 product-experience release evidence

Release gate completed on 2026-09-20 for the simulator-backed product operations experience. No physical adapter was enabled, no provider secret was copied into the repository, and no shared Git history was rewritten.

## Candidate and delivery

- Release candidate: `fcbdb6af4b1b15971316860b23c69084de611aaf` (`test(release): add managed M7 experience gates`).
- GitHub Actions [Verify run 35498059149](https://github.com/johnny890118/wcs-demo/actions/runs/35498059149) completed successfully in 2m38s; both `verify` and `deployment-smoke` succeeded at the exact candidate.
- Vercel production deployment `dpl_CyN638xG6xVdnvhi9szhje3SJACM` was `READY`; deployment metadata identified the exact candidate SHA and the canonical [https://wcs-demo.vercel.app](https://wcs-demo.vercel.app) alias.
- Render deployment `dep-danp1ngjo6nc739n3gj0` was `Live`; the service dashboard identified the exact candidate SHA for [https://warehouse-platform-api.onrender.com](https://warehouse-platform-api.onrender.com).
- Local and CI repository gates passed with 153 fast tests, eight PostgreSQL integration tests, 15 Chromium E2E tests, the production web/API builds, secret hygiene, and zero known production dependency audit findings. The 15 known lint warnings remain isolated to the explicit legacy migration reference.

## Product-experience proof

- The canonical `/` entry, keyboard skip link, metadata, robots/sitemap output, 200%-equivalent reflow, and real-browser axe scan passed.
- Chromium exercised the persisted `zh-TW`/English × light/dark matrix. The matrix exposed transient low contrast during theme interpolation; theme changes now suppress transitions while ordinary press feedback remains intact, and all four combinations pass axe.
- Authenticated browser flows completed confirmed inbound, outbound, and alarm acknowledgement/release workflows against the isolated deterministic WCS fixture. The suite also proves focused projection semantics, topology-qualified equipment observations, mobile reflow, and deterministic inbound/outbound/fault scenario outcomes.
- Manual review covered desktop and 390 × 844 mobile layouts. The mobile root reported matching 390 px client and scroll widths. The deployed candidate rendered the English dark entry with `lang=en`, the expected heading, and no horizontal overflow.

## Managed-environment proof

`npm run test:managed-demo` passed after both managed providers reported the candidate live. The read-only gate proved:

- `/` returns the product shell;
- `/platform` redirects permanently to `/`;
- `/legacy` remains available with `X-Robots-Tag: noindex, nofollow`;
- unauthenticated `/operations` redirects to sign-in and remains noindex;
- robots and sitemap output distinguish canonical, private, and migration-reference surfaces; and
- Render API liveness returns the expected healthy payload.

The earlier managed release evidence remains the destructive-scenario and backup record. This M7 gate deliberately did not reset or mutate the shared managed demo merely to re-prove UI delivery.

## Explicit limitations

- Automated axe, keyboard, token contrast, Chromium reflow, and manual visual checks do not claim parity with VoiceOver, NVDA, every browser, or a real mobile device. Those pairings remain a periodic release activity.
- The public demo is simulator-only. Repository, CI, and managed-demo evidence does not authorize physical equipment connectivity or imply safety certification.
- The public managed gate is credential-free and read-only. Authenticated workflow mutation remains covered by isolated deterministic E2E and the prior managed scenario record.
