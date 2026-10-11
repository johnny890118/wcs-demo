# Product design system quality consolidation

Status: active; Owner has not accepted current visual quality; S3 paused.
Navigation recovery checkpoint: `6ff6bf8` (full verification, 45 browser tests).
This checkpoint is engineering recovery, not final product design approval.

Risk: medium/high breadth of presentation and interaction changes. Persisted
plan, source provenance, full security regressions and two independent quality
paths required. Auth/domain/API/warehouse/unknown/audit contracts cannot change.
No new feature, Site domain or production business mutation is authorized.

## Sequence and recovery boundaries

1. Preserve completed adaptive navigation; close rotation/focus tests (done).
2. Research official award records and real professional-product design; inspect
   actual baseline, not missing Owner screenshots. Record actionable root causes.
3. Consolidate shadcn-compatible owned primitives and Lucide; retain Tailwind 3
   and supported Radix foundation. Avoid automatic CLI overwriting local files.
4. Establish semantic selection, actions, type/spacing and page patterns; migrate
   all formal routes, not only seven demonstration pages.
5. Run actual production build and first visual review; correct observed defects;
   cross-page re-review across geometry/theme/locale/state and full journeys.
6. Complete engineering gates, checkpoints, push, exact-HEAD CI/providers/read
   smoke and labelled Before/After gallery. Owner alone grants visual acceptance.

## Initial concrete findings

- `.ui-current-selection::before` is shared by global navigation, Work tabs,
  Inventory/Live tabs, preferences, filters and equipment. The Work-only override
  hides the abstraction conflict instead of defining distinct selection roles.
- `button.tsx` is a shallow Slot wrapper, fields duplicate native styling and
  `workspace.tsx` does not constrain placement of heading/navigation/actions.
- Live/Inventory navigation precedes headings; Inbound/Outbound follows headings.
  Link-like secondary actions proliferate across cards and command outcomes.
- Tokens cover color but do not establish shared type, spacing/density, radius,
  page composition or action/selection responsibility.
- Existing Axe/contrast/overflow checks are useful, not composition or aesthetics
  acceptance. Capturing screenshots without explicit cross-page findings missed
  mismatched selection geometry and the repeated-looking control hierarchy.

## Skill use

Pro Max supplies responsive/contrast/composition candidate guidance; Emil reviews
keyboard, disclosure, repetition, alignment and low-noise interaction details.
Neither supplies an automatic approval or human independent review. Do not install
another global skill, alter global skills or claim a human designer participated.
Review actual images and record defects, corrections and remaining limitations.
Reject glassmorphism, excessive motion, simulated maps or false physical evidence.

## Research evidence and transfer decisions

