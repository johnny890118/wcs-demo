# Bounded standards and visual-evidence convergence

Status: Engineering implementation and local verification complete in two
independent stages; Owner visual acceptance pending. Exact release proof is
recorded per checkpoint in the external comparison manifest/handoff, never
inferred from local tests. S3 remains paused. No product/security-contract change.

Baseline: local HEAD and remote main `64025dcf3575ac412776340f980bb6c370a8300d`,
clean working tree; exact CI `38272986669` successful. Historical gallery,
30-image focused export and 360-image support matrix are preserved externally.

Risk: medium dependency/configuration regression in stage 1; broad presentation
regression in stage 2. Persistent plan required. Owner's standards establish the
maintenance decision; no new domain/security ADR needed. Do not delegate visual
acceptance to automated tests or skills.

## Stage 1 — governance and proven redundancy

- [x] Inspect Git, source consumers, Flat Config, historical/default contradictions.
- [x] Establish Current / Historical / Superseded / Pending Owner Decision authority.
- [x] Remove only unused chakra, duplicate ESLint config, unused link style and Tailwind defaults.
- [x] Full verify, API build, source/staged secret review; isolated technical commit follows.
- [x] Push, exact CI, matching Vercel/Render SHA and safe read-only smoke.

## Stage 2 — bounded A–E evidence

- [x] Preserve comparable Before for exact context, Exceptions, Live, History and Home.
- [x] Measure first-screen evidence, repeated labels/containers and record density.
- [x] Fix supported shared causes only; record retained designs and aesthetic options.
- [x] Same fixture/viewport/locale/theme After, precise destinations and safety regression.
- [x] Skills/source/image/journey review, full verify and API build.
- Release gate: separate commit/push/exact CI/providers/smoke and clean tree;
  publish the exact proof with the external comparison manifest before Owner handoff.

Keep all precise destinations, permission states, observed-versus-assigned source,
unknown/stale evidence, audit redaction and command confirmation. Missing valid
fresh-production credentials means Pending Verification, never bypass/reset.
Repository visibility/protection decisions remain Owner-only. Stop after this
bounded delivery; do not start another visual iteration or S3 automatically.

## Stage 1 local evidence — 2026-10-13

Complete `npm run verify` exited 0: 653 fast tests, 88 separately executed real
PostgreSQL tests, 52 production-build browser tests, full build and public-demo
denial. Formatting, icon/manual integrity, secrets, typecheck and production
dependency audit passed (zero production findings). Separate API build passed.
The existing 15 Legacy lint warnings and nine dev-tree dependency findings remain;
no check, timeout or security assertion was weakened.

The first gate stopped at secret scanning because the removed ESLint file still
existed in the index enumeration. Its intentional deletion was staged and the
entire gate rerun successfully; the scanner itself was not changed. Lock diff
removes only chakra's root entry and package node; local install with lifecycle
scripts disabled removed one package. No runtime source, authorization, session,
warehouse resolver, API or command code changed. CSS/config deletions have no
consumers, not a new visual behavior. Source/diff review and skill authority review
are agent checks, not independent human approval or Owner visual acceptance.

Baseline exact CI `38272986669` passed; read-only current Vercel list reports
Production Ready at the full `64025dc` SHA and Render reports Live/last successful
at that same SHA. New checkpoint delivery must be verified after push, not inferred
from this baseline. Fresh production login remains Pending Verification without
valid credentials; no reset, bypass or existing-cookie-as-fresh claim.

Stage 1 delivered: `a64c53b5b8df822f119d16daad48a4c304b2d380`, exact CI
[38281318235](https://github.com/johnny890118/wcs-demo/actions/runs/38281318235)
successful, Vercel canonical alias Ready at that SHA
(`dpl_5Q48EFB5nNeY7p8BrfHh8taPMVXC`), Render Live at that SHA
(`dep-db6h4abbc2fs7387j30g`), matching remote main and clean tree before stage 2.
First managed smoke timed out at Render liveness (70s); the unchanged repeat
passed after the deployment became Live. No timeout or auth boundary was relaxed.

## Stage 2 bounded findings — 2026-10-15

Same isolated fixture/clock, native 375×812 / 820×1180 / 1440×900 PNGs, zh-Light
and en-Dark pairs, eight cases: exact Live/load, History, faulted Exceptions,
Live current/stale/read failure and Home. Before captures predate product edits;
fixed fixture time only affects the test server, not production data/authority.
Full source/report: `../engineering/bounded-visual-convergence-review.md`.
After source corrections, focused UI tests pass 28 and the comparison browser
test passes all 48 views. It joins the existing serial operator fixture group
to prevent parallel scenario interference. Full verification/delivery still gate
the separate presentation commit.

Owner's later supplement is recorded in `legacy-ui-library-migration-plan.md`:
temporary old dependencies must ultimately be safely removed repository-wide,
not kept permanently. That migration is not mixed into this UI checkpoint.

Final local gate passes 655 fast, 88 real PostgreSQL and 53 browser tests, build,
all static/security/manual/icon checks and public-demo denial; separate API build
passes. Real keyboard/locale/theme/reload/history disclosure journey completed
on the isolated production build. Exact delivery follows the presentation commit.
