# System-wide UI quality review

Status: Implementation review in progress. Not Owner acceptance or delivery.
Baseline: `88f135bacacca8848d0b97ec1584ce27c2cb3440`. S3 remains paused.

## Design judgment

UI/UX Pro Max guidance is applied to hierarchy, neutral surfaces, consistent
controls, responsive density and practical targets. Emil guidance is applied to
focus, quiet selection, disclosure, restrained motion and repeated-work comfort.
These are skill-based reviews, not participation by the skill authors. Retaining
a reasonable component is a valid outcome; not every reviewed file needs a diff.

No default dashboard template, additional product capability or speculative map.
Brand stays `#E6F000`; status remains independent and includes readable text.
Strong input boundaries remain where non-text contrast requires them. Content
cards and separators do not all need equally strong borders.

## Shared components — Before | After | Why

| Component               | Before                                                                                 | After / retained decision                                                                                 | Why                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| OperationsShell         | Desktop preferences used a full-screen drawer; hints relied on title                   | Collision-aware Radix Popover; single logout; pointer/keyboard rail hints; mobile keeps its tested dialog | Settings must not dominate or duplicate navigation                      |
| ThemeControl            | Icon-only choices in desktop settings                                                  | Optional visible labels there; one persisted Light/Dark/System preference unchanged                       | Improve recognition without a second theme authority                    |
| LocaleControl           | Two bilingual pressed choices                                                          | Retain compact choices and existing persistence                                                           | Already understandable and context-preserving                           |
| WarehouseContextControl | Hand-styled select/action                                                              | Owned native field/action, same authorized switch and draft behavior                                      | Consistency without custom select keyboard regressions                  |
| WorkNavigation          | Contextual Work tabs                                                                   | Retain task execution under Work and quiet underline                                                      | Not a second global navigation or permission model                      |
| InventoryNavigation     | Inventory / Loads / Locations tabs                                                     | Retain contextual destinations and exact read contracts                                                   | Existing grouping is appropriate; no IA change                          |
| WarehouseNavigation     | Live / topology contextual destinations                                                | Retain truthful distinction and secondary topology                                                        | A technical diagram must not become a fake physical map                 |
| NavigationProgress      | Live navigation status                                                                 | Retain bounded pending signal and completion/error handling                                               | Feedback is useful; does not pretend latency is solved                  |
| ProductMark             | Owned SWP mark                                                                         | Retain fixed brand core and accessible link name                                                          | No new brand concept needed                                             |
| InboundWorkflowPanel    | Heavy form container, fixed column proportions, disparate controls                     | Open grouped form, proportional confirmation column, owned controls                                       | Reduce framing; preserve all required fields and confirmations          |
| OutboundWorkflowPanel   | Duplicate introductory headings and heavy container                                    | One page heading, grouped form, consistent proportions/controls                                           | Allocation evidence and reservation truth stay unchanged                |
| WorkExecutionPanel      | Separate custom controls and action style                                              | Shared native controls and safety action variant                                                          | Keep qualification, one-attempt/unknown behavior and exact continuation |
| AlarmRecoveryPanel      | Custom acknowledgement/recovery inputs                                                 | Shared fields/actions; confirmation and investigation links retained                                      | Do not make recovery look like a harmless navigation action             |
| ExceptionAttention      | Timestamp and qualified attention list                                                 | Explicit UTC time; retain partial coverage and abnormal-state priority                                    | Never turn an empty bounded projection into an all-clear claim          |
| WarehouseLiveView       | Selected border inherited text color; large framed detail; normal explanation dominant | Neutral selection edge, open detail, current reason disclosed; stale/unknown reasons remain visible       | Work impact must be readable without hiding evidence limits             |
| WarehouseTopologyMap    | Engineering graph with observation qualification                                       | Retain technical/reference purpose and real node/observation checks                                       | No calibrated geometry exists to justify a decorative floor map         |
| SpatialReadNotice       | Explicit uncalibrated physical/layout limits                                           | Retain limits; placed after active work on Live                                                           | Readability cannot invent physical safety evidence                      |
| PermissionNotice        | Icon plus textual explanation                                                          | Retain qualified readable status                                                                          | Color is not the only permission signal                                 |
| PublicHeader            | Thin public entry identity/preferences                                                 | Retain minimal entry, no marketing navigation                                                             | This change is system-first, not a public website project               |
| PublicPageHead          | Public metadata boundary                                                               | Retain approved public metadata/noindex separation                                                        | Visual work must not expand indexing or expose the repository           |

## Surfaces — Before | After | Why

