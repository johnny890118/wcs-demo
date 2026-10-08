# Theme refinement — 2026-10-08

Status: Active independent Owner-approved checkpoint after D `dbfb995`.

## Scope and design

Moderate-risk cross-surface presentation/accessibility change: status and command
affordances must remain distinguishable. This persistent record is the plan and
review; no architectural ADR is necessary because data, authorization, IA and
workflow contracts do not change. No new dependency or animation.

Audit: `accent-strong` mixes section labels, links, selection and SVG graphics;
light `#555900` reads like ordinary dark text while dark makes every such item
brand yellow. `accent-soft` combines navigation selection and contextual badges.
Existing focus uses a translucent blue outline, and control borders are not
consistently 3:1 against adjacent surfaces.

Keep `accent` at `#E6F000` and `on-accent` for primary buttons/logo. Introduce
separate link, selection-background/text/edge, info, offline and focus roles.
Current selection uses solid brand with neutral readable text and a contrast
edge; selection remains encoded by aria-current/aria-pressed, not just color.
Light focus combines a neutral outer outline and brand inner ring; dark keeps
brand focus against neutral backgrounds. Links use readable blue plus underline;
section labels/context badges use neutral text. Available routes use success,
node kind is not a warning state. Preserve semantic text/icons/dashes and all
command confirmation, permission, expiry and warehouse contracts.

## Emil design review

| Before                                             | After                                                                            | Why                                                   |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Olive text tries to carry brand across all content | Neutral headings, independently readable link color; brand action/selection fill | Separate reading hierarchy from product identity      |
| Subtle yellow-tinted selection                     | Solid brand selection with contrast edge and semantic current state              | Quickly locate the current workspace in both themes   |
| Translucent focus outline                          | Opaque contrast-safe outline plus brand ring                                     | Keyboard focus must be visible, not merely decorative |
| Shipping node color reuses warning                 | Informational node graphics; warning reserved for abnormal evidence              | Warehouse kind is not an alarm                        |

## Gates

- [x] Token/consumer implementation and focused actual-pair contrast tests.
- [x] Light/dark × zh-TW/en × 1440/768/390, Axe, keyboard/focus and status review.
- [x] End-to-end operator journeys and final Emil visual review.
- [x] Full verify, API build, independent review and durable evidence.
- [ ] Checkpoint/push/exact CI/both deployments/runtime/clean, then existing S3.

Viewport evidence is not a physical industrial-tablet study or safety
certification. Production read smoke does not imply production command proof.

## Review evidence and limits

Focused token/consumer tests: 37 passed, including actual tinted status panels.
Rendered contrast helper fixtures plus
the 12-combination theme/locale/viewport matrix passed. Keyboard uses actual
Tab/Shift+Tab modality, not programmatic mouse focus. Manual screenshot sampling
covers both themes/locales and all three widths: brand selection is distinct
from blue underlined links, neutral reading hierarchy and status meaning.
Existing inbound/outbound/context-return journey tests passed in focused review;
full-suite delivery evidence remains required below.

Independent read-only review found no outstanding blocker or auth/scope/command
logic change. Its normalized-sRGB parsing finding was fixed and regression tested.
The HTML helper composites solid ancestor backgrounds and rejects unsupported
partial opacity/gradients. It does not certify input values, pseudo-elements,
overlapping painted siblings, SVG scenes or focus rings: dedicated token/non-text
tests, Axe, keyboard and visual review complement it. This is bounded evidence,
not a claim of exhaustive WCAG certification. No new motion or dependency.

Full browser review caught transient low contrast when locale-selection text and
background colors interpolated independently. Pressable color roles now switch
atomically; existing small press transform remains (none under reduced motion).
The test was not delayed or weakened to hide the intermediate state.

Final local gate: `npm run verify` passed with bundled Poppler on PATH, 616 fast
tests, 88 real PostgreSQL tests, 42 production-build browser tests, production
build and closed-public-demo boundary harness. Separate API build passed.
Secret/icon/manual/dependency gates passed (zero production vulnerabilities).
The existing 15 legacy lint warnings remain unchanged. Final Emil/Operator
review retains the Before/After/Why decisions above; owned Work returns,
inbound/outbound outcome evidence and exception investigation remain green.
Delivery gates below are not inferred from these local results.
