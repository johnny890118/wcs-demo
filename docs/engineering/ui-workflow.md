# UI Design and Review Workflow

The required `emil-design-eng` skill from `emilkowalski/skills` was installed on 2026-09-17. Apply it before and after each major UI milestone, with operational safety and WCAG 2.2 AA taking precedence.

## Direction

Professional, calm, precise industrial operations UI. Prioritize abnormal state, freshness, task impact, and safe next action. Avoid neon/cyberpunk styling, decorative charts, excessive cards/rounding/glass, and animation that delays repeated operations.

Owner-approved brand accent is `#E6F000`, shared by light and dark themes within
a neutral-first palette. Use existing theme tokens, not component-local color
codes; readable link/text/status/focus roles may differ by theme. Brand action
retains the fixed core brand, with neutral text and contrast-safe edges.
Owner-approved final Proposal (2026-10-09) supersedes full-yellow selection:
current selections use neutral surfaces, readable text, semantic current state
and a restrained brand/contrast-safe marker. Do not reuse brand as warning or
general body/link text.
See `theme-refinement-review.md` for the role separation and evidence limits.
Green is reserved
for success/healthy/available semantics, not brand identity. Preserve semantic
status distinctions, WCAG contrast and command-safety hierarchy.

## Workflow

1. Define persona, decision, risk, state model, and acceptance criteria before layout.
2. Prototype information hierarchy at desktop, tablet, and mobile widths.
3. Use semantic controls, accessible names, visible focus, 44 CSS-pixel touch targets where practical, and text/icon/shape in addition to color.
4. Design loading, empty, stale, offline, unknown, partial-failure, permission-denied, and recovery states.
5. Use design tokens for theme and status meaning; verify both themes and both locales.
6. Add motion only for feedback, continuity, explanation, or preventing a jarring change.
7. Run automated and manual accessibility/responsive checks.
8. Invoke the Emil skill for review and record findings as a markdown table with `Before | After | Why` columns.
9. For every major UI change, validate an end-to-end user journey as well as individual pages: can users quickly understand state/next action and complete the work across Desktop, Industrial Tablet and Mobile layouts without losing context, memorizing IDs, re-searching the same record or relying on Browser Back? Record material friction and distinguish viewport testing from real-device evidence.
10. Fix material findings and repeat review before declaring the UI milestone complete.

Current console components live in `components/ui` and use SWP semantic tokens.
Use the owned actions/native fields and inspected Radix Popover/Tooltip primitives
instead of another per-page control style or blanket template initialization.
Keep the tested mobile navigation dialog unless replacement has a demonstrated
benefit. Shared controls must preserve native form contracts, keyboard/focus,
contrast and truthful safety presentation. See `ui-quality-consolidation-review.md`.

## Motion rules adopted from the skill

- Do not animate frequent keyboard actions.
- Prefer interruptible CSS transitions; animate only `transform` and `opacity` where possible.
- Do not use `transition: all`, `ease-in` for entering UI, or entry from `scale(0)`.
- Keep ordinary UI animation below 300 ms; exits should normally be faster than entries.
- Popovers originate at their trigger; centered dialogs remain centered.
- Gate hover effects with `(hover: hover) and (pointer: fine)`.
- Reduced motion removes spatial movement while retaining useful opacity/color feedback.
- Pressable controls receive subtle active feedback only when it does not compromise safety or precision.

## Legacy review snapshot

| Before                                                   | After                                                           | Why                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `transition: all` on map cells and responsive containers | Transition only the required visual properties                  | Avoid accidental layout/paint work and unpredictable motion                 |
| 500–2000 ms routine UI animations                        | 125–250 ms for routine UI; no motion for high-frequency actions | Keep operational feedback immediate                                         |
| `ease-in` dialog exit classes                            | Strong ease-out with faster exit                                | The response should feel immediate                                          |
| Perpetual bouncing dispatch button                       | Static primary action with clear pressed/loading state          | Repeated decorative motion distracts from alarms and ignores reduced motion |
| Mouse-hover-only load/task detail                        | Focusable disclosure or accessible detail panel                 | Keyboard and touch users need the same information                          |
