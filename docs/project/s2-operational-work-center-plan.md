# S2 Operational Work Center Plan

Status: Complete for approved S2 foundation — checkpoint `842503d`, Verify `37137046354`, exact-commit Vercel/Render, managed runtime and clean tree confirmed.

## Current handoff-free continuation order

Freshness checkpoint `9b24d83` and S2 acceptance checkpoint `842503d` both have
successful Verify/deployment-smoke, Vercel/Render exact-commit success, managed
runtime passes and clean-tree evidence. Remaining checklist items are traced to
shipped code/tests in `s2-acceptance-evidence.md`, including persisted negative
binding regressions. Continue independently under `s3-demo-lifecycle-plan.md`;
do not rebuild shipped UI or treat completed historical notes below as tasks.

## Historical slice evidence (not active instructions)

The following chronological notes preserve decisions and verification. Completed
future imperatives below are historical, not instructions to redo shipped work.
Once the current acceptance delivery gates pass, continue S3 under the autonomous
charter; marketing remains deferred.

Manual correction checkpoint `375d6f0` is pushed, CI/deployments/runtime verified
and was clean before the independent freshness slice began. Freshness now has
implementation, full verification and independent security review evidence in
`s2-session-freshness-plan.md`. Complete its checkpoint/delivery gates before
returning to S2 acceptance closure. No S3 implementation or marketing work is
authorized before those delivery gates by this ordering.

Owner's latest instruction after accidental interruption: finish the current
manual correction slice through full verification, checkpoint, push, exact-HEAD
CI and runtime/deployment confirmation with a clean tree. Then independently
evaluate and implement configurable read-only human-session freshness plus real
navigation/auth/API/query timing. Do not silently weaken S1 revocation/expiry,
warehouse/permission checks or immediate mutation/switch revalidation. Record the
read-only revocation-delay trade-off and use independent security review. Resume
S2 acceptance closure after that dedicated slice; no S3 implementation yet.

Manual correction revision `2026-10-03.3` replaces the unshipped task-search claim
with All work/load-more traversal, and describes contextual Home investigation.
Single Web/PDF source, private delivery and release drift gates remain intact.
Full verification passes 431 fast, 21 real PostgreSQL and 34 production-build
browser tests; separate API build passes. All nine PDF pages were inspected for
glyphs, wrapping, complete topic context and footer clearance. Security review
found no permission/session/download-boundary change; UX review keeps accessible
Web primary and never substitutes a fictional feature for a real queue action.

| Before                                       | After                                                         | Why                                            |
| -------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| Manual suggests unavailable task text search | Explicit All work and Load more, no-search limitation         | Guidance must describe actual shipped controls |
| Home attention destination is unspecified    | Task detail, Live View and missing-context fallback explained | Preserve operator evidence meaning             |

## Acceptance finding: contextual Home investigation

Verified implementation: Home links selected task/linked alarm work to task detail,
equipment concern to Live View, and missing context to queue/alarms. Raw telemetry
task identifiers not present in scoped task evidence are null. This does not claim
no task exists when the bounded projection omits one. Destinations authorize again;
no query, permission, command or observation-freshness change. Full verification
passes 430 fast, 21 PostgreSQL, 34 production-build browser tests; API build passes.
Self-review retained existing contextual manual guidance and queued the separately
identified inaccurate task-search wording for the next manual correction checkpoint.
Browser fixture isolation and readable exception assertions were corrected after
initial failures; all tests pass without skip or relaxation of product assertions.

After `db71201` is exact-HEAD CI/deployment/runtime stable, correct the remaining
Home attention links: unknown/blocked work and task-linked alarms lead to scoped
task detail, equipment evidence to Live View, and missing context to the appropriate
queue/alarms workspace. Do not derive a destination from unresolved telemetry IDs;
only bounded scoped work may resolve that field. Existing destination authorization
and read freshness remain unchanged. Medium-risk read/presentation correction;
reuse this plan, no new ADR or permission model. Add pure projection/navigation
tests and real production-browser keyboard fault investigation, then full gate.

| Before                                   | After                                       | Why                                           |
| ---------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| Attention links open generic diagnostics | Work-specific task detail or Live View      | Start investigation from the selected concern |
| Home forwards raw reported task IDs      | Only scoped projected task context resolves | Equipment reports are not reference authority |

## Procedural manual synchronization slice

Completed verification: 427 fast, 21 PostgreSQL and 33 production-build browser
tests; API build passes. All eight PDF pages reviewed, with no clipping, missing
glyphs, orphaned topic heading or footer collision. Self-review caught old filename
assertions and replaced them with the canonical manual version. Release drift has
its own negative test. Web runtime shows both localized release labels and keeps
private downloads, responsive themes, keyboard links and axe checks green.

After spatial checkpoint `b63b347` passed exact-HEAD Verify/deployment-smoke,
Vercel/Render and managed runtime with a clean tree, synchronize recent inbound,
outbound, recovery and spatial guidance from the existing single content source.
Medium-low risk documentation/export/UI-label change; reuse this persistent plan,
no new ADR or permission design. Package version and dated manual revision are
distinct identities, not a production-readiness claim. Regenerate both PDFs,
inspect every rendered page, test source/release/artifact drift and production
private downloads; run full verification and API build before checkpoint.

