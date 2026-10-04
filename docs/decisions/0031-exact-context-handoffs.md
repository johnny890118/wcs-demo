# ADR 0031 — Exact operational context handoffs

Status: Accepted, 2026-10-04. Local verification complete; exact delivery gates pending.

## Evidence and decision

A provides warehouse-qualified receipt/order Work roots. Task detail currently
has readable load/location labels but not durable entity references. Inventory,
load and location projections support substring search and bounded pagination;
these cannot establish exact identity. Live selection is component-local and
defaults to the first equipment. Alarm entry currently opens a bounded general
list. History has exact resource filters but loses the investigating work.

B adds server-resolved exact identity and owned contextual returns, preserving
the existing operator surfaces and commands. Fixed internal URLs carry task or
entity identity, never warehouse authority or arbitrary return URLs. Every
destination independently authorizes the current warehouse and effective
permission. Context is reconstructed from persisted qualified relationships,
not browser storage, remembered IDs, label matching or the first list page.
Missing/retired/foreign relationships remain unavailable or unresolved; Live
assignment never proves observed position. History retains separate audit.view.

This is a security-sensitive read boundary and a multi-page UI change. A
persistent plan, independent review, real PostgreSQL adversarial tests and
end-to-end journey validation are required. No schema/domain lifecycle, command
authorization, session freshness, sidebar/IA, C/D or S4–S7 capabilities change.

## Acceptance

- Direct and reloaded handoffs resolve exact Work/Task/entity/Live/Exception/
  History context without substring search, a frontend cache or Browser Back.
- Foreign warehouse, malformed/ambiguous identity and mismatched relationship
  cannot broaden read scope; audit permission remains independently enforced.
- Bounded projections cannot silently substitute another target. Context and
  current observations remain distinct; disappearance has explicit feedback.
- Bilingual themes, keyboard, desktop/tablet/mobile viewport journeys and
  noindex/private response policy remain intact.
- Focused/full verification, independent security, Operator/Emil review, docs,
  checkpoint/push/exact CI/deployed runtime/clean precede C.
