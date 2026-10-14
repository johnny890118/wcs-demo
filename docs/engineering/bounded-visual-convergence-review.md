# Bounded evidence-based visual convergence

Status: implementation, full local verification and runtime review complete;
exact checkpoint delivery gates follow push. Owner alone grants visual acceptance;
S3 remains paused.
Review date: 2026-10-15. Product baseline: delivered `a64c53b`, visually identical
to `64025dc` (stage 1 removed only nonconsumed configuration/styles).

## Method / original evidence

48 Before native Chromium PNGs were captured before product edits with the same
isolated data and fixed display clock as After: eight cases × 375×812 / 820×1180 /
1440×900 × zh-TW-Light / en-Dark. Cases are exact Live/load, History, faulted
Exceptions, Live current/stale/503 refresh failure, and Home. Test fixture time
is fixed at 2026-09-18; stale uses +31 seconds. No production state or equipment
claim is synthesized. The existing complete locale/theme/system/geometry/state
matrix remains the wider regression gate, not replaced by these representative
pairs. Viewports are not physical tablet or long-duration operator tests.

Original images/metrics are retained externally under
`standardization-2026-10-13/before/controlled` and matching After directories;
the earlier `64025dc` final gallery and 30/360-image archives are untouched.
Final comparison gallery links originals, manifest, measurements and delivery
evidence, with exact source SHA after checkpoint. No credential, cookie, trace,
production customer record or provider account screenshot is exported.

## Before | After | Why — Pro Max / Emil review

| Before                                                                             | After                                                                                                                                        | Why                                                                                                                                   |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A: 375px exact Live details begin at 664px zh / 734px en                           | 572px zh / 638px en in the same fixture; compact heading/navigation, short established Live label, less repeated spacing                     | Recover 92–96px without hiding seven destinations, Work/Task returns, full Work reference or source/status qualifications             |
| A/C: identical context and Live snapshot time repeated on separate lines           | One source/time group; omit the outer timestamp only when an actual rendered Live snapshot has the same time                                 | Reduce composition noise without conflating distinct timestamps or hiding unavailable evidence                                        |
| B: all three attention entries use the same investigation label                    | Alarm / equipment / work evidence labels; alarm code + equipment context; accessible names include exact identity as disambiguation fallback | Make investigation purpose/domain clear and distinguish repeated alarm codes without inventing a human alias                          |
| D: normal History event cards are 201px high at 375px                              | Owned record-row appearance, adjacent resource/Actor, compact native disclosure; about 156px high                                            | Increase first-screen scan density while preserving chronology, full time, Actor, correlation, redaction and unknown-action semantics |
| E: Home already prioritizes attention/work before metrics with quiet owned actions | Retained; same-condition images included                                                                                                     | No demonstrated functional/root-cause defect justifies another speculative redesign                                                   |

Root causes: default spacious shared composition repeated in a context-heavy page;
generic action vocabulary; card appearance used for chronological records. Fixes
are opt-in owned component variants rather than new page-local control systems,
hardcoded colors, new animation, hidden overflow or a new IA.

Pro Max outcome searches and their one narrower retry did not provide a verified
specific content-priority/link-purpose database match. Decisions use its built-in
responsive, hierarchy, native-control/touch and accessible-name rules as a labelled
fallback, plus actual images and SWP standards. Emil review favors proximity,
stable bounds, restraint and no motion for frequent investigations. These are
skill-based agent reviews, not human designer participation or a quality certificate.

## Deliberately retained / limits

- Live picker, selected evidence and global work list remain. Observation versus
  assignment and whole-warehouse list versus selected-device context are separate
  sources, not removable duplication. Only metadata composition changes.
- Stale/failure/unknown notices, missing telemetry, partial coverage, last-known
  qualifiers, all work and position/physical-layout limitations stay visible.
- Home layout, neutral brand roles, Shell, settings, forms, commands and navigation
  structure stay. General visual preference remains an Owner option, not a defect.
- History unknown actions retain explicit unknown meaning and raw action in the
  redacted technical disclosure; no invented business interpretation.