| Before                                                         | After                                        | Why                                                  |
| -------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| Guidance predates readable confirmation and spatial qualifiers | Current procedures and evidence limitations  | Operators should follow shipped behavior             |
| Manual revision only                                           | Separate package release and manual revision | Trace guidance without inventing deployment identity |

## Autonomous continuation

Owner queued two product-quality slices on 2026-10-03, after the active Locations
checkpoint: (1) measure and improve operations navigation latency, including SSR,
persisted session revalidation and repeated Vercel/Render/PostgreSQL round trips;
never weaken S1 fail-closed revalidation, scope, permissions or audit, and do not
cache authority across requests; (2) inventory active titles/icons/metadata/OG,
login/operations/entry/navigation and replace legacy WCS Demo/female.png identity
with Smart Warehouse Platform and a neutral replaceable SWP placeholder icon.
Each requires runtime review, full verification, clean commit/push/CI and deployed
confirmation before resuming the next S2 feature slice. Keep both separate from
the currently active Locations capability.

Locations is now complete as two independent read-model/UI checkpoints.
The queued navigation/identity cleanup is tracked in
`s2-navigation-quality-plan.md`; after both clean deployed checkpoints, continue
Live View and manual/contextual help without an Owner acceptance gate.

Owner confirmed on 2026-10-03: after each verified, pushed, CI-stable clean
checkpoint, continue directly to the next coherent roadmap slice. Routine
checkpoint acceptance is not an Owner gate. Stop only for an Owner-only decision
or authorization blocker; do not broaden scope or skip verification to continue.

## Next load-read foundation

Before Loads UI, add a scoped searchable paginated load projection. Preserve
original received quantity separately from optional current inventory balance;
missing inventory is unknown/not recorded, never asserted zero. Read load's
persisted location without inferring live position. Scope both load and optional
inventory location; inconsistent foreign inventory lineage fails closed. Receipt
context is readable; audit access remains separately enforced. No load mutation,
transfer, adjustment, or reconciliation is added. This is a medium-risk read
boundary using the existing plan and authorization, not a new ADR decision.

Loads foundation implementation: `/api/v1/operations/loads` requires
`operations.view` plus current warehouse scope; source receipt, recorded load
location and optional inventory location all belong to that warehouse. Inventory
reads also validate receipt warehouse ownership. Literal search, bounded UUID
keyset pages and surface/warehouse/search-bound cursors preserve isolation.
Missing inventory remains null; shipped historical inventory projects zero
current stock; original received quantity stays separate. API permission/query
contracts and PostgreSQL partial/shipped/unrecorded balances, literal search,
pagination, cursor replay and foreign receipt tests cover this foundation. The
operator Loads UI is the next slice, not implied complete by the API checkpoint.

## Loads operator workspace

`/operations/loads` uses the scoped read projection, SSR authentication and a
read-only BFF. Shared Inventory workspace navigation connects stock and loads
without adding marketing or another top-level application concern. Search is
literal and bounded; load-more state resets by warehouse/search/projection.
Unavailable results are visibly noncurrent. Null inventory is not recorded,
shipped inventory is zero current balance, and original receipt quantity is
separate. Both load and inventory recorded states remain readable; location
disagreement warns rather than fabricating a position. `audit.view` gates receipt
history links while inventory context remains available under `operations.view`.

| Before                                              | After                                                                       | Why                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Loads exist only in task/diagnostic context         | Searchable dedicated read workspace                                         | Investigate received loads even before inventory exists                       |
| Received quantity can be mistaken for current stock | Separate original quantity and optional current balance                     | Missing stock evidence is not zero and shipped history is not available stock |
| Inventory/load navigation is disconnected           | Shared local workspace navigation with visible and accessible current state | Preserve the approved Inventory information architecture                      |
| Stock state could be hidden behind a number         | Readable quarantine/reserved/shipped state plus inventory context link      | Quantity alone is not allocation readiness                                    |

The slice is medium-risk UI/read security work with no mutation or auth-model
change. Contract/BFF/SSR tests and production-browser keyboard search, empty
state, unknown/shipped evidence, stock deep link, warehouse switching, theme,
locale, axe/reflow and desktop/mobile screenshot review are the acceptance gates.
Locations workspace, Live View and Help remain subsequent S2 slices.

## Locations read/view acceptance

Medium-risk read-only inventory workspace slice. Use persisted warehouse-local
locations, active versioned bindings, recorded load counts and non-shipped stock
record counts. Never sum mixed SKU quantities, infer physical occupancy/capacity,
or equate matching codes to topology identity. Search and keyset pagination stay
bounded and scoped; disabled/blocked/unbound locations remain visible. Link to
related load/stock searches with explicit search semantics, not exact location
filters. No configuration mutation (S6), task control (S4) or hardware inference.
Verify permissions/scope, binding revision, foreign/terminal record counts,
pagination, empty/unavailable states, keyboard, language/theme, and mobile.

