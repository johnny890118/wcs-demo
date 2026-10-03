# ADR 0022 — Bounded human read-session freshness

Status: Accepted for implementation; supersedes ADR 0018's per-restore rule only
for explicitly opted-in read-only Operations requests.

## Context

Every human JWT restore currently calls persisted validation before an independent
projection request. Owner authorizes a configurable 60-minute freshness design
for ordinary navigation, provided expiry, immediate mutation/switch validation,
API permission/scope and revocation capabilities remain. Without push invalidation,
immediate read revocation and avoiding all validate round trips cannot both hold.

## Decision

- Keep strict persisted validation by default, including all unclassified callers,
  NextAuth-owned session requests, updates, and supported mutations. Only explicit
  read-only Operations SSR/BFF wrappers opt into bounded reuse through isolated
  server request context; browser headers or query parameters cannot select policy.
- `HUMAN_SESSION_READ_FRESHNESS_SECONDS` defaults to 3600, accepts integers 0–3600,
  and 0 restores strict per-read behavior. It is not the session TTL.
- After login/full persisted validation, record server validation time in encrypted
  JWT, never the client session object. Reuse only structurally valid human access
  and persisted session reference before both expiry and freshness deadline.
  Missing/malformed/future timestamp or exact boundary triggers validation. Reuse
  does not extend last validation time or persisted expiry.
- Warehouse updates and mutations ignore read freshness. Required validation
  failure removes authority; no stale fallback. Destination API requests still
  authenticate the caller and enforce effective permission/current warehouse.
- Principal disable, assignment revoke, permission change and session revoke remain
  durable operations, but old read authority can survive until the earlier of
  freshness deadline and expiry. There is no event-driven invalidation yet. Strict
  paths observe the change immediately. Registry outage inside an existing read
  window is similarly not detected until a strict validation is required.
- Instrument privacy-safe timing; distinguish client navigation total, session
  validation, projection HTTP, API handler and accumulated query time. Do not log
  token/session/credential material, SQL parameters/text or resource-bearing URLs.

## Consequences

This is an explicit change to read revocation latency, not an unchanged immediate
revocation guarantee. Deployments needing immediate read invalidation set 0 until
a separate event-driven/revocation-version mechanism is verified. Simulation and
hardware retain the same strict command authorization and independent safety path.
Local authenticated production-build evidence is not true deployed p50/p95.
Future high-risk routes inherit strict behavior unless separately reviewed.

See [execution plan](../project/s2-session-freshness-plan.md).
