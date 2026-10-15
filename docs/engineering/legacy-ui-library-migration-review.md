# Repository-wide Heroicons / Headless UI migration

Status: Engineering complete, independent checkpoint after `197148c`; S3 paused.
Owner visual acceptance is not inferred from these engineering checks.

## Scope, risk and inventory

Medium-risk presentation/interaction migration. No auth implementation, server
authorization, domain, scope, API contract, route or feature retirement. Existing
SWP-owned shadcn/Radix foundations are sufficient; no package/framework addition,
Tailwind/Router/Auth migration or new product design. The current frontend
authority already resolves the architectural choice; no new ADR is needed.

Initial local main and remote main both `197148cccb923548e745d977ee336ca2452ade20`,
clean worktree. Read-only exact CI `38601639098` completed successfully. Main's
unprotected setting is observed only, not modified.

Static and dynamic-loader searches include tracked source, scripts, tests,
configuration and package/lockfile trees. There is one npm manifest/lockfile, no
second workspace/yarn/pnpm dependency graph. `npm ls --all` found both libraries
as direct root dependencies only; no parent requires them transitively. There
are no dynamic import/require consumers of either library in source or scripts.
Historical documentation references are evidence, not executable dependencies.

| Consumer                  | Reachability and retained contract                                                                                            | Migration                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `components/nav.js`       | Shared `components/layout.js`, all three Legacy routes; current links, session lock/unlock, signIn/signOut, mobile disclosure | Named Lucide Menu/X; one native button/controlled panel state, expanded/controls semantics and Escape/return |
| `components/goModal.js`   | `/legacy` dispatch; two station/load pairs, required-field alerts, local task queue and callbacks                             | Owned Radix Dialog; all dispatch bodies unchanged, labels added                                              |
| `components/mapDetail.js` | `/legacy` map details, counts and legend                                                                                      | Owned Radix Dialog; same derived counts and content                                                          |
| `components/carInfo.js`   | `/legacy`, clickable vehicle SVG in `components/map.js`; position/working details                                             | Owned Radix Dialog; same values, no equipment command                                                        |
| `components/logIn.js`     | Nav on all Legacy routes and forced unauthenticated engineering dialog                                                        | Owned Radix Dialog; same credentials provider/fields/callback, controlled refusal retained                   |
| `pages/about.tsx`         | Existing `/about`, outside active system navigation                                                                           | Named Lucide ArrowRightLeft/BadgeCheck/ShieldCheck, same cards/routes                                        |

`/legacy`, `/legacy/fdp`, `/legacy/engineering-mode`, `/about` and existing
compatibility redirects remain. Chart.js, Axios and classnames are not removal
targets. Legacy fixed maps, example counts, decorative motion and Chinese-only
copy remain historical reference behavior, not shipped operational capability.

## Behavior baseline and deliberate implementation details

Before rebuilding the product, six browser tests passed against the unchanged
`197148c` production build: 375/1440 map/car/dispatch, cancel/initial focus/focus
trap/Escape/return, queue update and invalid input, mobile menu destinations,
unauthenticated engineering refusal, valid/invalid credentials and About cards.
Nine native screenshots were retained outside the repository before rebuilding.
Those baseline frames are behavior-ready captures, not synchronized settled
animation frames; do not use their opacity/position for a pixel-perfect aesthetic
comparison. The original `64025dc` / `197148c` visual evidence is untouched.

The baseline exposed zero-size Headless outer wrappers despite visible panel
content. Characterization therefore tests the visible heading/fields, not the
outer wrapper's bounding box. The perpetual Legacy dispatch bounce is opened by
keyboard Enter, not force-click or disabled animation. Queue text includes its
existing `貨品編號：` prefix. These are test-model corrections, not product fixes.

The existing server allowlist rejects `/legacy/engineering-mode` as a post-login
callback, resolving successful credentials to `/operations`; navigating back to
engineering then shows authenticated content. This behavior is characterized on
both builds and preserved, not silently widened during migration. Cancel still
navigates to `/legacy/fdp`. Engineering's unauthenticated owner may refuse an
Escape dismissal; the wrapper does not override it. No engineering command is
executed by verification.

The owned Dialog aliases the already installed `@radix-ui/react-dialog@1.2.0`,
matching the owned Sheet foundation. Legacy presentation is isolated in
`components/legacy/LegacyDialog.tsx`, never imported by formal operations. Radix
handles trapping, inert background and Escape. Because old
callers open via state without a Radix Trigger, auto-focus hooks retain the
actual invoking element and initial cancel ref; restoration is attempted only
while that element remains connected. No document-wide selector or manual trap.
The controlled `onOpenChange` calls the existing close callback, never forces it.
Installed Radix 1.2 registers Overlay as a dismissable surface, so a real browser
test exposed missing backdrop dismissal in the first composition. The Legacy
overlay now qualifies a primary click that both starts and ends on the backdrop;
inside-to-outside drag, right-click and pointer cancellation do not dismiss.
Dismissal still delegates to the owner's callback, including refusal on the
unauthenticated engineering page. This fixes behavior, not the test expectation.
Source review also compares TypeScript-scanned tokens (ignoring only comments
and formatting) for all 17 retained onClick/onChange/credential/count expressions
across the four dialogs against `197148c`; all match. Dialog wrapper dismissal
and login cancel-link semantics are reviewed separately above. No server/auth,
operational page, domain/application/infrastructure or API source is changed.

