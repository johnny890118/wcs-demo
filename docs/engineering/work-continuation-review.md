# C — Job continuity and human meaning review

2026-10-05. Delivered at `178ff9e6ea0f377f6e214f36c9c9fa0ee1941268`.

## Design and security review

| Before                                                       | After                                                                                         | Why                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Creation continuation lives only in React state              | Same-tab owned Work link plus server-qualified exact resume URL                               | Reload/navigation must not require duplicate creation or remembered IDs        |
| Work shows status/counts without a concise attention summary | Root-wide evidence describes incomplete/unknown/blocked/waiting/running/terminal observations | Explain the next investigation without fabricating business stages or progress |
| Resume could accidentally use a sibling task response        | URL Task equality and exact persisted Work/flow origin before equipment reads                 | A correct-looking sibling is not the selected task                             |
| An observation snapshot could remain actionable indefinitely | Shared 30-second received-observation bound ages on a one-second UI clock                     | UI may downgrade, never grant a safety lease; backend rechecks commands        |
| Confirmation could transfer to another selected device       | Equipment/reason changes clear confirmation                                                   | Confirmation belongs to the reviewed command target/context                    |
| Failed response invites immediate retry                      | Attempt locks submission and retains owned evidence links                                     | Unknown outcome is not failure-to-execute or permission to blindly resend      |

Independent read-only security review required the identity, observation-age and
confirmation corrections above. Re-review found no remaining security blocker.
No mutation endpoint, persisted-session freshness, permission, warehouse scope,
audit or safety checks were relaxed. UI updates can lag the observation deadline
by about one second; backend is always the command authority.

## Journey and evidence limits

Creation → Work → queued task review → reload clears reason/confirmation → select
qualified equipment → explicit confirmation → existing execution endpoint → same
Work's persisted outcome. No sidebar/re-search/ID entry/Browser Back required.
Root counts cover the whole qualified job, not only the loaded task page; terminal
tasks do not substitute business state, inventory evidence or physical clearance.
Blocked/unknown/nonqueued tasks do not receive a new normal-execution control.

Resume browser journey covers 1440/768/390 widths, both locales/themes, Axe and
no horizontal overflow. This is deterministic production-build browser evidence,
not physical tablet/hardware or production mutation evidence. Mobile dark review
shows readable reference, movement, risk, form and owned returns without overlap.
Command confirmation is deliberately explicit, not animated or preselected.

Manual revision 2026-10-05.1 regenerates the existing bilingual PDFs. All five
English/four Chinese rendered pages inspected without clipping or glyph defects.
Accessible web manual remains primary; PDFs do not claim PDF/UA conformance.

Exact-HEAD CI `37323480352` passed verify and deployment-smoke; Vercel Ready
and Render Live identify the full checkpoint SHA. Managed smoke passed after
deployment. Authenticated production Task → Work → queued resume → reload →
owned Work return passed, with cleared reason/confirmation and no device
preselection. No production command was sent. One pre-existing Chrome Tasks 504
recovered after reload; its cause and authenticated p50/p95 remain unproven.
Working tree was clean before D.

Complete final gate passed 585 fast tests, 86 real PostgreSQL tests, 40 production-build
browser tests and production public-demo denial harness; separate API build
passed. HTTP200 unknown/malformed/wrong Task/equipment outcome cases and pending
outcome feedback are included in this gate (29 C focused tests).
Dependencies report zero production vulnerabilities, secret/type/format/manual/
icon checks pass, and the 15 existing legacy lint warnings remain unchanged.
Initial Docker-not-running and test-locator failures were repaired, not skipped.