- Repeated alarm codes can lack a better domain-backed friendly name. Accessible
  labels therefore retain identity fallback; no new backend naming model is invented.
- Fresh production login remains Pending Verification without valid credentials;
  no reset, reveal, bypass or existing-session-as-fresh claim. Managed smoke proves
  public/auth-denial/health boundaries, not an authenticated production journey.
- Public visibility, no protected main and zero rulesets are pending Owner policy;
  this task does not change them. Nine dev-tree dependency findings and 15 Legacy
  lint warnings remain; production audit has zero findings at stage 1.
- The deployment validator's unused 3600-second fallback is documented as an inert
  discrepancy; runtime/default examples are 900, authority/expiry code is untouched.
- Repository-wide Heroicons/Headless migration is a future independent checkpoint,
  not a permanent exception or permission to delete Legacy functions/routes.

## Source and regression review

Presentation: `components/ui/workspace.tsx`, `navigation.tsx`,
`styles/globals.css`, `ExceptionAttention.tsx`, `WarehouseLiveView.tsx`,
`pages/operations/context/[taskId]/[surface].tsx`, `pages/operations/audit.tsx`,
and three bilingual investigation labels. No `src/domain`, `src/application`,
`src/infrastructure`, API handler, SSR authorization/query, session, warehouse,
mutation/confirmation, audit snapshot/cursor/redaction/retention change.

Focused tests pass 28 across exact context, repeated alarm identity, History
snapshot/unknown evidence, Live source truth and owned primitives. New regressions
preserve equal/distinct/unavailable times, unique accessible names, exact links,
Actor/time and raw redacted unknown evidence. Comparable browser review passes
48 views with Axe, actual text contrast and overflow; 44px nav/disclosure and
measured density constraints are added without deleting old safety assertions.
The test joins operator-console's serial worker to avoid shared fixture races.

Full verification, API build, keyboard/journey runtime review, exact CI/provider
SHA and safe managed smoke are required before final delivery. Record the actual
results below; no baseline or focused pass is substituted for those gates.

## Final local evidence

Complete `npm run verify` exited 0: 655 fast tests, 88 separately executed real
PostgreSQL tests, 53 production-build Chromium tests, build, manual/icon integrity,
format/secrets/production audit/lint/type checks and public-demo denial with zero
upstream calls. API build passed independently. Fifteen existing Legacy lint
warnings remain, zero errors; production dependency audit reports zero findings.
Docker was stopped when work resumed; the installed app was started, the daemon
confirmed, and real PostgreSQL checks ran without substituting mocks.

An initial comparison test used the wrong English last-known phrase and failed;
it was corrected to the actual localized label, not by removing the state check.
The added capture test is imported into operator-console's serial scenario group;
its fixed-clock mode resets in `finally` and does not race other mutable cases.

Actual 375px keyboard journey: fresh isolated fixture login → exact Live → Load →
Inventory → recorded source/destination → Exception → History → original Task →
original Work. No remembered ID, re-search or Browser Back. English/Dark switch,
Escape focus return and reload retained `ASN-E2E-001` and the Work route without
overflow. Work → receipt-filtered History correctly showed the fixture's missing
matching events; Clear filter restored five events without a reload. Keyboard
disclosure showed the unknown raw action, resource, Actor and correlation, then
closed normally. Real-time Live retained explicitly last-known position rather
than labelling it current. Supplemental runtime JPEGs are separate from fixed
clock native Before/After PNGs, never substituted as exact comparisons.

Final source/diff safety self-review confirms no backend/domain/auth/session/
scope/command/audit-read contract changes. Distinct timestamps and unavailable
Live rendering remain tested; API and full withdrawal/scope/unknown regressions
remain in the gate. No independent human security or design approval is claimed.
Final exact CI, provider identifiers, safe managed smoke and clean-tree proof are
recorded in the external gallery/manifest and Owner handoff after checkpoint;
they must be checked at the new SHA, not inferred from stage 1 success.