The new wrapper keeps Legacy styling and bottom-mobile/center-wide positioning,
with bounded scrollable content on short landscape viewports. It omits obsolete
Transition enter/leave classes rather than create an imitation transition API:
no keyboard delay, animation-end dependency or extra motion library. Login's
nested button inside Link becomes one focusable Link with the same destination
and callback; this is semantic repair, not an auth-flow change.

## Skill-informed interaction review

Pro Max's targeted generic modal UX result concerned focus indicators, not the
specific return contract. Its shadcn query explicitly matched controlled Dialog
and foundation-managed focus. Apply that verified recommendation with the
documented triggerless-caller adaptation, not a generic checklist as proof.
Emil review favors immediate repeated keyboard actions and no new decoration.

| Before                                                      | After                                          | Why                                                             |
| ----------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Disclosure open and external Transition state could diverge | One controlled native disclosure state         | Menu glyph, expanded state and panel agree                      |
| Four duplicated Headless Dialog/Transition compositions     | Shared owned Radix-backed Legacy Dialog        | One tested modal contract without a third interaction framework |
| Login Link contained a second button                        | Single focusable cancel link                   | Preserve route/callback without nested interaction targets      |
| Transitions depended on old UI library                      | Immediate open/close; bounded scrollable panel | No keyboard delay; small-landscape actions remain reachable     |
| Heroicons in shared Legacy nav and dormant About            | Named Lucide equivalents, same labels/content  | Repository-wide icon authority, not a redesign                  |

## Verification and release evidence

Removal performed only after all original 53 formal browser checks plus the six
characterization checks passed, and the corrected seventh focused interaction
check passed. An initial keyboard test incorrectly skipped the header login
button in natural tab order; it now verifies both that button and panel links.
The first integrated run therefore was not called a passing full gate.

`npm uninstall --ignore-scripts --no-audit` removes both targets and 13 unused
transitive packages (15 total), adds none and changes no retained package version.
The lockfile has no direct/nested reference to either retired library. Chart.js,
Axios, classnames and the existing Radix versions are retained. A durable test
checks manifest/lock absence, executable source absence and preserved route files.

Local manual PDF verification initially failed because `pdftotext` was absent
from the shell PATH. The complete gate is rerun with `PDFTOTEXT_BIN` pointing to
the already installed bundled Poppler binary; no manual check is bypassed.

After removal, all seven focused production-build browser checks pass again,
including both local dispatch directions, valid/invalid login/logout, modal Axe,
focus/Escape/return, draft continuity, qualified backdrop dismissal and landscape
panel bounds. Four focused unit/absence regressions pass. `npm ls --all` resolves
cleanly; target-specific npm ls reports an empty tree. API build passes. A scan
of 699 generated JS/JSON/map files in `.next/static`, `.next/server` and
`dist/runtime` finds no retired package name or Headless dialog/disclosure marker;
both package directories are absent from the standalone deployment tree.

Complete post-removal `npm run verify` exits 0: 659 fast tests, 88 separately
executed real PostgreSQL tests, 60 production-build browser tests, both production
build and public-demo denial harness (zero upstream calls). Format, strict types,
secret scan, icon/manual integrity/full PDF text, lint and production dependency
audit pass. Existing 15 Legacy lint warnings remain; zero errors. Separate API
build exits 0. Production audit has zero findings; the complete development tree
retains nine existing toolchain findings (seven high, two moderate), not silently
fixed with framework/tooling upgrades in this checkpoint.

Final source/security review finds no auth/API/core/warehouse/command changes,
new packages or route retirement. Operator/formal seven-surface and exact-context
journeys remain in the unchanged full gate; actual migrated Legacy images were
inspected at desktop/mobile. CUA additionally verified map counts, initial cancel
focus and Escape return in the local production build. Pro Max/Emil findings and
their bounded adaptations are above, not aesthetic acceptance or certification.

Exact checkpoint CI/provider SHA and safe managed smoke are release gates checked
after push; identifiers and native screenshot manifest are provided in the
external delivery bundle and handoff, avoiding a circular self-SHA docs commit.
No credentials, session state, trace or real customer data are exported. The
baseline PNGs' animation-readiness limit remains explicit.

## Explicit limitations / retained risks

- Formal production Fresh Login remains unverified without valid credentials;
  local isolated fixture login is not production proof. No reset or bypass.
- Legacy still has preexisting fixed/example data, 32px fields and a non-keyboard
  vehicle SVG opener. This migration does not recast Legacy as a formal WCAG-AA
  operational product or retire it. Focusable controls inside migrated dialogs
  and their keyboard contracts are tested separately.
- Final aesthetics and S3 resumption remain Owner-only decisions. Repository
  visibility, branch protection, rulesets and permissions are unchanged.
- Security review is scoped source/self-review plus regression gates, not an
  independent human security audit, real-device certification or OT approval.

Primary references: [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
and [shadcn v3 Dialog](https://v3.shadcn.com/docs/components/dialog). These support
the modal/controlled/focus APIs, not a claim that custom callers need no testing.
