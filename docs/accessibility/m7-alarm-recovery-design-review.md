# M7 alarm recovery design review

Review date: 2026-09-20. Scope: the accountable alarm acknowledgement and recovery workflow at `/operations/alarms`.

The UI consumes persisted alarms and task projections. It does not clear alarms, infer recovery safety, or mutate equipment directly; authenticated commands cross the application service and equipment port, and failed persistence after an equipment command retains the existing unknown-outcome reconciliation behavior.

| Before                                                               | After                                                                                                                                        | Why                                                                             |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Alarm facts were read-only in the product console                    | A protected workflow selects active or acknowledged alarms and exposes only state-valid next actions                                         | Operators can complete the supported recovery path without the legacy workspace |
| Acknowledgement accepted no explicit operator evidence               | `acknowledge_alarm`, an 8–500 character reason, a checkbox, and the authenticated operator identity are required and audited                 | Acknowledgement means reviewed evidence, not a casual dismissal                 |
| Recovery existed only as direct API and deterministic scenario calls | The UI separates acknowledgement from recovery and requires a deliberate `resume` or `release` choice                                        | The consequential equipment/task transition has a stable decision boundary      |
| Resume and release implications were hidden in request payloads      | Human-readable strategy choices, resolution, confirmation statement, alarm/task/equipment evidence, and resulting task status remain visible | Operators understand what changes before and after authorization                |
| Browser code could have guessed whether an alarm was recoverable     | Available actions derive from persisted alarm status; backend concurrency, blocking-alarm, task, and equipment checks remain authoritative   | Stale UI cannot bypass safety or state invariants                               |
| Recovery completion could be mistaken for physical certainty         | The success state reports the persisted task transition and links to projections; backend failures still reconcile to `unknown`              | The UI never turns an unresolved divergence into success                        |
| Seven mobile navigation items became too narrow                      | Navigation labels stay single-line inside a horizontally scrollable labelled region                                                          | Touch labels remain legible without page-level overflow                         |
| No alarm-workflow browser gate existed                               | Chromium executes acknowledge → release, runs axe after completion, and verifies 390 × 844 reflow                                            | The critical workflow and responsive semantics are executable                   |

Manual review covered the active-alarm desktop layout and 390 × 844 mobile layout. Evidence precedes the action panel in reading order, long identifiers wrap inside their card, navigation remains single-line, and the page has no horizontal overflow.

Motion decision: alarm response is frequent and safety-sensitive, so the workflow uses immediate state changes, native controls, disabled states, and live status text without decorative animation. The shared 160 ms press feedback is removed under reduced-motion preferences.
