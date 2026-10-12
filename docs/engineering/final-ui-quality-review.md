# Final formal UI quality review

Status: bounded review complete; delivery gates recorded below, not Owner visual acceptance. S3 paused.
Baseline: `8c68c9e1211c2f1bab8a0ad3c128fd45621f8423`, clean and pushed.
Review date: 2026-10-12. This is a bounded systemic closure of existing work,
not a new visual proposal or a claim of award-winning quality.

## Scope and evidence method

Formal surfaces: `/`, `/login`, Operations Home, Work queue/detail/continuation,
Inbound, Outbound, Task queue/detail, Live, Topology, Exceptions, Inventory,
Loads, Locations, History, Help, technical Projections, access denied and all
seven exact task-context surfaces. About/Contact remain dormant public sources;
legacy is migration reference, not a formal capability. Public/API/indexing and
unauthenticated route boundaries remain covered by the full regression suite.

Existing seven-page matrix covers Desktop 1440×850, portrait Tablet 768×900,
Mobile 390×844 × zh-TW/en × Light/Dark/System. A new supporting-surface matrix
covers 18 route instances × 1440/768/375 widths × both locales × all three
preferences (324 combinations), preserving screenshots of every combination.
Existing responsive navigation tests additionally cover landscape/short windows,
collapse/reload, warehouse switches, drafts and focus. Viewports are not physical
industrial device tests. System preference coverage does not imply every OS or
browser implementation has been certified.

New adverse-state matrices cover empty topology and failed Live refresh with
retained, explicitly last-known observations, in the same 18 presentation
combinations. Existing cases cover empty alarms/search, invalid scope and switch
denial, unknown inventory, unknown audit action, stale/disconnected telemetry,
unknown recovery outcomes, confirmation and exact context across reload. These
are applicable-state coverage, not every theoretical route × state Cartesian
product. Controlled fixtures and intercepted read failures are labelled test
evidence, never production equipment observations or successful production login.

## Root-cause review and bounded corrections

| Before                                                                                                               | After / disposition                                                                                            | Why                                                                                  |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Empty Topology returns a separate centered card, only an h2, old Warehouse map label and no Live/Topology navigation | Reuse owned PageHeading, existing truthful title/description and navigation; one explicit empty status         | Conditional content must not replace the stable page identity or strand the operator |
| Main-page matrix was extensive, support/detail matrix evidence fragmented                                            | Extend real production-build browser checks and screenshots to every supporting route family and exact context | Shared controls must be verified outside the seven headline pages                    |
| Failed refresh visual checks mostly Desktop/phone and two explicit themes                                            | Cross-geometry, bilingual Light/Dark/System read-failure matrix                                                | Stale evidence must remain readable without promoting last-known data to current     |
| Previous navigation, settings, form, record, action, History and exact-context defects                               | Preserve delivered shared primitives and regression contracts                                                  | Do not repeat verified work or manufacture new cosmetic changes                      |

The real Before empty-topology image was captured from the baseline production
build: missing h1 and missing page navigation were visible in the accessibility
tree and screen. The correction is entirely presentation; missing topology is
still missing. No coordinates, safety claims, control capability or map is added.

| Before                                                                                   | After                                                                                         | Why                                                                                                                   |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Shared contextual Help is a standalone prominent underlined reference on every workspace | Use the existing owned ghost action, preserving its exact topic URL and native link semantics | Help is a secondary navigation action, not an inline citation; avoid repeated emphasis and another control vocabulary |

This shared-shell correction was identified from actual Work, Inventory,
Topology and supporting-page images. The first complete gate passed before it;
the final gate must be rerun after it. Unit and cross-route browser assertions
check the owned variant, topic destination and 44px interaction baseline.

## Cross-surface findings by common concern

- Layout/proportion: shared heading and content widths retained; sparse bounded
  records do not justify fake data, decorative charts or new business panels.
  Technical Projections' locally scrollable inventory table is intentional, not
  document overflow. Its engineering vocabulary is not operator-primary content.
- Hierarchy/action roles: secondary investigation, quiet History/refresh, neutral
  current navigation and fixed brand primary commands retained. Work context
  returns remain exact links rather than Browser Back dependencies.
- Components/forms: owned CVA controls, native required fields, recorded creation
  before execution, reasons and confirmation retained. No new control vocabulary.
- Records/links: full lawful identifiers can wrap; diagnostic values remain
  inspectable. Unknown action does not acquire a fabricated readable meaning.
