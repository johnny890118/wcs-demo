# Security Baseline

## Current disposition

The supported product entry and authenticated, simulator-backed operations console are deployed as the managed private demo described in the release evidence. The legacy prototype routes remain outside the supported operations boundary and are not approved for product use or physical equipment connectivity. Supported NestJS endpoints require constant-time bearer authentication plus an explicitly configured service-permission allowlist. High-risk fault and recovery commands additionally require named confirmation with a recorded reason. API startup fails closed for missing, weak, placeholder, duplicate, or unknown security configuration. Physical-equipment connectivity remains gated by the M6 commissioning controls and explicit site authorization.

## Runtime boundary

- S3 anonymous admission reserves capacity in a separate PostgreSQL control
  ledger; provisioning/expired rows never grant access and expiry never releases
  capacity. Issuance and old-carrier browser authorization remain unavailable
  until isolated provisioning, persisted authorization and cleanup are complete.
  Trusted service-only anonymous forwarded context is compatibility, not a
  finished public isolation contract (ADR 0023). No public-demo enablement here.
  ADR 0025 adds an unwired trusted inactive-reference cleanup repository: database
  leases/fencing, parent locks, no active/observed/assigned/operational resources,
  archived ownership evidence and verified removal precede atomic capacity
  release. This is not active simulator drain or enabled public cleanup.
  ADR 0026 separately bounds committed new reservations in one persisted global
  fixed-window budget. Capacity release does not reset it, failures roll it back
  and replay consumes no new credit. Fixed-window boundary bursts, HTTP attempts,
  per-client fairness and scenario/storage quotas remain separate activation gates.
  ADR 0027's fresh simulator factory isolates local virtual state/time/cache and
  owned observations with defensive copies/bounded work; it is not authority.
  It remains unwired until durable worker ownership/fencing, persisted request
  authorization and active-runtime cleanup exist. Local stop is not task
  completion or deletion authorization. Duplicate command observations now read
  current state instead of retimestamping historical cached transitions.
  ADR 0028 adds unwired persisted exclusive simulator ownership: DB-time leases
  capped by reservation expiry, token-fenced scoped/fresh observations and unknown
  takeover that cannot pretend to restore idle. Initialization/activation require
  non-future observations within the shared evidence window. Task/load receipt
  ownership is checked even if a foreign record points at local locations.
  Private singleton registration excludes all owned workspaces; inactive cleanup
  refuses any preserved ownership generation. Publication fencing is not command
  authorization, drained active cleanup or restart restoration; public access
  remains closed.

- The API applies no-store, deny-framing, no-sniff, no-referrer, and restrictive content-security response headers. The web shell applies browser security headers globally and sends `noindex, nofollow` for operations and API routes.
- A bounded fixed-window limiter provides per-client, in-process defense in depth. Its client map is capped at 10,000 entries and stale entries are pruned. Multi-instance deployments must additionally enforce a shared or edge rate limit because local counters do not coordinate across replicas.
- `API_TRUST_PROXY_HOPS` is an exact trusted-hop count, not a blanket proxy trust switch. Keep it at `0` for direct/Compose access and set it only to the verified provider hop count (Render currently uses `1`). Incorrect proxy trust can allow client-IP spoofing and defeat per-client limits.
- Runtime credentials come only from environment or provider secret stores. Placeholder credentials are accepted in committed examples but rejected when the API boots.
- Operational access is an effective-permission plus warehouse-scope contract. A multi-warehouse context change accepts only an in-scope target UUID through the CSRF-protected signed-session update path, persists source/destination-scoped audit evidence before changing the claim, and leaves the prior context active on failure.
- Human grants are resolved from active, time-bounded persisted assignments by stable identity-provider/subject after identity proof. Each warehouse assignment owns its effective permissions; the BFF needs the dedicated `access.resolve` service permission, and no browser or environment value grants human authorization.
- Human JWTs reference a persisted, bounded session. Strict restores (including mutations, warehouse updates and NextAuth-owned endpoints) revalidate principal, assignments, expiry and revocation; required validation failure removes authority. Explicit GET-only Operations SSR/BFF reads may reuse encrypted claims for `HUMAN_SESSION_READ_FRESHNESS_SECONDS` (default 3600, range 0–3600). This does not renew session expiry or the validation timestamp. Without event-driven invalidation, old read authority and registry-outage detection may persist until the earlier of window deadline and expiry; set 0 when immediate read invalidation is required. Every destination API still checks permission/current warehouse. Sign-out and administrative revocation remain durable and attributable. See ADR 0022.
- The demo credentials adapter compares fixed-size digests, sends only a keyed identifier fingerprint and proof outcome to the API, and uses PostgreSQL-backed failure windows shared across web instances. Failed and throttled attempts are durable security evidence without claiming an unproven actor or warehouse. Login denial remains generic.
- Sign-out revocation retries bounded transient delivery failures and emits structured retry/recovered/exhausted outcomes without session identifiers. This is observable but not a durable queue; production identity enablement requires provider-specific sign-out and alert policy.
- The persisted per-identifier throttle is not an edge abuse-control substitute. Production identity enablement requires trusted ingress rate controls plus an approved security-event retention/export policy so attempts spread across arbitrary identifiers cannot create unbounded evidence growth.
- Every SWP-owned PostgreSQL table has row-level security enabled without browser/provider-role policies. Non-owner roles are deny-by-default even when table privileges are granted; the dedicated table-owning API connection remains the only data path and continues to enforce effective permission plus warehouse scope.
- Every custom browser-facing operational mutation rejects missing, malformed, or foreign `Origin` values before session resolution. The trusted origin is derived from `NEXTAUTH_URL`, not `PUBLIC_SITE_URL`, so a future public-site/application split does not grant the marketing origin command authority.

## Required baseline

- Server-side authentication and deny-by-default authorization on every protected API.
- RBAC permissions separated for view, operate, acknowledge, recover, configure, and administer.
- Step-up confirmation and append-only audit for high-risk equipment and configuration actions.
- Schema validation, bounded payloads, safe errors, rate limits where appropriate, secure cookies/headers, and CSRF protection for cookie-authenticated mutations.
- Secrets supplied at runtime, never in source/client bundles/logs; rotate any committed secret before reuse.
- Equipment networks isolated from public/web clients; adapter credentials have least privilege.
- Timeouts and lost connections create uncertain/unknown outcomes requiring reconciliation.
- Automated dependency and secret scanning in CI.
- Threat modeling uses OT availability/safety constraints from NIST SP 800-82 and zones/conduits concepts from ISA/IEC 62443 without claiming certification.

## High-risk actions

Emergency stop, resume, manual movement, fault clear, task override, demo reset, configuration, user, and permission changes require explicit authorization and audit. A browser request alone is never proof that physical action succeeded.