Locations is split into independently verifiable read-model and operator UI
checkpoints, as Loads was. The foundation exposes
`/api/v1/operations/locations` under existing `operations.view` and current
warehouse guards. SQL selects explicit bindings for the active topology revision;
codes never substitute for node identity. Receipt/load/inventory lineage is
warehouse-scoped. Recorded load counts retain shipped history; non-shipped stock
record counts are not quantity or occupancy. Literal code/kind search and UUID
keyset cursors are surface/warehouse/search-bound. Disabled, blocked and unbound
configuration remains readable. HTTP/query/contract and PostgreSQL lineage,
pagination, active binding and shipped-record checks cover the foundation; UI
acceptance remains pending until the subsequent workspace slice.

## Locations operator workspace

`/operations/locations` completes the read-only Inventory subworkspace with
authenticated SSR and scalar-query/session guarded BFF. Warehouse/search changes
remount loaded state. Search, refresh, deduplicated load-more, empty and
unavailable states preserve evidence without claiming currency. Configuration
status is explicitly labelled as configured, not safe-to-command. Unbound active
topology is visible as requiring review; raw version/node identity and capability
codes stay in keyboard-accessible diagnostics. Related stock/load links are
explicitly substring searches, not exact location inventories. Counts are rows,
not mixed-SKU quantity or occupancy; shipped load history can remain recorded.
No configuration writes, controls, marketing or reset/replay are included.

| Before                                                  | After                                                    | Why                                                            |
| ------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| Locations only appear inside technical diagnostics      | Searchable dedicated Inventory subworkspace              | Operators can investigate location context without source code |
| Configuration may be mistaken for physical availability | Configured-state wording and safety caveat               | No read-only flag authorizes movement                          |
| Binding identity is implicit in readable code           | Explicit active-version binding with diagnostic identity | Location codes are not topology node IDs                       |
| Record counts may imply capacity or occupancy           | Separate historical load rows and non-shipped stock rows | Persisted records are not physical observations                |

Self-review applies the Emil skill: calm token-based styling, 44px controls,
localized human meaning before raw identifiers and native keyboard disclosure.
Production-browser review covers blocked/disabled/unbound states, failed
load-more retaining evidence, successful retry/deduplication, keyboard search and
empty results, related searches, warehouse switch, mobile light/dark axe/reflow,
and desktop/mobile screenshots. Locations configuration administration remains
S6, task controls S4. Live View/readable topology is the next S2 slice.

## Live View prerequisite: topology evidence correction

Medium-risk, read-only UI correctness slice under this persistent S2 plan. The
existing warehouse screen is an engineering topology inspector, not a calibrated
physical Live View. No new domain truth, permissions, command or ADR is introduced.
Its task/stock labels previously compared readable location codes directly to
node IDs, and quantities could be summed across SKUs. Display correlation now
uses only the backend's explicit active-version location binding, counts bounded
non-shipped stock records rather than units, and excludes completed work. Unbound
matching labels do not imply identity. Qualified telemetry still requires the
same topology identity/revision; current styling also requires connected,
good/current observation, active equipment and a successful projection refresh.

The warehouse view remounts by authorized warehouse/projection, aborts obsolete
refreshes and allows at most one details request in flight. Failed refreshes
retain evidence as last-known, not current. No authority cache, browser equipment
control, fabricated physical movement or route precondition is added.

| Before                                           | After                                                       | Why                                                              |
| ------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Inspector titled live warehouse topology         | Explicit topology inspector and uncalibrated-diagram caveat | Avoid claiming a completed operator Live View                    |
| Compare location codes to node IDs               | Correlate only through active location bindings             | Distinct identities must remain distinct                         |
| Sum inventory quantities across SKUs             | Bounded non-shipped stock row count                         | Quantities cannot establish occupancy or comparable stock totals |
| Old state/in-flight reads survive context change | Context-keyed remount, abort and nonoverlapping refresh     | No previous warehouse evidence under a new scope                 |

Operator Live View, readable equipment/task selection, contextual help and manual
remain subsequent S2 slices, not implied complete by this prerequisite.

Verification: complete gate passes 373 fast tests, 19 PostgreSQL integration
tests and 29 production-build browser checks; API build passes separately.
New tests cover explicit binding versus coincident labels, mixed-SKU row counts,
shipped exclusion, missing topology, warehouse remount, nonoverlapping refresh,
obsolete-read abort and retained noncurrent evidence. Browser runtime checks
stock/task binding and 503 refresh downgrading current telemetry; desktop
screenshot and mobile axe/reflow were reviewed. The inspector remains technical
by design; S6 calibrated layout, S4 controls and full Live View are not claimed.

## Live View read foundation acceptance

