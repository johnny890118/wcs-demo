# System-wide UI quality consolidation

Status: Active implementation; Owner visual acceptance pending. S3 paused.

## Authority / baseline

Owner authorizes a complete presentation/component quality consolidation rather
than patches or a new proposal. Baseline HEAD and origin/main are
`88f135bacacca8848d0b97ec1584ce27c2cb3440`; working tree was clean. The complete
external `full-ui-audit/report.md` is available and read. Historical UI delivery
evidence is preserved, not reused as this change's verification.

Risk: high frontend regression exposure across shared shell, forms, contextual
reads and command confirmations. No domain/API/auth/RBAC/session/scope change.
Persistent plan required. The adoption decision below is load-bearing only for
presentation maintenance, not warehouse or security architecture.

## Component decision

Keep Next Pages Router, React 19, Tailwind 3, next-themes, Heroicons and SWP semantic
tokens. Adopt inspected shadcn-style owned source components on Radix primitives
for popover, tooltip and action composition. Do not run blanket init/overwrite,
upgrade Tailwind or introduce a second theme. Retain the existing tested Headless
UI mobile navigation dialog: replacing its focus trap solely to standardize the
dependency adds regression risk without product benefit. Desktop settings use
Radix Popover, not that drawer. Product presentation uses owned wrappers and
shared semantic tokens. No remote execution scripts.

Official compatibility reference: https://ui.shadcn.com/docs/tailwind-v4 confirms
existing v3 apps need not upgrade. Review peer versions, licenses, lockfile and
SSR behavior before installation. Components are customized, not default shadcn
dashboard blocks. Do not add a license to this private repository.

Pro Max system search returned useful neutral/minimal hierarchy but unrelated
landing/green CTA/font/scroll-reveal recommendations; reject these. Keep fixed
`#E6F000`, safe semantic status colors and no decorative repeated-operation motion.
Emil governs restraint, progressive disclosure, practical focus and interaction.

## Internal execution order / gates

1. Inspect dependencies, all rendering surfaces, tests, font/CSP/hydration evidence.
2. Owned primitives and shared typography/actions/fields/sections/records/states.
3. Shell: quiet single Sidebar, accessible rail tooltips, lightweight settings
   popover; appropriate tablet/mobile menu. Preserve route/draft/preferences.
4. Home/Work/detail/resume/tasks/inbound/outbound and exact contextual surfaces.
5. Live/exceptions/recovery/inventory/load/location/history/topology/projections,
   Help/login/thin entry/access denied; legacy stays reference.
6. Real-browser iterative design review, bilingual themes/viewports, full journey
   and status fixtures. No production business mutations or equipment commands.
7. Focused tests, full verify, API build, dependency/secret/security diff review.
8. Before/After/Why evidence, checkpoint/push, exact-HEAD CI, matching Vercel/Render,
   authenticated deployed read smoke, clean tree and final Owner handoff.

## Non-negotiable acceptance

- Exact Work links, filters, pagination, permissions and warehouse scope unchanged.
- Required inputs, confirmation, idempotency and unknown outcomes unchanged.
- Source/profile/environment inspectable; simulation/hardware interpretation,
  stale/offline/unknown and safety limitations visible where decisions depend on it.
- Human-readable audit presentation uses known action vocabulary; unknown action
  never gets invented meaning; raw redacted evidence remains accessible.
- Desktop 1440, tablet 768, mobile 375/390, threshold/landscape/reflow, zh-TW/en,
  Light/Dark/System, keyboard/Escape/focus return/click outside and touch targets.
- Axe plus actual text/non-text contrast; automation is not WCAG certification or
  physical industrial-device / long-duration research.
- Do not use old 616/88/44 gate counts as new evidence; no test deletion/weakening.
- Owner alone accepts final visuals; no S3 after engineering handoff.

## Progress / evidence

- Baseline and audit confirmed; registry peer versions and MIT licenses inspected,
  installation scripts skipped. No blanket shadcn init performed.
- Owned actions/native fields/Popover/tooltips introduced. Desktop settings and
  single logout verified in a real local production-build browser. No console
  errors in that observed session; not a claim of all-route hydration coverage.
- Deterministic explicit-UTC timestamps replace host-timezone-dependent rendering.
  Legacy external font request removed without relaxing CSP.
- Final local complete `npm run verify` passed: 620 fast tests, 88 separately
  exercised PostgreSQL integration tests, 44 browser tests and the production
  anonymous-demo denial harness. API production build also passed.
- Seven main surfaces passed the device/locale/Light-Dark-System browser matrix;
  actual final-build desktop, tablet, 375px mobile, contextual detail and settings
  captures are retained outside the repository. Exact-context read walkthrough
  returned to the same task without Browser Back or memorizing its identifier.
- Production dependency audit: zero findings. Full audit has nine development-tree
  findings; do not confuse scopes or force a major Tailwind/ESLint migration.
- Implementation and local complete verification are done. Checkpoint, exact-HEAD
  CI and matching deployment/read smoke remain delivery gates, not assumed passes.
- Functional checkpoint `fc659df` passed exact-commit Actions and matching Vercel
  Ready / Render Live; managed smoke and authenticated read walkthrough succeeded.
  That walkthrough found raw exact-History headings; a presentation-only follow-up
  shares the known-action vocabulary and preserves complete redacted evidence.
  Its final verification/CI/deployment must be checked independently. Owner visual
  acceptance remains pending; no S3 work is started.
