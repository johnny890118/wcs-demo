# Operator navigation acceptance correction

Historical delivery record. The latest Owner single-site-first decision supersedes
this record's fixed tablet rail and always-visible context strip, not its retained
single logout, lightweight settings, keyboard or safety contracts. Current work:
`single-warehouse-navigation-plan.md`. Do not restore old geometry from this record.

Status: Navigation correction deployed at `8513730`; Owner-requested single
logout entry is verified as the final acceptance refinement. S3 remains paused for Owner
final visual acceptance. Exact final-HEAD gates are repeated at handoff.

Baseline: clean `4ad6861`. Owner explicitly supersedes the delivered duplicate
desktop sidebar/topbar. This is a presentation/interaction correction, not new IA,
domain capability, authentication or warehouse policy. Risk is medium: shared
shell, focus, initial geometry and safety-context visibility. Persistent plan and
review evidence are kept here; no new load-bearing architecture ADR is needed.

## Design and scope

UI/UX Pro Max's responsive/navigation/keyboard guidance applies to the existing
Next.js/Tailwind stack. Emil's frequency-sensitive restraint takes precedence
over generic animation suggestions: repeated navigation/collapse is immediate,
without width animation. No new dependencies or design exploration.

| Before                                              | After                                                                        | Why                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Desktop topbar repeats primary destinations         | Single sidebar; bottom preferences/account only                              | Stable quiet navigation without wasted header                   |
| Warehouse and runtime labels boxed in global chrome | Compact page context with readable warehouse, environment and source/profile | Preserve safety interpretation without a transplanted badge row |
| Persisted collapse restores after hydration         | Presentation-only pre-paint bootstrap                                        | Preserve content geometry across reload                         |
| Tablet header plus icon rail                        | Rail and on-demand full-label menu                                           | Recover vertical room for Live evidence/action                  |
| Desktop settings require full navigation drawer     | Settings available even while collapsed                                      | Preserve work context and direct preference access              |
| Sidebar and account panel both offer logout         | One logout inside preferences/account only                                   | Owner feedback: avoid repeated account actions                  |

768 px rail leaves 692 px content for two-column Live evidence; below this,
compact mobile header/menu replaces the rail. 1024 px allows the full 220 px
sidebar while preserving working content; verify both threshold edges, portrait
and landscape, rather than treating framework defaults as proof.

## Gates

- Seven surfaces, zh-TW/en, Light/Dark/System, 375 px and responsive thresholds.
- Sidebar reload/pre-hydration geometry, menu Tab/Escape/focus return, preferences.
- Visible warehouse/environment/profile/source and original switch authorization.
- Original Work exact links, inbound required fields and confirmation unchanged.
- Focused tests, full verify/API build, actual browser and native screenshots.
- Security diff and Pro Max/Emil final review, checkpoint/push, exact CI/providers,
  deployed authenticated read journey and clean tree. Stop for Owner, not S3.

## Evidence

- Full `npm run verify` passed: 616 fast tests, 88 real PostgreSQL tests, 44
  Chromium tests, production build and production-build demo denial harness.
  API compiled build passed separately. Secret scan and production dependency
  audit passed (zero vulnerabilities); 15 pre-existing legacy lint warnings remain.
- Seven surfaces at 1440/768/390 px, both locales and Light/Dark/System: 126
  page cases with Axe, rendered text contrast and horizontal-overflow checks.
  Additional keyboard/menu/context checks cover 375, 767, 768, 1023, 1024 and
  844 x 390 landscape. System follows emulated OS light/dark with one selection.
- Collapse is checked before React loads by blocking framework JS on a fresh
  page, then checked across normal reload; the rail remains 76 px. Expanded
  desktop is 220 px. Desktop header is absent and settings expose no primary nav.
- Real browser inspection confirmed preferences available while collapsed and
  language changes retain an unsubmitted inbound draft and the current route.
  Existing warehouse-switch, exact handoff/reload, inbound/outbound execution,
  exception recovery and contextual History journeys passed without changing
  their command, confirmation or evidence contracts.