Next coherent slice: a server-classified, warehouse-scoped Live View projection
under existing `operations.view`, before its operator UI. Medium-risk read
boundary; this plan is persistent and no new ADR is warranted because it applies
the approved observation/binding architecture without new authority or state.
Keep topology inspector separate. Current position requires matching active
topology/revision/node, connected/current/good telemetry and active equipment;
other usable observations are last-known, unmatched/missing position unknown.
Bad/unknown observation quality is unusable position evidence, not last-known;
retain only its explicit status/quality, without a marker or readable location.
Readable location codes come only from explicit active bindings. Position state
is not equipment health, allocation readiness or safety authorization.

Observed task context and assigned work are separate, and links resolve only to
warehouse-local projected work, never arbitrary telemetry IDs. A missing task
context is unresolved, not proof of no work. Do not expose raw load/fault IDs or
adapter payloads in the new primary contract. Prioritize active/unknown work
before bounded collection limits; publish conservative coverage flags. No mixed
SKU stock aggregate, physical geometry, fabricated route progress or animation.
Reuse persisted queries without weakening S1 revalidation or caching authority.

Acceptance: pure classification/guard tests, scoped query budget, HTTP permission
and warehouse denial, BFF per-request session validation/no-store/sanitized
failure, PostgreSQL bindings/foreign lineage/stale/current observations and older
unknown task preservation, full repository gate, API build, runtime private
boundary check, independent clean checkpoint/push/CI/deployment confirmation.
User-facing Live View remains the subsequent slice, not implied by this API.

Self-review found a parallel-read activation race: the location-binding query
and active-topology query could observe different revisions. Binding topology
identity/revision is now carried internally and compared again during projection
assembly; mismatches become unbound, even when the node label exists in both
versions. This is conservative read evidence, not an atomic snapshot guarantee.

Implementation exposes `/api/v1/operations/live-view` and read-only no-store BFF
`/api/operations/live-view`; the browser session is validated on every request.
Named read purposes replace the old internal boolean without changing Home or
inspection semantics. Live View skips unused inventory and selects active work
before the bound. Full gate passes 396 fast, 19 PostgreSQL and 29 existing
production-build E2E checks; API build passes. A test-only inconsistent grant
fixture was corrected after S1 correctly rejected it; auth validation was not
weakened. Self-review fixed binding revision races and rejects fabricated
current/foreign-link payloads. UI implementation follows the clean checkpoint.

## Live View operator workspace acceptance

Medium-risk read-only UI slice after the verified API foundation. Existing
approved IA supports `/operations/warehouse` as daily Live View and
`/operations/warehouse/topology` as engineering inspection; no new ADR or
authority model. Keep the old inspector behavior/tests on its explicit route.
Primary view explains qualified position, operational status, observed versus
assigned work, affected alarms, evidence timestamps and scoped deep links.
Native selection/disclosure must work with keyboard/touch; no decorative motion,
commands, fake physical floorplan, fabricated labels or route progress.

Use a shared server freshness policy and a serialized current-position deadline.
Client expiry only downgrades evidence; it never establishes authority or marks
anything current. A failed/expired projection becomes last-known or unavailable,
and context changes abort/remount state. One nonoverlapping refresh per screen;
manual refresh uses the same path. Verify populated, empty, unknown, stale,
unavailable and foreign-context denial, bilingual light/dark/mobile axe/reflow,
keyboard selection/deep links, full gate/API build and deployed boundaries.

| Before                                                   | After                                                                 | Why                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Warehouse main route is a technical graph inspector      | Daily observation/work context with separate engineering route        | Distinct daily and diagnostic responsibilities                           |
| A frozen successful refresh can continue to look current | Server deadline and client downgrade-only expiry                      | Current labels must not outlive qualified evidence                       |
| Raw node/device enums dominate investigation             | Readable state/position/reason, work context and technical disclosure | Operators can understand risk and next investigation without source code |

## Manual web foundation acceptance

Next coherent slice after the clean Live View checkpoint: a versioned structured
bilingual manual source, authenticated searchable `/operations/help`, and
contextual links from shipped workflows. Medium-risk UI/read boundary; reuse
`operations.view`, per-request persisted session validation and warehouse scope.
No new ADR or authorization contract. Guidance and role-oriented paths describe
effective permissions, never grant access or infer permission from role names.
Links to restricted workflows depend on effective warehouse-local permissions;
all destinations independently authorize. Static guidance contains no customer
data, credential, public marketing, or fabricated controls. Search is literal and
bounded; unknown topics fall back safely. Cover session/scope, daily work,
inbound/outbound, stock/load/location semantics, Live View qualification,
alarm/unknown outcomes, accountable audit, and troubleshooting/terminology.
Administration/reset/replay/hardware commissioning remain explicitly unshipped.
Versioned PDF generation and drift verification follow separately; this web
checkpoint alone does not claim the full single-source PDF acceptance complete.
Verify guard/permission links, query handling, bilingual search, no results,
keyboard/contextual links, mobile themes/axe/reflow, full gate and deployed CI.

| Before                                        | After                                                         | Why                                                                   |
| --------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Guidance requires repository/source knowledge | Searchable bilingual shipped-workflow manual                  | Daily operators need explanations inside the system                   |
| Workflow and help are disconnected            | Workspace-specific contextual links                           | Start with the relevant topic without losing the operational boundary |
| Role names can imply authority                | Effective-permission links and independent destination guards | Guidance does not grant access                                        |

