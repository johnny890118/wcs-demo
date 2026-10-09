# Single-warehouse-first navigation acceptance

Status: implementation, complete verification and local journey review passed;
recoverable engineering checkpoint, not Owner visual approval. Superseded delivery
scope: continue the Owner-approved full design-system quality consolidation before
final visual handoff. S3 paused.
Baseline: `f9a86686103bbbb39ae5ed2336699bca7133244e` (clean, matches main).

Risk: medium cross-surface UI/safety-context presentation; no authorization or
domain change. Persistent plan and review evidence required. No Site domain or
new ADR needed: this documents an Owner-approved presentation decision.

Sidebar requires landscape, at least 1024 CSS px width and 600 CSS px height;
otherwise Topbar. This handles tablet portrait, phone landscape, split windows
and zoom without device/user-agent branches. Desktop collapse remains persisted.
Only one visible global navigation; contextual Work tabs remain secondary.

Single authorized warehouse has no general switcher/name strip. Multiple scopes
have a navigation-owned switch disclosure. Invalid context stays explicit.
Target warehouse and execution source remain visible when creating/executing or
interpreting Live/recovery; all runtime dimensions inspectable in preferences.
Existing strict session switch, permission checks, drafts and exact context stay.

| Before                                            | After                                                                   | Why                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| Tablet fixed rail from 768px                      | Content/landscape/height-based Sidebar or Topbar                        | Preserve space in portrait and phone landscape     |
| Every page has standalone warehouse/runtime strip | Navigation switch only for multiple scopes; action-local safety context | Single-site work first, no redundant chrome        |
| Runtime labels always visible                     | Details in settings; relevant source on safety surfaces                 | Progressive disclosure without hiding safety truth |

Gates: focused tests; full verify/API build; skills/security review; actual four
navigation contexts in both themes/locales; single/multi/long-name fixtures;
switch authorization/error/session/draft/context/focus; fresh-login diagnosis
separate from existing-session proof; checkpoint/push/exact CI/matching providers
and deployed read smoke; clean tree; actual labelled screenshot handoff.

## Findings and proportionate review

First focused browser run passed seven of nine journeys. Resize focus restoration
could steal focus from a newly visible trigger; fixed restoration to act only on
the hidden former navigation or an open overlay. Warehouse switching intentionally
remounts scoped SSR content and closes its old Popover; regression now reopens the
current authorized selector and asserts its value, preserving the scope assertion.
Repeat passed adaptive navigation, single/long warehouse and authorized switching.
Native session-update, permissions, unknown result, one-attempt and command state
remain untouched. Source/target labels are presentation context, not new authority.
Final review also found that a warehouse Popover could outlive its hidden
navigation on rotation. It is now controlled by navigation identity, closed on
geometry change with focus restored to the visible navigation; regression checks
that the old selector is gone and the new warehouse trigger is focused.

Fresh production login diagnosis: the downloaded `.vercel/.env.production.local`
snapshot (modified September 19) contains a redacted password placeholder, not
usable credential proof. Vercel's read-only environment UI shows the production
password is a Secret updated September 21, username Config added September 19.
No value was revealed or changed. This explains why testing with that snapshot
cannot validate the current production credentials; no authentication bypass or
reset is justified. Real fresh production login remains unverified without the
actual current credential; existing-session reads are separate evidence. Valid
isolated credentials still exercise the complete owned login and persisted-session
issuance path, with auth/security regressions retained. Do not claim that lack of
valid production proof universally proves absence of a production regression.

## Delivery evidence

- First complete `npm run verify`: exit 0, including 45 browser journeys and the
  production-build public-demo denial boundary. API build: exit 0. Focused login,
  session/security and Shell tests: 41 passed.
- Final full verify rerun: exit 0, all 45 browser tests and production-demo boundary
  passed, including the rotation Popover refinement and regression. During final
  test additions, typecheck rejected a testing-library `exact` option; replaced
  it with an anchored name regex and formatting, then reran the entire gate.
- Actual browser captures: Desktop 1440x900 Inbound; landscape tablet 1180x820
  Live; portrait tablet 820x1180 Live; phone 375x812 Inventory and 844x390 landscape.
  Light/Dark, Chinese and English represented; these are the running production
  build against isolated test fixtures, not production credentials or equipment.
- Automated seven-surface matrix retains both locales and Light/Dark/System,
  Axe, measured text contrast, keyboard/focus and context-preserving journeys.
- Single/multi/long-name fixtures exercise authorized scope, action-local target,
  absence of a single-scope general switch, no overflow and unsaved draft retention.
- Security review: no auth, API, domain, session, permission or warehouse-scope
  implementation changed. Existing strict switch/revalidation/denial and command
  confirmation/unknown-result tests remain. Labels never authorize an operation.
- Pro Max review: navigation uses actual usable geometry, compact progressive
  disclosure, existing neutral-first controls, no duplicated global bar.
- Emil review: preserved the delivered Popover/form/History/Live components;
  action-local context avoids wasted first-screen chrome. Long switch labels
  truncate only in the compact trigger; full authorized option remains available.
- Exact-HEAD CI, matching Vercel/Render, deployed smoke and clean Git evidence are
  recorded in the final delivery receipt and screenshot gallery after push.

Screenshot gallery: external visualization workspace `single-site-navigation/`;
all captions distinguish CSS viewport, isolated runtime and deployed evidence.
No roadmap expansion; S3 remains paused for Owner visual acceptance.