- [Linear's 2026 interface refresh](https://linear.app/now/behind-the-latest-design-refresh):
  task content earns prominence; navigation recedes; predictable composition and
  restrained separators. Transfer those operational principles, not its palette.
- [Webby productivity winners](https://winners.webbyawards.com/winners/apps-software-immersive/software-services-platforms/work-productivity-collaboration):
  Asana is listed as 2025 Webby winner; nominations are not called wins. Actual
  professional app review remains necessary; an award is not warehouse suitability.
- [Awwwards OWOW record](https://www.awwwards.com/owow/): Twinbru is listed as
  September 14, 2023 SOTD. Direct case-page fetch timed out, so do not pretend its
  current product UI was observed or infer software usability from that record.
- [FWA curator record](https://thefwa.com/FWA25/RobFWA.html): work-specific craft
  recognition and interaction quality, not a license to copy game/portfolio motion.
- [shadcn official default update](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default):
  Base UI defaults for new projects; Radix fully supported, no forced migration.
  Keep existing tested primitives on one Radix-backed shadcn-compatible pathway.
- [shadcn Radix Button](https://ui.shadcn.com/docs/components/radix/button) and
  [Tailwind 3 docs](https://v3.shadcn.com/docs/components/button): use owned source,
  variants and Slot composition, not a whole-template rewrite.
- [Lucide React](https://lucide.dev/guide/react): named imports, no dynamic catalogue.

## Foundation implementation / first image review (2026-10-09)

The first owned primitive checkpoint uses the inspected Tailwind 3 shadcn
Button pattern (CVA, Slot, forwarded ref and class merging), native required
fields, URL-backed contextual navigation, Lucide active-product icons and
shared heading placement. Global navigation, page context, preferences,
filters and selected records no longer share one brand-marker abstraction.
These are foundations, not completion of the whole-product visual redesign.

Actual local production-build review used isolated, authenticated deterministic
fixtures, not production measurements or invented equipment evidence. Desktop
Inbound and Work were reviewed at 1440 × 900; Inventory at 375 × 812 in light
and dark. Image files are in the external `single-site-navigation/design-system`
evidence directory. No capture of a desktop viewport is labelled mobile.

- Inbound: form grouping now separates the editable work from the confirmation
  column; required inputs and disabled execution before persistence are retained.
  Field edge weight and the inactive confirmation column still need refinement.
- Work: the primary record is separated from prose and its destination uses an
  actual secondary-action link. Helper links and filters still compete visually.
- Mobile Inventory: compact single navigation, readable quantities and intact
  evidence links are visible. Dense quantity labels and repeated record details
  still need composition review; the foundation is not visual acceptance.
- Live: equipment selection remains too wide and status/impact/action hierarchy
  remains flat. The next presentation pass must retain observation/assignment
  distinctions, stale/unknown notices and exact destinations.
- The Linear reference article's interface images did not visibly load during
  the browser visit. Its text is source evidence, not a completed visual app
  walkthrough. Award records likewise are not proof of reviewed product UI.

Fresh production login remains unproved; local fixture authentication cannot
substitute for it. No production credential reset, reveal or bypass was used.

Foundation engineering verification: complete `npm run verify` passed with the
bundled `PDFTOTEXT_BIN`: 624 fast tests, 88 real PostgreSQL tests, 45 Chromium
tests, production build and public-demo denial boundary. `npm run build:api`
passed independently. Secret scan and production dependency audit passed (zero
production findings); lint retains 15 existing legacy-map warnings and no errors.
The first run failed because Poppler was not on PATH, then a new test's plain
internal anchor failed lint; the test now uses real Next Link, and the entire
gate was repeated without disabling a check. This is local foundation evidence,
not exact-HEAD CI, provider deployment proof or whole-product visual acceptance.

## Live composition correction

After the foundation image review, the equipment picker uses a bounded 240px
column alongside the selected equipment evidence at wide viewports (1100px and
above). Narrow layouts stack the same real links and evidence; this is separate
from the global navigation breakpoint. The selected evidence has a coherent
reading surface rather than an unbounded text area. No API, selection URL,
freshness deadline, safety notice, observed/assigned distinction or command was
changed. Actual Desktop light and 820 × 1180 Tablet light/dark captures retained
the expired-observation warning rather than refreshing it into a false success.
Read-only DOM geometry confirmed no page-level horizontal overflow at both sizes.

The complete local verification was repeated after this correction: 624 fast,
88 PostgreSQL, 45 browser tests, production build and demo-denial boundary passed.
The entire product's final Before/After review remains open, including action
hierarchy on records, Help/diagnostics composition, Login/Entry and overlay
consolidation. No whole-product visual acceptance is claimed by this checkpoint.

## Entry / Help / diagnostic composition correction

Entry now uses the owned brand action rather than an independently styled CTA.
Login uses restrained shared entry typography and a bounded content width; Help
and Projections use the same heading pattern as the operational workspaces.
The downloadable manual remains a real authenticated resource link, not a
client-side invented action. Upstream shadcn source notice is preserved only for
adapted portions; it does not license or expose this private SWP repository.

Actual 820 × 1180 login review found a 268.17px gap between the explanation and
form despite passing existing overflow/Axe gates. The cause was stretched grid
tracks in a minimum-height portrait layout. Grouping the tracks with
`content-center` reduced the measured gap to 32px. A new 820px/375px browser
regression constrains the real explanation-to-form gap, preserving credential
field assertions. Mobile and Tablet dark screenshots were captured before
typing fixture credentials. Normal local logout → entry → login → authenticated
Home succeeded using only the explicit deterministic fixture identity; this is
not fresh production login proof.

Full verification after the real layout correction passed 624 fast tests, 88
PostgreSQL tests and 46 browser tests, plus build and public-demo denial. Earlier
45-test passes predated the new geometry regression and are not substituted for
this final local run. Whole-product visual review and final gallery remain open.

## Cross-page action / filter correction

The runtime image review found Tasks still rendering blue, underlined filters
without the neutral current-state treatment already used by Work. Both now use
one URL-backed `FilterNavigationLink`; they remain real links with `aria-current`,
not invented client-side tabs. Task record opening, refresh and pagination use
the owned action primitive without changing destinations or request behavior.

Outbound's secondary inventory link and brand submit action previously touched.
A shared wrapping action group separates them while preserving DOM order,
new-tab disclosure, required fields, allocation authorization and confirmation.
Actual 1440px dark and 375px dark browser review confirmed readable separation;
the mobile actions wrap rather than clipping or shrinking touch targets.

Focused primitive/navigation tests passed (7 tests), then the complete verification
passed: 625 fast tests, 88 PostgreSQL tests, 46 browser tests, production build,
secret/dependency checks and public-demo denial. No API/auth/domain changes were
included. Whole-product review remains open: nested record surfaces and contextual
action hierarchy need review, and the final gallery is not yet delivered.

An isolated managed worktree at the starting `f9a8668` supplies reproducible Before
captures through normal fixture login; it shares only the non-production fixture
API. This avoids mislabelling older audit images or intermediate WIP as baseline.

## Work / Task detail composition correction

Work and Task detail now share the evidence-section type scale, owned secondary
actions and title-aligned return links. Work execution rows use separators rather
than cards nested inside another card; technical identifiers remain progressively
disclosed. Runtime review of the first correction still found low-density request
content filling the entire Desktop row and pushing execution below the fold.
The second pass places request and execution evidence side by side at 1100px,
stacking in the original reading order below that width. Real 1440px/375px dark
captures and read-only geometry checks confirmed the layout and no page overflow.
Normal Work → Task → same Work keyboard navigation retained exact resource paths.

Both corrections ran the complete gate; the final run passed 625 fast, 88
PostgreSQL and 46 browser tests, build and demo-denial boundary. Latest focused
Work/resume/exact-context verification passed 24 tests (the earlier 29-test pass
also included primitives). Review found no changed SSR authorization, warehouse
scope, execution eligibility, required fields, mutation requests or audit gate.
This is implementation/self-review evidence, not a claim of a human designer or
independent security reviewer having approved it.

During baseline History walkthrough, clearing an empty resource filter changed
the URL but retained the previous client list; reload displayed the unfiltered
fixture events. This pre-existing state-continuity defect was handled as the
separate correction below, not silently labelled a visual improvement.

## History server-snapshot continuity correction (2026-10-11)

History pagination now belongs to the authorized warehouse, canonical filters
and redacted server snapshot. A changed context retires the previous reader;
an identical snapshot preserves its pagination. The surrounding Shell stays
mounted, so preference controls are not reset by a filter transition. A late
response from a retired reader cannot append events to the new reader.
Warehouse identity is sourced from the existing authorized SSR access, never
from a browser-selected query. SSR `audit.view`, API authorization, warehouse
scope, redaction and unknown-action policy are unchanged.

| Before                                                             | After                                                            | Why                                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Clear filter changes URL but leaves the old empty list             | URL and server-resolved evidence replace the old reader together | No reload, re-search or Browser Back to complete the handoff     |
| Pagination state outlives its filter/warehouse                     | Pagination is scoped to the authorized server snapshot           | Prevent stale evidence and late responses crossing read contexts |
| Language/theme change could be confused with a read-context change | Locale/theme stay outside the snapshot key                       | Preserve the current evidence while changing presentation        |

Focused reader/accessibility verification passed 18 tests. Four new reader tests
cover clear-filter, warehouse/failure, refreshed evidence and late pagination.
A production-build browser walkthrough used a normal isolated fixture login:
empty resource evidence → Clear filter → five readable events, without reload.
Desktop Light/zh and 375px Mobile Dark/en were inspected; switching language and
theme retained the URL and five events, with no horizontal overflow. Actual
images are stored in the external comparison evidence directory as
`history-context-correction-desktop-light-zh.jpg` and
`history-context-correction-mobile-dark-en.jpg`. These are fixture runtime
images, not authenticated production measurements or Owner visual acceptance.

The initial complete gate stopped because Docker was not running; the existing
Docker runtime was started and the complete gate rerun. No PostgreSQL gate was
disabled or replaced with mocks. Delivery results are recorded after that run.

The complete rerun passed: 629 fast tests, 88 real PostgreSQL tests, 47 browser
tests, production build and demo-denial boundary. The API build passed separately;
secret scan, formatting and production dependency audit passed. Existing 15 legacy
lint warnings remain, with zero errors. Diff/security self-review found no changed
session revalidation, permission checks, warehouse selection or mutation behavior.
This is not an independent security approval or final whole-product visual acceptance.

## Owned navigation overlay consolidation (2026-10-11)

History checkpoint `976a4e23275580ae7724c69057ea33d11832ddce` was pushed normally;
exact-HEAD CI [38147016360](https://github.com/johnny890118/wcs-demo/actions/runs/38147016360)
passed. Vercel Ready and Render Live/last-successful commit both matched the full
SHA. Managed deployed smoke passed for the actual frontend/API hosts; the working
tree was clean before starting this separate overlay slice. This is deployed
read/boundary smoke, not production fresh-login proof.

The current Owner decision favors safe consolidation to compatible shadcn owned
components. Only the formal mobile navigation's Headless dialog is replaced by
inspected owned Sheet composition; legacy Headless dependencies stay. This
supersedes the earlier provisional retention decision, not the delivered layout.
The benefit is one owned formal overlay pathway and directly tested interaction
contracts, not a claim that replacing a package improves visual quality by itself.
Settings remain lightweight Popover; no new permanent bar or duplicate navigation.

| Before                                                | After                                                  | Why                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Formal drawer uses a separate overlay implementation  | Owned Sheet on the same supported shadcn/Radix pathway | Centralize formal overlay styling and focus contracts without replacing Legacy |
| Generic dialog container receives initial focus       | The one localized close control receives focus         | Keyboard users have an immediate, visible dismissal target                     |
| Raw fixed panel padding                               | Semantic panel inset plus safe-area bounds             | Keep usable controls on small/touch layouts without decorative chrome          |
| Rotation selector can choose Home before current Work | Explicitly prefer current destination, then fall back  | Keep focus at the visible work context                                         |

Actual pre-change 820px portrait Dark/en review confirmed the baseline Escape
return and unsent Inbound draft retention. Those are required regression gates,
not sacrificed for standardization. The primitive does not inject another close
button or animation, and the Shell's existing rotation handler remains authoritative.
No auth, session, warehouse, API, command or Work-context behavior is changed.

Production-build Tablet Dark/en and Mobile Light/zh review confirmed one close
and one sign-out, 20px semantic padding, visible initial close focus, keyboard
wrapping, Escape return and preserved Inbound draft. Rotation exposed a
pre-existing selector-order defect: a combined CSS selector returns DOM order,
not selector priority. The handler now queries the current destination first;
the new browser regression requires Work focus after rotation.
The first new browser test incorrectly searched for English `SKU` in the Chinese
fixture and timed out. It now uses the real localized field, retaining the draft,
focus and Axe assertions. Earlier gates also caught a raw test anchor and an
unsupported Testing Library option; both were corrected, not suppressed.

Final complete verification passed after the rotation correction: 630 fast tests,
88 real PostgreSQL tests, 48 browser tests, production build and public-demo
denial. API build and secret scan passed separately; production dependency audit
has zero findings. The existing nine dev-only dependency findings and 15 Legacy
lint warnings are unchanged. Earlier failed runs are not presented as passes.
Focused Sheet/Shell/accessibility tests passed 17 tests; the full rerun also
includes them. Browser gates retain single/multi/long-name scope fixtures, all
five geometries, both locales/themes/system, draft preservation, Axe/contrast,
Work-context journeys, commands and authorization regressions.

Actual final-source images: `sheet-correction-tablet-dark-en.jpg` (820×1180) and
`sheet-correction-mobile-light-zh.jpg` (375×812), compared with
`before-976a4e2-navigation-tablet-dark-en.jpg`. These are native viewport captures
of the actual fixture production build. Real keyboard/rotation walkthrough
confirmed current Work focus and unsent draft retention. UI/security self-review
found no API/auth/domain changes; it is not an independent security approval.

The menu → Live walkthrough still found long underlined investigation links
competing with equipment evidence. Their hierarchy belongs in the next coherent
workspace presentation correction; it is not mixed into this overlay commit.
Whole-product visual quality and final acceptance remain open.

## Live evidence/action hierarchy correction (2026-10-11)

Overlay checkpoint `f8d4163d3750ee543064590acf3a706c1aedf94b` was pushed normally;
exact-HEAD CI [38148511800](https://github.com/johnny890118/wcs-demo/actions/runs/38148511800)
passed. Vercel Ready and Render Live/last-successful commit matched the full SHA;
managed deployed smoke passed and the working tree was clean before this slice.

Actual Tablet Dark/en walkthrough found long underlined route/status strings
competing with equipment state, and nested bordered active-work cards repeating
the same evidence at another level. `live-action-review-tablet-dark-en.jpg`
records the real fixture production build, not a generated mockup. The selected
equipment's stale/last-known qualification and the assignment/observation
distinction remain mandatory, directly visible evidence.

| Before                                             | After                                                             | Why                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Route and task status in a long underlined string  | Neutral exact-destination record with separate route/status lines | Scan meaning before choosing an investigation               |
| Alarm-workspace link competes with equipment state | Owned secondary action with the same destination                  | Distinguish a next navigation action from inline evidence   |
| Active-work card inside another card               | Shared shallow evidence rows inside the existing record surface   | Avoid unnecessary container hierarchy without deleting work |

Pro Max targeted action-hierarchy searches did not return a verified action-role
match (heading/type and loading guidance only). The decision therefore uses its
built-in consistency/touch/accessibility principles, existing SWP role rules and
actual images, not a falsely attributed database recommendation. Emil review
favors quiet, consistent pressable records, visible keyboard focus and no added
animation for frequent investigations. No new design direction or dependency.

Scope is presentation only: task/alarm destinations, scoped projection data,
status vocabulary, selected equipment, qualified position, freshness, missing
telemetry, unknown evidence and source boundaries are unchanged. The global work
list is retained, not incorrectly filtered to only the selected equipment.
Focused tests retain missing/disappeared equipment and noncurrent-empty behavior,
and add assigned-versus-observed, unknown/stale and exact encoded link contracts.
Production-build image review covered Desktop 1440×900 Light/zh and Dark/en,
Tablet 820×1180 Light/zh and Dark/en, and Mobile 375×812 in both. Work references
measured 69px high with no horizontal overflow, including the narrow action
section. The actual Live → Task → Work → contextual Live → original Task journey
needed no remembered ID, search or Browser Back. Source/freshness and missing
observed-task qualification stayed visible. This is viewport/fixture evidence,
not physical industrial-device testing or authenticated production measurement.

Images use the `live-hierarchy-correction-` prefix in the external design-system
evidence directory. Final Emil review confirmed quieter investigation references,
consistent secondary action, preserved diagnostic disclosure and visible focus;
no claim of human independent design approval is made. UI/security diff review
found no API/auth/domain/session/warehouse/mutation changes.

The full gate passed once, then was repeated after adding actual raised-surface
hover text contrast pairs. Final verification includes 635 fast tests, 88 real
PostgreSQL tests, 48 browser tests, build and public-demo denial. Separate API
build passed. Focused Live/accessibility passed 18 tests; contrast passed 38.
Production dependency audit and secret checks pass; the 15 existing Legacy lint
warnings remain with no errors. This is not whole-product visual acceptance.

The continuing actual Mobile Inventory review found its Work/history action
references still use the earlier underlined control style. That cross-record
consistency issue remains for an independent presentation pass after this
checkpoint, not silently declared resolved by the Live change.

## Inventory adaptive record correction (2026-10-11)

Live checkpoint `1471fc49538779e5e95c558a825504c39d55d411` passed
exact-HEAD CI [38149638989](https://github.com/johnny890118/wcs-demo/actions/runs/38149638989).
Vercel Ready and Render Live/last-successful commit matched the full SHA;
managed deployed smoke passed and the working tree was clean before this slice.

Actual Desktop Light/zh and Dark/zh images found inventory labels separated from
their values across a wide card. Mobile's paired rows were already compact.
Work/history actions and even the owned paging button still carried legacy
underlined control styles. This slice is limited to that inventory composition;
cross-record action consistency elsewhere remains an independent follow-up.

| Before                                                         | After                                                               | Why                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Wide label/value rows on Desktop                               | Adjacent label/value groups in a responsive two/four-column grid    | Reduce eye travel without removing evidence                      |
| Same underlined treatment for Work, history, clear and refresh | Owned secondary Work action and quiet ghost utility/history actions | Clarify action responsibility without another control vocabulary |
| Paging Button overridden by old link class                     | Unmodified owned secondary Button                                   | Preserve disabled/loading and touch/focus semantics              |

Emil review favors proximity, deliberate hierarchy and no decorative motion.
Pro Max outcome search and one narrower retry returned compact-label, input-label,
truncation and unrelated guidance, not a verified label/value proximity match.
The layout decision uses its built-in responsive/touch/consistency principles,
SWP action rules and actual images rather than attributing a database result.
No new dependency, palette, navigation or product capability. Full quantity
qualification, discrepancy warning, audit permission and encoded Work/history
destinations remain unchanged. New focused tests cover those contracts, exact
filtered return/refresh and unavailable-versus-empty evidence.

The full gate passed: 639 fast tests, 88 real PostgreSQL tests, 48 browser tests,
production build and public-demo denial. Separate API build passed; secret and
production dependency checks passed. Existing 15 Legacy lint warnings remain,
with no errors. Focused inventory/contrast verification passed 42 tests.

Actual production-build image review covered Desktop 1440×900 Light/zh and
Dark/en, portrait Tablet 820×1180 in both, landscape Tablet 1180×820 Light/zh,
and Mobile 375×812 Light/zh and Dark/en including the action area. Visible
inventory actions measured 44px high with no horizontal overflow. Language/theme
changes retained the inventory route; keyboard Escape returned to the menu
trigger. Inventory → exact Work → contextual history used no remembered ID,
search or Browser Back. The fixture has no matching receipt audit events;
the qualified empty state was shown, not fabricated history. The existing
cross-page browser matrix checks Axe, rendered text contrast, three theme modes,
both locales and authorized warehouse switching. These are browser/fixture
measurements, not physical-device or authenticated production evidence.

Images use `inventory-refinement-` in the external evidence directory.
Final skill-based review confirmed adjacent facts, quieter action priority and
preserved touch/focus/disclosure. Source/diff security self-review found no API,
authorization, session, warehouse, query, mutation or quantity changes; no claim
of human or independent reviewer approval. This is not whole-product visual
acceptance. Exact-HEAD CI and provider closure follow the checkpoint push.

## Additional visual-reference evidence

The official [Asana project views page](https://asana.com/zh-tw/features/project-management/project-views)
was inspected in a real browser, including its displayed board and list product
images. The transferable principle is compact row rhythm and understated view
selection, not copying its business stages, illustrations, marketing layout or
assuming an authenticated Asana workflow was tested. The official Twinbru site
was also visually inspected after rejecting optional tracking: restrained brand
palette and clear type hierarchy are relevant, while its animated fabric scene,
intro loader and large marketing hero are deliberately not appropriate to SWP.
Award provenance remains separate from these live-site observations; an award
record does not prove industrial operability or SWP design acceptance.

The intermediate external comparison gallery pairs starting `f9a8668` with
`93edfe9` for Desktop Inbound, portrait Tablet Live and Mobile Inventory in both
themes. Browser screenshot output excludes scrollbar space and may scale the
raster; the gallery records both CSS viewport and actual pixel dimensions rather
than asserting a pixel-exact native comparison. These are real fixture runtime
images, not generated proposals or production equipment evidence.

## Required evidence before final handoff

Engineering: full verify, separate API build, secret/dependency scan, unchanged
security assertions, exact CI/provider SHA and safe deployed read smoke.
Design: formal-route baseline and after review, all five viewport geometries,
both themes/system/both languages, high/low density/long labels, empty/error/
stale/unknown, overlays/focus, real end-to-end work. Maintain deterministic visual
regression for displacement/selection/clipping; never equate pixels with beauty.
Fresh production login remains independently unverified without actual valid
credentials; no reset/reveal/bypass or existing-session-as-fresh assertion.
