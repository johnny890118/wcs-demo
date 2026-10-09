# Approved operator UI implementation review

Historical evidence: fixed tablet rail and always-on page context are superseded
by the Owner-approved single-site-first navigation acceptance; see
`../project/single-warehouse-navigation-plan.md`. Existing implementation screenshots
are retained as historical evidence, not current geometry requirements.

Status: UI implementation delivered; Owner visual acceptance gates S3 resumption.

## Design authority

Owner approved the final six native comparisons, not a new design exploration.
UI/UX Pro Max's targeted keyboard/focus guidance and full reference rules guide
coherence, touch/reflow and semantic roles. Emil's skill guides restraint,
hierarchy, frequency-sensitive motion and final polish. This is skill-based
review, not personal participation by the designers.

## Before | After | Why

| Before                                                                         | After                                                                                                                 | Why                                                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Full yellow selections compete with actual primary commands                    | Neutral current selection and narrow contrast-safe marker; yellow logo/action retained                                | Separate brand, state and action without making yellow warning                  |
| Fixed 256 px sidebar and permanently stacked mobile preferences/navigation     | 220/76 px persisted desktop preference, tablet rail plus full-label menu, compact mobile header/menu                  | Recover useful working space without changing IA or authorization               |
| Repeated large headings and equally heavy card sections                        | Shared 28 px/600 page hierarchy, restrained surface/shadow and bounded content measure                                | Reduce visual shouting and unintentional whitespace                             |
| Inbound confirmation takes almost half the desktop width                       | 680 px form with subordinate adjacent confirmation, logical fieldsets and 48 px controls                              | Keep work first while retaining command review and outcomes                     |
| Proposal calls shipped required references optional                            | Required fields stay visible in their own reference group                                                             | Visual approval does not authorize a business-contract change                   |
| Live technical explanations precede device state and dominate tablet space     | Device selection strip and readable state/position first; observed/assigned work kept separate, diagnostics disclosed | Prioritize real evidence and impact without inventing a physical map            |
| All inventory values have equal weight and source text is an unstructured grid | Balance leads; reservation/unreserved quantities remain separately labelled; recorded source rows align               | Faster reading without equating available-state stock with allocation authority |

## Preserved security and truth

Changes are presentation, local navigation preference and accessible menu only.
No API, SSR access wrapper, permission, warehouse scope, command payload,
confirmation, audit, observation-validity or pagination contract changes.
Menu links preserve existing destinations and owned exact-context handoffs.
Collapsed navigation retains accessible names; the menu uses the existing
Headless UI dependency for focus trapping, Escape and focus restoration.
Blocked local storage falls back to an in-memory presentation preference.

Both required external inbound fields remain required. Inventory location is
still explicitly rendered; quantity/source grouping does not erase lineage.
Stale, offline, unknown, bounded absence and physical/calibration limitations
remain visible text, not status-color-only or success assumptions.

## Verification progress and findings

Initial token suite: 37 passed. UI focused suite: 142 passed. Typecheck and
production build passed. First full run: 616 fast and 88 real PostgreSQL tests
passed; 41/44 browser checks passed. Failures were old full-yellow/combined-title
assertions and principal display moved into the menu, not authorization failures.
These checks are updated to assert the approved visual structure and retain
location, identity, keyboard and contrast evidence. Full gate must be rerun.

The first menu root had zero layout bounds despite visible children; the
dialog now owns the fixed viewport and is tested as a visible modal. Preference
test helpers wait for the actual dialog and close it before evaluating page
content; no arbitrary sleeps or test exemptions were added.

Local development mode exposed a pre-existing NextAuth undefined-email SSR
serialization issue. Production-build local runtime loaded successfully. This
presentation checkpoint does not broaden scope into identity callbacks; do not
claim development-mode parity or hide this separately observed limitation.

Final complete gate passed 616 fast, 88 real PostgreSQL and 44 production-build
browser tests, plus public-demo denial harness, secret/icon/manual/dependency,
lint/type/format and production build. Separate API build passed. The final Live
test fix updates only the old reference wording; observation/assignment, topology
identity, ageing and retained last-known assertions remain intact. Existing 15
legacy lint warnings remain; production dependency audit reports zero findings.
Form control edges use the existing contrast-safe strong-border token, not the
decorative card separator. No new dependency or component-local palette is added.

The new browser matrix covers seven surfaces × three viewport widths × two
locales × two themes, including Axe, rendered text contrast and overflow. The
adaptive-shell gate adds 375 px and landscape, persistent collapse, keyboard
Escape/focus return and visible warehouse/source context. Six native PNG captures
are saved in the external approved-preview workspace under `implementation/`,
with `index.html` comparing the approved proposal against the actual local build.
They cover 1440×850 inbound, 768×900 Live and 390×844 inventory in both themes.
Separate interactive browser review inspected desktop form proportions/collapse,
tablet evidence and safe investigation links. The automated journeys executed
inbound/outbound creation-confirmation-outcome and exact Work/Task/Live/exception/
inventory/history/reload returns without remembered IDs or Browser Back.

Security diff review found no authorization or domain changes. Operator/Emil
skill review accepts the narrower confirmation column, restrained selections,
aligned mobile quantity baseline and tablet impact/action side-by-side grouping.
Retained deviations from the proposal are required reference fields and visible
warehouse/environment/source and qualified evidence notices. Long/raw History
action names remain an existing limitation; no business capability is fabricated.

## Exact implementation delivery

Implementation checkpoint `796bb977f6f356b81c7819b3125392e242c243d4`
(`feat(ui): implement approved operator interface`) is pushed to `origin/main`.
Exact-HEAD Actions run `37842875715` completed successfully, including verify and
production-like deployment-smoke jobs. Vercel deployment
`GaZ64aLfL1MGCr41JwZMpSDbd6mE` is Ready with that source commit; Render deployment
`dep-db405qmq1p3s73elglo0` is Live with the same full SHA. Managed smoke passed for
the Vercel site and Render API.

Authenticated deployed read walkthrough covered Home → active Task → persisted
Work/reload → same Task → exact Inventory → exact Live → History → owned Work
return, then outbound, global Live, Exceptions and Inventory. No production
mutation was issued. Waiting/unassigned work retained its qualified missing
inventory/equipment evidence rather than substituting other records. Global Live
showed actual current AMR observation, separate assignment and safe alarm link.
Theme/locale changes, desktop collapse and Escape/focus restoration passed.
Browser preferences were restored to expanded/Light/zh-TW. Production screenshots
are separate `implementation/deployed-*.png` artifacts, not the fixture matrix.

The subsequent evidence-only documentation commit does not change runtime code.
Its own exact-HEAD CI/provider/runtime state must be confirmed at final handoff;
do not confuse implementation-checkpoint identities with a later HEAD. S3 remains
paused for Owner acceptance of the shipped UI.

Viewport automation is not physical industrial-tablet/gloved-use testing,
long-duration operator research or WCAG certification. Deterministic fixtures
exercise existing contracts; their records are never shipped into UI code.