## Manual web implementation evidence

Manual implementation uses eight versioned bilingual topics shared by the web
manual and future PDF export. SSR validates `operations.view` and warehouse
context, bounds scalar query values and projects effective permission links; no
additional operational API reads or authority cache. Contextual help selects the
relevant topic first. Search, no-results, invalid topic, native anchors, internal
workflow links and warehouse/query remounts are explicit. Self-review caught
trimming on each input change (which would prevent multiword queries);
normalization now happens only at the search boundary. Full verification passes
406 fast, 19 PostgreSQL and 31 production-build browser checks plus API build.
Browser review covers bilingual literal search, unknown/no-results, keyboard
contextual/audit links, mobile themes, axe/reflow and screenshots. PDF export is
not yet claimed.

## Live View UI review evidence

Live View UI self-review preserves the inspector on its explicit route and moves
raw observation diagnostics behind native disclosure. The shared 30-second
received-evidence window is serialized and validated exactly; local time only
downgrades, never upgrades, position. This is not a command lease or equipment
health guarantee. Production-build browser review covers keyboard task links,
technical disclosure, failed refresh retaining expired evidence, both mobile
themes, English/Chinese, axe/reflow and warehouse switching. Desktop/mobile
screenshots were reviewed. No physical geometry or calibrated map is claimed.
Automated unknown-equipment selection and unresolved-context tests prevent
fabricated positions/foreign work links. API compilation and the complete gate
are required; authenticated deployed browser latency remains unmeasured.

## Manual PDF acceptance and decision

Medium-risk artifact/read-auth slice. Generate both language documents offline
from the versioned web source; commit private artifacts plus a source/artifact
hash manifest, serve only through session/scope-guarded GET, and trace assets into
standalone output. No Python/font download in a production request or build and
no anonymous public asset route. This applies the existing single-source manual
decision, not a new authority contract or ADR. No customer data or credentials
are embedded. PDF workflow links are relative path guidance with permission
labels, not customer-specific URLs; destinations still independently authorize.
Pinned Google Fonts revision and SHA-256, accompanied OFL notice, embedded font
subsets and invariant generator metadata keep authoring reproducible. Poppler
content extraction plus hash/version checks run in the repository/CI gate;
generation dependencies are isolated authoring tools, not production packages.
PDF skill review found orphaned sections/footer crowding; full-topic grouping and
larger footer clearance fix it. All seven final pages were visually inspected.
The accessible web manual remains the primary experience: these PDFs contain
searchable Unicode text but are not tagged PDF/UA-certified documents.

Complete gate passes 417 fast, 19 PostgreSQL and 32 production browser tests,
plus API build. New runtime checks download both locales, verify attachment
metadata and confirm assets exist in standalone output. Negative drift tests
exercise the real verifier without changing committed artifacts. Repeated
generation is byte-identical after disabling FontTools timestamp recalculation.
Source/hash validation runs in production builds too; full text extraction is a
separate mandatory repository/CI gate, never replaced by the lightweight guard.

| Before                                               | After                                                        | Why                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Web-only guidance can drift from exported documents  | Source/version and PDF hash plus full extracted-content gate | Detect stale or tampered downloads                                 |
| Font availability varies across machines             | Pinned source and embedded bilingual font subsets            | Avoid Chinese missing glyphs without production network dependence |
| Section content spills into another page/footer area | Keep complete topics together with footer clearance          | Preserve readable context and page boundaries                      |

## Inbound/outbound workflow context acceptance

Next medium-risk UI slice after the clean manual PDF checkpoint. Keep mutation,
permission, idempotency, confirmation and execution contracts unchanged. Lead
with submitted reference/SKU/quantity and readable location context, not UUIDs;
label that summary as request context, not physical completion evidence. Expose
receipt/order/task identifiers in native diagnostics and scoped task links.
Pending-work links explicitly open a new tab to preserve the local confirmation
form; post-completion navigation can leave the workflow normally. Ordinal task
labels do not invent source locations or physical progress. Remove the outbound
SKU selector's raw stock total, which is not reservation-adjusted availability;
point to the qualified Inventory workspace and keep backend allocation
authoritative. Stock choices remain bounded read hints, never an allocation
guarantee. Verify submit/review/execute outcomes, no numeric stock guarantee,
request-versus-completion meaning, task links, native disclosure, permissions,
both locales/themes/mobile, full gate, push/CI and deployed auth boundary.

| Before                                               | After                                                              | Why                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Receipt/order review starts with UUID                | Submitted reference/item/quantity followed by technical disclosure | Operators need business context before machine identity        |
| Outbound SKU options show unqualified stock quantity | SKU choices with bounded-evidence caveat and qualified stock link  | Recorded quantity is not available balance after reservations  |
| Workflow has no obvious task investigation link      | Explicit scoped task detail link preserving pending form           | Read evidence without accidentally losing confirmation context |

## Alarm/recovery work-context acceptance

