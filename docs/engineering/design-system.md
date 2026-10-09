# SWP owned design system

Status: implementing the Owner-approved system; not visually accepted.
See `../project/product-design-system-plan.md` for progress and remaining gates.

## Foundation and composition

shadcn/ui owned source + named Lucide React + current Tailwind 3. Radix remains
the supported foundation of adopted shadcn primitives, not another competing UI
system. Official registry code is inspected and adapted, never blanket initialized.
Primitive provenance is tracked in `components/ui/primitive-provenance.md`.

`styles/globals.css` owns Light/Dark semantic color and the shared type/space/
radius/motion/content-width tokens. Brand `#E6F000` stays constant; green is health,
not brand. Do not encode semantic truth by color alone or add component hex colors.
Body uses a local bilingual system stack; metadata never replaces readable labels.

## Distinct interaction roles

| Role               | Rule                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Global navigation  | Quiet neutral row, small brand identity marker, current page + name/icon                       |
| Context navigation | URL-backed links, baseline underline at item bottom; no side pseudo-marker or ARIA fake panels |
| Preference         | `aria-pressed`, neutral raised segment, one persisted choice; no brand marker                  |
| Filter             | URL-backed selected neutral chip, filter-specific class, no primary-action disguise            |
| Selected record    | Neutral background and subtle edge, explicit selected/evidence text                            |
| Primary command    | Brand background and dark text, safety confirmation unchanged                                  |
| Secondary action   | Neutral control; commands are buttons, route changes remain links                              |
| Inline reference   | Link color for actual in-text evidence, not every repeated action                              |
| Focus              | Visible dedicated outline, never confused with current page                                    |
| Status             | Explicit readable status/qualifier plus semantic color; stale/unknown visible                  |

Shared context navigation is `components/ui/navigation.tsx`. Button is CVA +
Slot + class merging, forward refs, owned action aliases and 44px minimum. Fields
preserve native names, required labels, submit/selection semantics and refs.
Avoid replacing a native select with custom ARIA only for appearance; adopt the
appropriate shadcn native select pathway when composition is ready.

Page pattern is readable heading → secondary contextual navigation → current
state/impact → working content → safe action → optional technical disclosure.
Exact entity return links remain available. Do not move safety truth to tooltips.
This composition is being migrated; documentation is not a claim every page is done.

## Responsive and visual review

Sidebar only when landscape >=1024 CSS width and >=600 height. Otherwise compact
Topbar/menu. One visible global navigation. One authorized warehouse has no general
switch; multiple scopes switch in navigation. Action-local target/source retained.
Transient menus close with visible focus on geometry change; drafts/context stay.

Keep touch targets >=44px in work controls; keyboard/escape/focus and 375px test.
Review actual Light/Dark × zh/en × portrait/landscape screens and long content.
Only motion that improves feedback, honor reduced motion, no decorative animation.

Two quality gates: engineering verification and actual cross-page composition
review. Deterministic visual regression detects displacement/overflow/clipping/
selection defects, not an aesthetics score. Record real Before → defect → root
cause → change → After; repeat after corrections. Skill checks guide observation,
never auto-approve. Do not claim award quality from prose or package installation.