- Native-size six screenshots live in the separate Owner preview workspace:
  `navigation-correction/approved-{1440,768,390}-{light,dark}.png`; additional
  Home/Work/Outbound/Exceptions screenshots retain real isolated fixture states.
  They are production-build browser captures, not mockups or production data.
- First full run exposed two stale selectors (brand and nav both link Home;
  page context precedes manual chapters). They were made semantically specific;
  the original navigation/first-chapter assertions remain. Second full run green.

## Final design and safety review

UI/UX Pro Max skill-based review: one persistent primary navigation, quiet neutral
selection, fixed brand, practical touch targets and explicit page safety context
fit the approved industrial workspace. Tablet rail recovers vertical room for
observed equipment, impact and safe next action. Mobile uses one compact header
and a full-height scrollable menu. No new containers or decorative movement.

Emil skill-based final review: the Before/After/Why table above records the actual
changes. Immediate geometry and pre-paint restoration avoid frequent layout
animation; native accessible names/title hints survive collapsed labels. Existing
Headless UI preserves dialog focus containment, Escape and trigger focus return.
Preferences preserve the route and draft. The approved neutral palette and work
content proportion are unchanged; the redundant topbar is the deliberate deviation.
These are skill-guided reviews, not claims of personal designer participation.

Security diff review: changes are confined to presentation, copy, tests and a
static document bootstrap. Storage contains only a collapse boolean, not identity
or warehouse authority. No user input is interpolated into inline script; existing
CSP already permits inline presentation scripts and is not weakened. Auth/session,
API scope/permission, warehouse switching and command controls remain unchanged.
Safety context stays outside the settings dialog and visible in every layout.

Limits: Axe and viewport tests are not WCAG certification, real industrial-device,
gloved-touch or long-duration usability evidence. Native select text may truncate
long warehouse names at narrow widths; the full selected name remains accessible
through the unchanged control. History raw action names remain a known limitation,
not expanded into this correction. No fake map/observation or workflow outcome.
Deployment identities and authenticated deployed smoke are recorded after push.

## Deployed correction evidence

Implementation `851373050025283bc8661b4feb3d6da9fd9f8053` matches remote main.
Exact Actions `37879196988` completed successfully (verify and deployment-smoke).
Vercel `Aee97XkG4vKyMrGPQhitRvCwqZvH` is Production Ready with this full Source
SHA. Render `dep-db45t7qvcj2c73csihp0` is Live and its last successfully deployed
commit is the same SHA. Managed demo public/auth-denial/API-health smoke passed.

Authenticated deployed inspection confirmed desktop settings without primary
navigation, sidebar preferences, real environment/profile/source labels, tablet
rail/menu and 375 px mobile menu. Escape from a focused mobile theme control
returned focus to the menu trigger. Inventory's visible Work link resolved the
same persisted completed receipt, its actual related task and history links;
this read journey creates no new work or equipment commands. Native Chrome
captures at DPR 2 preserve actual production data and are kept separately from
isolated test screenshots. The final single-logout refinement is checked again
after its own exact-HEAD deployment; identities are in the Owner delivery report.
The single-logout refinement reran the entire local gate (616 fast, 88 PostgreSQL,
44 browser, denial harness and API build). Unit/browser checks assert no sidebar
logout and exactly one account-panel logout; its existing `callbackUrl: "/"`
is unchanged. Design/safety diff review found no contract change.

Newly observed non-navigation runtime findings: existing `styles/font.css` imports
an external legacy font blocked by the unchanged CSP; some zh-TW read pages also
emit React #418 text hydration errors while recovering client-side. Existing
date presentation includes runtime-dependent Intl/time-zone formatting; the
precise hydration source is not established by this walkthrough. Do not claim a
zero-error console or a proven pre-existing cause. No failure of the tested
navigation/account actions was observed, but these are retained product-quality
findings, not silently suppressed or fixed by broadening this acceptance scope.
