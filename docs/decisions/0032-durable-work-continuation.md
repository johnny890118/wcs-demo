# ADR 0032 — Durable Work continuation

Status: Accepted for implementation, 2026-10-05

## Evidence and decision

A resolves persisted Work roots and bounded qualified execution; B resolves exact
task investigation. Current inbound/outbound creation panels keep job IDs and
completed-task bookkeeping only in React state. Leaving the page loses the
execution form, encouraging Browser Back or duplicate creation. Existing inbound
and outbound execution use cases accept only queued tasks; blocked/unknown work
must not be resumed as normal execution.

Add an owned resume route under the Work root, selecting one exact Task. SSR
resolves the Task's recorded origin and checks it equals the requested flow/Work
before presenting any job data or execution control. Reuse existing strict BFF
execution endpoints, confirmation and current equipment evidence. No synthetic
creation response, browser persistence, command replay or new domain lifecycle.

Creation exposes a same-tab durable Work link. Work describes recorded job status
and all qualified task counts separately. Split execution is not a percentage or
business stage; missing relationships and unknown outcomes remain explicit.
Queued qualified tasks may offer resume to transport.execute users; other states
offer exact investigation, never a retry disguised as continuation. A resume page
reload re-resolves state and clears confirmation. After any command attempt,
persisted Work/Task evidence remains the authoritative continuation.

## Boundaries and verification

Read SSR retains operations.view, warehouse qualification and private/no-store.
Execution retains immediate persisted-session validation, origin checking,
transport.execute, warehouse isolation and backend safety/state checks. UI read
state never authorizes equipment. No automatic command on GET, reload or link.
No S4 retry/reconciliation or S7 external-WMS fallback decision is introduced.

Test foreign/mismatched Work/Task/flow, permission denial, queued versus every
nonqueued state, expired/revoked session and unknown command feedback. Exercise
create → Work → exact resume → reload → confirmation → outcome → same Work,
including split jobs, both locales/themes and desktop/tablet/mobile viewports.
Run full verification/API build and independent security/UX review before delivery.