Medium-risk presentation slice under S2; reuse the authorized warehouse projection
without changing acknowledgement/recovery endpoints, permission checks, or the
state machine. Lead with localized alarm state/severity, readable affected task
route when present, and explicit missing bounded-context meaning. Add scoped task
investigation that preserves pending confirmation, explain resume/release impact
without claiming physical clearance, and move technical references to native
disclosure. Unknown states remain unknown, never a recovery recommendation.
Test missing context, unknown status/severity, permissions, confirmed recovery,
keyboard navigation, both locales/themes and mobile reflow/axe; run full verify
and API build, then independent checkpoint/push/CI/deployed boundary checks.

| Before                                         | After                                           | Why                                              |
| ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Raw alarm enums and task UUID lead             | Readable state, affected route and evidence     | Operator can understand the selected exception   |
| Recovery choice lacks local impact explanation | Resume/release consequences and evidence caveat | State transition is not physical clearance       |
| Outcome points to broad diagnostics            | Scoped task investigation and optional audit    | Follow the work without interpreting raw records |

## Overall outcome

## Spatial read foundation acceptance

Implementation and review: spatial contract v1 now binds usable observations to
topology ID, revision and node, while unknown positions have no reference. Strict
guards reject unrecorded physical claims and foreign/version-mismatched references.
Multiple configured diagram systems remain distinct. No schema, command authority,
observation deadline, permission or query count changes are made.

| Before                                                    | After                                          | Why                                             |
| --------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Node identifier without normalized version context        | Topology ID/revision/node reference            | Prevent detached location interpretation        |
| Diagram coordinates can imply physical measurement        | Explicit unknown units/floor/frame/calibration | Avoid fabricated warehouse truth                |
| Qualification differs between daily and engineering views | Shared localized accessible disclosure         | Keep one read contract without merging surfaces |

Full verification: 426 fast, 21 real PostgreSQL, 33 production-build browser tests;
API build and secret checks pass. Existing legacy-only lint warnings remain.
Self-review keeps the notice after the page heading, uses native disclosure and
preserves unknown/freshness semantics. Manual procedural synchronization and
software-release labeling remain the next separate checkpoint; S2 stays active.

Next medium-risk read-contract/UI slice after `5b2a67f` is CI/runtime stable.
Owner Charter requires S2 spatial and normalized-position vocabulary, not S6 map
authoring. Existing observations normalize to versioned topology nodes, not XY;
topology node coordinates are persisted diagram metadata with no recorded unit,
floor/frame entity or calibration. Make these distinctions explicit in a v1 read
contract, preserve multiple coordinate-system identifiers, and expose qualified
context in Live View/inspection without plotting invented movement or treating Z
as floor identity. Unknown position must have no normalized node reference.
Existing freshness, bindings, warehouse access and command authority remain
unchanged. A focused spec records semantics; no new control architecture or ADR
is necessary. Cover missing/mixed coordinate systems, mismatched topology,
unknown/stale position, malicious unsupported physical claims, bilingual/mobile
runtime and full verification. Procedural manual/PDF synchronization follows as
its own coherent checkpoint, not manual duplication.

## Read projection scope and unresolved-evidence acceptance

Cross-workflow review found summary tasks and alarms only checked source warehouse,
while focused tasks and dedicated task reads check both endpoints. Summary stock
and the reused diagnostic stock read also lack the dedicated Inventory read's
receipt/load ownership guard. Tighten these existing read joins without changing
permissions, session validation, mutation behavior or DTOs. Prioritize unresolved
alarms before cleared history at the existing 100-row bound. Qualify empty alarm
results as bounded recorded evidence, not warehouse clearance. Medium-risk
read-boundary correction under the existing warehouse-scoping decision; no new
authorization model or ADR. Real PostgreSQL tests must prove cross-endpoint and
foreign receipt/load rejection, and an older unresolved alarm surviving more than
100 recent cleared records. Run full verification and separate API build, review
all SQL/query-budget effects, then checkpoint/push/CI/runtime before continuing.

Fresh-context independent review found no introduced blockers. It confirmed bound
warehouse parameters, stock lineage joins, prioritization before LIMIT, unchanged
query count/bounds and mutation authority, and unknown-outcome warning behavior.
Review identified test omissions for symmetric foreign-source access and
acknowledged-alarm priority; both are now explicit PostgreSQL assertions. Remaining
limits: more than 100 unresolved alarms need future paginated exception control
(S4); production-scale query plans/latency remain unmeasured. The unchanged manual
already distinguishes recorded context, unknown outcomes and backend recovery
authority; procedural investigation/stock-hint guidance will be synchronized in
the next single-source manual checkpoint.

| Before                                          | After                                               | Why                                                  |
| ----------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Summary/alarm rows check task source only       | Both task endpoint warehouses required              | Inconsistent cross-warehouse data must fail closed   |
| Raw stock reads trust inventory location alone  | Receipt, load location and stock location scoped    | Preserve provenance isolation consistently           |
| New cleared history can evict an old open alarm | Unresolved-first ordering before the existing bound | Operational evidence precedes historical diagnostics |
| Empty alarm result resembles clearance          | Bounded recorded absence and task investigation     | Absence of a row is not physical safety              |