| Surface                                 | Before                                                   | After / retained decision                                                          | Why                                                                     |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Home                                    | Repeated eyebrow, framed attention/work/stat cards       | Work-first sections/dividers and quieter metrics; data failure/coverage unchanged  | Reduce nested framing without inventing health                          |
| Work queue                              | Framed record per case, little selected-filter emphasis  | Readable record separators, shared heading, quiet active/all selection             | Work identity and action outweigh containers                            |
| Work detail / resume                    | Persistent context, execution evidence and exact returns | Preserve server-resolved work, explicit UTC and shared execution fields            | No Browser Back or duplicate job dependency                             |
| Tasks / task detail                     | Execution-focused context and technical references       | Preserve exact links and safety/evidence, deterministic time                       | Task remains execution layer, not a fabricated business stage           |
| Inbound / Outbound                      | Repeated page and panel descriptions                     | Single heading and grouped required inputs                                         | More work space, no removal of contract inputs                          |
| Live                                    | Engineer explanation above active work                   | Active work before secondary spatial notice; normal-only disclosure                | Keep all abnormal/unqualified explanations exposed                      |
| Exceptions                              | Repeated alarm/exception page introduction               | Shared heading; original attention/recovery qualification retained                 | State, impact and safe next step first                                  |
| Inventory                               | Responsive quantity/detail cards and exact search        | Owned search fields/actions, shared heading, UTC freshness; retain truthful counts | Unreserved balance is not safe-to-move authorization                    |
| Loads / Locations                       | Exact filters and configured-record evidence             | Owned fields/actions and UTC time; location help corrected to exact identity       | Never substitute partial search for an exact handoff                    |
| History                                 | Raw action/resource identifiers dominate                 | Localized known action/resource label, actor/time primary; raw evidence disclosed  | Human meaning without guessing unknown actions or losing accountability |
| Help                                    | Bilingual literal search, context links, versioned PDF   | Retain reading/search and authenticated artifacts; owned search input              | No need to rebuild working documentation behavior                       |
| Topology / Projections                  | Technical evidence tools                                 | Retain secondary access and original truthful tables/graph                         | Operator primary IA is not being expanded                               |
| Login                                   | Existing own form and safe callback                      | Owned fields/actions; existing safe callback/auth flow retained                    | Presentation must not redesign authorization                            |
| Access denied                           | Home implicitly selected and titled                      | Correct denied title, no false selected primary destination; owned return action   | Do not misrepresent the denied context                                  |
| Root / dormant About / Contact / legacy | Thin entry plus non-primary/reference routes             | No new marketing work; legacy not promoted                                         | Respect product boundary                                                |

## Actual findings and repairs

- First full gate passed 619 fast and 88 real PostgreSQL tests, but browser gate
  failed 9 of 44: **not delivery evidence**. A tooltip portal exposed content
  outside landmarks and intercepted Escape inside the mobile dialog. Repair the
  product: named hint landmark, and no redundant tooltips in fully labelled mobile
  navigation. Keep Axe enabled and require one Escape/focus return.
- Audit actor was initially disclosed too deeply. Restore actor identity to the
  primary record; disclose raw technical action/resource/correlation/evidence.
  Tests now exercise disclosure and still inspect the original raw action, rather
  than deleting evidence assertions.
- The focused repeat passed eight previously failing journeys. The remaining
  Escape failure was reproduced and fixed by removing mobile tooltip behavior.
  The complete neutral-first journey then passed. All gates must run again on
  final source; these intermediate passes are not exact-HEAD CI.
- The first full gate stopped at missing `pdftotext`; selecting the bundled
  Poppler with `PDFTOTEXT_BIN` preserved the real bilingual extraction gate.
- Production dependency audit is clean. Full audit additionally reports nine
  development-tree findings, not caused by a production authentication bypass.
  No forced major dependency migration or audit suppression is used.

## Final local evidence / security review

- Complete final local verification passed: 620 fast tests, 88 actual PostgreSQL
  integration tests, 44 browser cases and the production-build anonymous-demo
  denial harness. API production build passed separately. UI-focused suite had
  25 files / 143 tests. No test removal, Axe suppression or reduced admission gate.
- Matrix exercises seven main pages in both locales, Light/Dark/System, desktop,
  tablet and mobile; adaptive shell includes 375px and breakpoint/landscape checks.
  Native fields preserve required/name/disabled semantics. Text and non-text
  contrast, keyboard, focus return, reflow and safety confirmation remain tested.
- Actual final local production-build walkthrough: Work → work detail → task →
  exact inventory/load/source/destination/Live/exception/history → same task.
  Reload keeps exact server-resolved context. Collapsed rail reloads as collapsed;
  preferences are directly operable. One Escape closes the compact menu/Popover.
- Local browser captured no error/warning messages across observed primary and
  contextual pages. System font stack removes the remote font dependency without
  modifying CSP. This observation is not universal console coverage.
- Diff security review: no domain/application/infrastructure/API/auth changes;
  commands, confirmation state, idempotency, warehouse switch, permission checks,
  safe callbacks, audit pagination and evidence remain unchanged. Display-only
  unknown audit action stays unknown; source evidence remains inspectable.
- Production dependency audit: zero findings. Full dependency audit: nine dev
  findings (two moderate, seven high), with broad Tailwind/ESLint changes suggested
  rather than a safe scoped repair. Do not use forced upgrades. Lint retains 15
  documented legacy warnings and zero errors. Secret hygiene and diff checks pass.
- Before captures are actual baseline production UI; After captures use the local
  production build with isolated deterministic fixtures. Different data and native
  browser-chrome dimensions are labelled, not presented as pixel-matched evidence.

## Remaining delivery gates / limitations

Commit/push/exact-HEAD CI and matching deployment/read smoke remain pending until
their actual evidence is captured. Browser automation and contrast
checks do not constitute WCAG certification, physical industrial tablet testing,
equipment safety certification or long-duration operator research. Owner retains
final visual acceptance. No S3 work is authorized here.
