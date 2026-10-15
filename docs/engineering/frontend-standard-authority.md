# Current frontend standards and document authority

Status: Current — Owner-approved 2026-10-13. Visual acceptance remains pending;
S3 is paused and requires explicit Owner acceptance and resumption.

## Effective authority

Owner product intent and safety constraints govern scope. The approved product
experience direction governs workflows and truth. `design-system.md` governs
presentation; `ui-workflow.md` governs verification and actual journey review.
Historical implementation plans and skill recommendations cannot override them.

Formal UI uses reviewed, SWP-owned shadcn/ui source, named Lucide React imports,
Tailwind CSS 3 and supported Radix interaction foundations. Radix is not a second
design system. SWP semantic tokens, typography, spacing, density, composition,
interaction and status rules are the single presentation authority. Fixed brand
`#E6F000`, bilingual themes, industrial touch and WCAG 2.2 AA targets remain.
No framework/auth migration or automatic template overwrite is authorized.

Owner supplement is implemented by the independent repository-wide migration:
Heroicons and Headless UI have no remaining source or package consumers, including
Legacy and dormant About. Do not reintroduce them. See
`legacy-ui-library-migration-review.md` for retained behavior and release gates.
No route/function retirement is authorized by dependency standardization.

## Document disposition

| Document / instruction                 | Current effect                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `design-system.md`, `ui-workflow.md`   | Current standards and review gates, not Owner acceptance                                                                          |
| `product-design-system-plan.md`        | Delivered engineering history through `64025dc`; visual acceptance pending; new work governed by the bounded standardization plan |
| `ui-quality-consolidation-plan.md`     | Historical/superseded implementation sequence; Heroicons/Headless retention direction is not a current formal-UI rule             |
| Theme, navigation and earlier S2 plans | Historical checkpoint evidence, not active task queues or automatic S3 authorization                                              |
| Roadmap's dated automatic S3 returns   | Superseded; historical intent retained for traceability                                                                           |
| ADR 0022                               | Strict authority/expiry contract retained; only its 3600-second default superseded by ADR 0029                                    |
| ADR 0029                               | Current 900-second default; cache activation proposals remain separate and unwired                                                |
| Repository visibility / protections    | Pending Owner Decision; never change remotely as cleanup                                                                          |

## Observed governance, not inferred intent

Read-only GitHub API on 2026-10-13 reports Public (`private=false`), main
`protected=false`, and zero repository/inherited rulesets. These differ from old
private-source assumptions. Public visibility does not grant an open-source
license or authorize product repository promotion. Owner must decide intended
visibility, main protection, review/required-check policy and access permissions.
No remote setting was changed. Existing screenshot evidence remains preserved.

## Runtime configuration parity

Human read freshness is configurable 0–3600 seconds, current runtime and checked-in
deployment-example default 900. It is not session TTL or immediate revocation.
Expired claims, warehouse switch and mutations retain their strict behavior;
reads without event-driven invalidation can retain withdrawn authority until the
earlier freshness deadline or session expiry. Audit/manual remain strict.
The deployment validator's fallback still says 3600 but only validates bounds;
it does not set runtime configuration. Track this inert discrepancy separately
rather than change security code in presentation cleanup.

## Proven cleanup and retained boundaries

- `chakra@0.0.3` has no source, dynamic loader, script or Legacy consumer; it is
  not `@chakra-ui/react`. Built JS mentions it only inside package metadata.
- ESLint 9 debug confirms Flat Config `eslint.config.mjs`; no caller opts into
  the duplicate `.eslintrc.json`.
- `.ui-link` has no rendering consumer; tests only reject that obsolete class.
  No other selection rule is removed without consumer evidence.
- No `app/` source exists; radial/conic custom utilities have no consumers.
  Pages/components scanning remains, including Legacy.
- Historical stage-1 retention of Heroicons/Headless ended with the independent
  migration. Legacy and dormant About now use Lucide/owned Radix compositions;
  About is still not an active system page. Chart.js, Axios and classnames remain
  for existing consumers. Never break reference functionality for package count.

See `../project/design-system-standardization-plan.md` for staged delivery evidence.
