# ADR 0030 — Reloadable Work read spine

Status: Accepted and locally verified, 2026-10-04; exact checkpoint delivery gates
follow push. See `docs/engineering/work-read-spine-review.md`.

## Intent and evidence

Owner approved Work above WCS Task and A → B → C → D before resuming S3.
Existing receipts/orders have durable warehouse-scoped identities and recorded
statuses. Outbound allocation creates multiple tasks; a completed task cannot
establish completion of its entire order. Current task detail has a resolved
origin resource but no reloadable business-work page. Existing task projection
already qualifies locations/equipment/load lineage; not all schema foreign keys
encode warehouse equality, so read joins must enforce it explicitly.

## Decision

- Work is a read composition of an existing InboundReceipt or OutboundOrder, not
  a new domain aggregate, mutable lifecycle or simulated business progress.
  Identity is flow plus persisted UUID; external reference is a display alias.
- `/operations/work/[flow]/[workId]` resolves the root on the server using the
  current authorized warehouse. Foreign/missing identities return the same 404.
  No URL warehouse or client cache is authority. Keep existing session freshness,
  permission checks, private/no-store, expiry and strict command contracts.
- API/BFF require `operations.view`; history links independently require
  `audit.view`. No role-name branches or new command permissions.
- Root status is explicitly recorded status, not inferred physical outcome.
  Show persisted outbound request SKU/quantity and warehouse-qualified destination;
  inbound content comes from receipt loads, not current inventory. Bound content
  to 50 SKU groups and flag either omitted lineage or group overflow. No current
  stock, physical outcome or complete request picture is inferred from this read.
  Qualified task status counts cover all qualifying records, not just a page;
  bounded keyset pages are bound to warehouse, flow and root identity. Counts are
  evidence coverage, not a percent-complete indicator or safety precondition.
- A read-only repeatable-read transaction keeps root/count/page internally
  consistent. Subsequent pages can observe later data; refresh starts over.
  Missing/unqualified relations are never filled by browser guesses.
- Reuse task read mapping with explicit receipt/order warehouse and allocation
  source/load-receipt lineage qualification for Work reads. Root, source,
  destination, current load/inventory locations and equipment must be scoped.
- Minimal bilingual/responsive accessible Work detail and task-origin deep link
  prove reload/direct navigation. Exact entity/Live/exception handoffs are B;
  create-to-resume and human meaning are C; operator IA consolidation is D.

## Risks and alternatives

High-risk read authorization boundary: independent review, adversarial cross-
warehouse joins/cursor tests and real PostgreSQL integration are required.
Do not replace this with filtering a bounded task queue in the browser, using
external references as identity, or a new frontend state framework. No migration,
scheduler/control expansion, marketing, public-demo enablement or S4–S7 claims.
