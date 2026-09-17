# Accessibility Baseline

Target: WCAG 2.2 AA for public and authenticated web surfaces.

## Definition of acceptable UI work

- Critical workflows are operable by keyboard with visible, logical focus.
- Dialogs label themselves, trap and restore focus, and close predictably.
- Form fields have persistent labels and programmatic error association.
- Status is conveyed by text plus icon/shape, never color alone.
- Tables use headers/captions and visualizations have equivalent summaries.
- Touch targets, reflow, 200% zoom, contrast, and locale expansion are verified.
- Motion respects `prefers-reduced-motion`; essential operational updates do not depend on animation.
- Desktop, tablet, and mobile retain task, alarm, equipment, status, and safe primary actions.

Automated checks are necessary but do not replace keyboard, zoom, screen-reader, and real-device review.

## Automated gate

Vitest renders the public entry and populated/unavailable operations projections in jsdom, then runs axe-core. The gate rejects detectable semantic and ARIA violations. The `color-contrast` rule is disabled only in this jsdom suite because jsdom has no layout engine; contrast remains a required browser/manual check and may not be marked complete from this gate alone.

A separate token-level gate calculates WCAG relative luminance and rejects normal-text foreground/background pairs below 4.5:1 in both light and dark themes. This includes muted surfaces, status colors, accent text, and the semantic `on-accent` foreground used by primary controls.
