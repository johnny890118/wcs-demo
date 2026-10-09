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

## Required evidence before final handoff

Engineering: full verify, separate API build, secret/dependency scan, unchanged
security assertions, exact CI/provider SHA and safe deployed read smoke.
Design: formal-route baseline and after review, all five viewport geometries,
both themes/system/both languages, high/low density/long labels, empty/error/
stale/unknown, overlays/focus, real end-to-end work. Maintain deterministic visual
regression for displacement/selection/clipping; never equate pixels with beauty.
Fresh production login remains independently unverified without actual valid
credentials; no reset/reveal/bypass or existing-session-as-fresh assertion.
