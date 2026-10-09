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
fixture events. This pre-existing state-continuity defect is queued as a separate
correction with a regression test, not silently labelled a visual improvement.

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