- Overlays: owned Sheet, Popover and Tooltip, one close/logout, Escape/trap/return
  and geometry-change recovery retained; no second permanent global navigation.
- Status: assignment is not physical evidence; empty alarm/projection is not
  healthy or safe. Failure/unknown and freshness qualifiers remain explicit.
- Responsive: portrait/narrow/short geometry uses Topbar; usable landscape uses
  Sidebar. Single scope has no meaningless general strip; action-local target
  and source remain. Touch and keyboard requirements are not traded for density.

Pro Max/Emil guidance is supporting judgement, not independent human review,
an aesthetics score or a quality certificate. Previous official Awwwards,
Webby and FWA reference observations remain in the persistent plan: transfer
visual restraint, alignment, type rhythm and consistency, not marketing
animations, theatrical empty space or invented industrial maps.

## Governance and unresolved product boundaries

Read-only GitHub API: repository is **public**, `private=false`; main is
`protected=false`, branch protection endpoint returns 404, repository rulesets
(including parents) return an empty list. README calls the source private and
AGENTS prohibits exposing the private repository in product UI. This is an
observed intent/reality mismatch, not permission to change visibility. Owner
must decide intended repository visibility, collaborators and main protection
(required exact CI/review, force-push/deletion restrictions, admin bypass).
No settings or permissions were changed. Current secret scan does not prove
every historical commit was secret-free; any exposure investigation/credential
rotation needs its own safe scope, without publishing credentials in a report.

Documentation describes an implemented but unaccepted design system; historical
checkpoint claims must be read with current unaccepted status. S3 remains paused.
Keep business workflow limitations separate from visual defects: Outbound's
existing result projection destination remains; no flow change is sneaked into
this pass. Physical map authoring/commissioning, mature control/reconciliation
and external integration remain roadmap capabilities, not fake UI completeness.

Production fresh login remains **unverified**: available local production
credential snapshot is masked/stale, not valid evidence. No reset, credential
reveal, auth bypass or existing-session-as-fresh claim. Public/denial/API-health
smoke can pass independently; it is not an authenticated production journey.
Owner must complete a valid fresh login without pasting a password into chat.

## Delivery evidence

The first complete gate passed 653 fast, 88 real PostgreSQL and 52 browser tests,
production build and public-demo denial; separate API build passed. The shared
Help correction was added afterwards and the same full gate is rerun against
the final source. Existing 15 Legacy lint warnings remain (zero errors); current
production dependency audit reports zero vulnerabilities. No check was weakened.

Final post-correction `npm run verify` passed: 653 fast tests, 88 real PostgreSQL
tests, 52 browser tests, production build, manual/icon integrity, secret hygiene,
dependency/lint/type checks and public-demo denial. The supporting matrix also
asserts the shared Help variant, exact topic link and 44px baseline on every
applicable route. Docs-only evidence additions after that gate receive formatting
and secret/diff review before the coherent checkpoint; implementation is unchanged.

Security source/diff self-review: only two presentation JSX branches changed;
all other changes are tests, isolated test fixtures and documentation. No auth,
RBAC, warehouse resolver, session freshness/expiry, API, execution, telemetry
qualification, unknown outcome or audit/redaction/retention code changed. No new
runtime dependency, service setting or provider permission. An independent human
security/design reviewer did not participate and is not claimed.

Actual browser image review covered seven operator main pages and supporting
Work detail/continuation, Loads, Locations, History, Help, access denied,
Projections, Topology and all seven exact contexts. Representative native
Tablet/phone Dark/en support, empty and failed-read images were inspected as well;
the matrix executes all combinations, but not every PNG has been manually judged
pixel by pixel. No beauty/award score is inferred from Axe or automated contrast.

The existing baseline
CI run 38246199609 succeeded; Vercel Ready and Render Live matched full baseline
SHA and safe deployed smoke passed. Final checkpoint/CI/provider full-SHA closure
is recorded in the external `final-quality-review.html` gallery and handoff after
push, rather than inserting a circular self-commit SHA into this file. That
closure must be checked, never inferred from baseline success. The gallery links
the preserved full Before/After history and all 360 new support/adverse PNGs.
Source SHA, fixture/viewport and raster limitations stay visible. Engineering
closure still leaves Owner visual acceptance, real fresh login and governance
decisions outstanding; S3 stays paused.