Alarm work-context review corrected the existing UI's false resumed/success
message for an accepted `unknown` recovery outcome. Unknown outcomes now have
warning icon/text and reconciliation guidance; the existing response guard still
rejects blocking-alarm or malformed results. Unknown alarm states do not enable
actions. No mutation endpoint, permissions, confirmation or domain transition
changed. Technical IDs remain available through native disclosure. Missing task
context is qualified as bounded-read absence, not an absent task or no impact.
Runtime review covers acknowledgement and recovery preparation in both locales,
light/dark, mobile reflow/axe and keyboard task investigation. Full verification
passes 421 fast tests, 19 real PostgreSQL tests and 32 production-build browser
tests; API build passes. Existing legacy warnings remain unchanged.

Workflow-context self-review retained backend authorization, allocation,
idempotency and explicit confirmation unchanged. Removed the unqualified raw
stock quantity/HTML ceiling and corrected the request-description wording.
Request summaries are explicitly local submitted context, not completion evidence;
only accepted server task identifiers form investigation destinations. Pending
investigation opens a labelled new tab, preserving confirmation state; completed
work uses ordinary navigation. No location or source is fabricated for
multi-source outbound allocation. Native disclosures retain diagnostic references.
Production-build browser review covers both created workflows at 390 px in both
locales and light/dark themes, zero axe findings, keyboard task investigation,
confirmation/execution and audit links. Full verification passes 418 fast tests,
19 real PostgreSQL tests and 32 browser tests; separate API build passes. The
existing 15 legacy-only lint warnings remain. Authenticated deployed performance
is not measured by the isolated browser fixture.

Turn the authenticated operations surface into a task-centered work center that
explains current work, exceptions, inventory, and trustworthy equipment state in
human-readable terms. Reuse persisted projections; the browser must not infer
warehouse truth.

## Risk and decision record

This is a medium-risk, multi-slice product and read-model change. A persistent
plan is required because Home, task detail, inventory visibility, Live View, and
help cannot safely ship as one change. No new ADR is required for the first
slice: it applies the approved product-experience direction and reuses the
existing warehouse-scoped operations projection rather than introducing a new
source of truth.

## Slices

1. **Actionable Operations Home** — replace the KPI-first overview with a
   server-derived, warehouse-scoped work and attention projection; provide
   readable locations, state meaning, next navigation, freshness, bilingual
   responsive UI, and contract/runtime coverage.
2. **Task queue and task detail** — progressive disclosure from human meaning to
   route, equipment, load/order/receipt origin, commands, alarms, and audit
   evidence.
3. **Inventory, loads, and locations** — searchable operational inventory truth
   with readable location context and history links.
4. **Live View and readable topology** — build on qualified observations and
   explicit location-to-node bindings; never infer physical state from task
   assignment.
5. **Manual foundation and contextual help** — structured bilingual operational
   guidance connected to shipped workflows.

## Slice 1 acceptance

- `/operations` prioritizes attention and waiting/active work over KPI analytics.
- The API, not the browser, classifies blocked/unknown work, actionable alarms,
  and unhealthy/stale/disconnected equipment.
- The projection is authorized by `operations.view` and current warehouse scope.
- Human-readable source/destination codes are primary; raw identifiers remain
  secondary.
- Empty, unavailable, stale, light/dark, `zh-TW`/`en`, keyboard, mobile, and
  desktop states are verified.
- Existing details, alarm recovery, warehouse, inbound/outbound, and audit
  projections remain the sources for deeper workflows.

## Explicit non-scope

- Public Website or Public Demo work
- Manual task override or scheduler behavior
- M8B reset/replay
- A second dashboard aggregate or browser-derived operational truth
- Production hardware commissioning claims

## First Home slice implementation and review

The `/api/v1/operations/home` contract reuses `OperationsSummaryService`
warehouse-scoped queries and a pure application projection. The Home query
selects nonterminal tasks before the existing 100-record bound and prioritizes
unknown/blocked work; alarm rows are limited to unresolved states. Legacy
summary/details remain compatible. Visible inventory values are bounded record
counts, not warehouse-wide available-stock totals. Conservative coverage flags
warn at each collection limit. Home's independent refresh timestamp and failure
notice preserve last-known evidence without claiming it is current.

| Before                                                   | After                                                                       | Why                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| KPI cards precede operational exceptions                 | Attention and waiting/active work precede counts                            | Operators can identify the next place to investigate              |
| UUIDs and raw status enums lead the task table           | Readable locations, localized state/next-step meaning, technical disclosure | Routine decisions should not require database knowledge           |
| Recent terminal history can displace older unknown tasks | Server query selects nonterminal work and prioritizes uncertainty           | Unknown physical outcomes must remain visible                     |
| Overview has no bounded-coverage warning                 | Explicit collection-limit warning and projection timestamp                  | A partial overview cannot assert warehouse-wide absence of faults |

