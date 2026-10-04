# Neutral-first brand and journey validation checkpoint

Owner-approved small update, 2026-10-04. This is independent of the completed
freshness foundation and the forthcoming Operator Experience A–D implementation.
No route, workflow, authorization, warehouse scope or roadmap sequence changes.

## Emil / accessibility review

| Before                                               | After                                                                     | Why                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Green brand accent and green-tinted neutral surfaces | Shared `#E6F000` core accent and neutral surfaces through existing tokens | Separate brand from healthy/success semantics without a redesign                            |
| Raw accent used for small text and topology graphics | Contrast-safe `accent-strong` foreground; full-opacity route strokes      | Yellow on white fails contrast; preserve readable text and operational route evidence       |
| Page-level review could miss cross-page friction     | One concise mandatory end-to-end journey step in UI workflow              | Validate understanding, retained context and real task completion, not isolated screenshots |

Independent review found the light-theme foreground regression; correction and
re-review resolved it. Green success tokens, danger/warning semantics and blue
focus remain distinct. The light warning token was darkened minimally to retain
4.5:1 contrast on the neutral muted surface. No new motion or dependencies.

## Verification evidence

- `npm run verify`: 524 fast tests, 79 real PostgreSQL tests and 35 production-build
  Chromium tests passed; build, typecheck, formatting, secrets, icon derivatives,
  manual consistency and public-demo fail-closed boundary passed. Zero production
  dependency vulnerabilities; 15 previously tracked legacy lint warnings remain.
- Additional foreground-usage regression assertion: focused contrast suites now
  pass 29 tests; rejects raw brand-accent text in actual TSX pages/components.
- Read journey Home → Tasks → Inventory → Live verified at 1440/768/390 CSS-pixel
  widths, `zh-TW`/`en`, light/dark; each page checked with Axe and no horizontal
  page overflow. Existing login/keyboard/reflow and inbound/outbound/recovery
  scenarios also passed. Screenshots inspected for mobile light and desktop dark.
- These are browser viewport tests, not physical industrial-tablet validation.
  This palette checkpoint does not claim reloadable Work Context or five complete
  operator journeys; those remain the approved A–D work.

Exact checkpoint CI and managed deployment/runtime verification are delivery
gates after push, not inferred from local results.