Remaining limitations: existing deeper pages are still broad evidence views;
manual/help, exact aggregate
inventory visibility, and reducing unused topology data in the reused query are
follow-up S2 slices. Read-model queries are separate observations, not an atomic
warehouse snapshot or command precondition.

## Task queue/detail slice

Read-only `/api/v1/operations/tasks` and `/:taskId` require `operations.view`
and current warehouse scope. The BFF and SSR use existing session authorization.
Source/destination, assigned equipment, inventory/load location, and outbound
allocation/order lineage are scoped; inconsistent lineage fails closed. Missing
and outside-scope details share 404 semantics. Queue ordering uses immutable
creation time plus task UUID, preserving PostgreSQL microseconds in an opaque
cursor bound to warehouse and view. It is observation pagination, not a snapshot:
status changes require refresh. A warehouse/view change remounts queue state.

Home links to task detail. Detail shows readable work origin, allocated quantity
(not the whole outbound load quantity), recorded route, open alarm, and scoped
history links. `audit.view` gates links without expanding `operations.view` into
audit access. Assignment is not physical position; recorded routes are not live
availability. No command timeline is invented: full lifecycle controls remain S4.

| Before                                            | After                                                                | Why                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Home tasks lead to a broad technical projection   | Dedicated readable task context                                      | Operators can investigate the selected work                      |
| Fixed bounded task list                           | Active/all keyset queue with explicit refresh semantics              | Older work remains reachable without claiming an atomic snapshot |
| Task/order/load facts must be correlated manually | Persisted receipt/order, allocation quantity, load and alarm context | Preserve accountable warehouse meaning                           |
| Raw identifiers dominate                          | Human context first; recorded route IDs under keyboard disclosure    | Reduce routine technical burden without hiding evidence          |

Self-review found and fixed invalid calendar cursor handling, ambiguous query
arrays, and inconsistent receipt/load lineage. Verification covers API/BFF
permission and validation, PostgreSQL microsecond pagination and cross-warehouse
rejection, protected SSR, production browser navigation, audit links, language,
theme, mobile reflow, and axe accessibility. The existing legacy-only 15 lint
warnings remain; no checks were disabled. Remaining S2 work: inventory workspace,
Live View/readable topology, and manual/contextual help.

## Inventory visibility slice acceptance and decision

Medium-risk read-model/UI change under the existing S2 plan; no new ADR or
permission model is needed. First ship `/operations/inventory`: warehouse-scoped
search and keyset pages with persisted stock, active reservation sum, unreserved
quantity, state, readable location/load context and receipt history. Reuse
`operations.view`; history remains gated by `audit.view`. This is not allocation
authorization, stock adjustment, warehouse-wide totals, or physical observation.
Never treat load's received quantity as current inventory balance. Quarantined or
reserved inventory must not appear allocatable. Search/cursor are bounded and
bound to warehouse/query. Test partial reservations, quarantined inventory,
cross-warehouse lineage, pagination, unavailable/empty states and authenticated
bilingual mobile accessibility. Full load/location workspaces remain subsequent
S2 slices.

## Inventory implementation and review

Inventory search uses parameterized literal case-insensitive substring matching
for SKU, external load ID and location (not SQL wildcard expansion). UUID keyset
pagination is bound to warehouse and normalized search, with a 50-row default and
100-row maximum. Inventory and load location joins both enforce warehouse scope.
Active reservations are summed in the same SQL statement as each stock balance;
released/consumed allocations do not count. Unreserved available-state stock is
`max(0, balance - active reservations)` only for `available` inventory, otherwise
zero. It is not allocation authorization or physical truth. Separate pages can
observe mutations; refresh restarts traversal and resets loaded state.

The existing outbound allocator currently considers available inventory state
and active reservation quantity; subsequent execution validates configured
location/topology/equipment. This read slice does not silently change allocation
or claim that its residual quantity proves movement safety. Blocked/disabled
locations, load-location disagreement and over-reservation display a review
warning. Missing/foreign load lineage is excluded, not replaced with fabricated
data. No global stock totals or unit-of-measure conversion is introduced.

| Before                                             | After                                                           | Why                                                    |
| -------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Inventory is a bounded diagnostic table            | Dedicated searchable paginated workspace                        | Find older stock without reading code or raw IDs       |
| Stock quantity appears without reservation context | Balance, active reservations and residual quantity are separate | Partial allocation must not make all stock appear free |
| Inventory identity is detached from receipt/load   | Readable load/location/receipt context and gated evidence link  | Operators can trace the stock origin                   |
| Primary navigation puts Tasks before Home          | Home, Tasks, Inventory precede warehouse diagnostics            | Preserve the system-first daily-work hierarchy         |

Review scope is read authorization and warehouse isolation, not new identity or
mutation enforcement. API/BFF guard tests, malformed-query tests, PostgreSQL
partial-reservation/quarantine/pagination/foreign-lineage checks and production
browser keyboard search, empty state, warehouse switching, locale/theme and axe
mobile reflow cover this slice. Full Loads/Locations workspaces, outbound order
history from stock and inventory adjustments remain unshipped.
