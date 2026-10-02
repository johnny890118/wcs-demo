# Security Baseline

## Current disposition

The supported product entry and authenticated, simulator-backed operations console are deployed as the managed private demo described in the release evidence. The legacy prototype routes remain outside the supported operations boundary and are not approved for product use or physical equipment connectivity. Supported NestJS endpoints require constant-time bearer authentication plus an explicitly configured service-permission allowlist. High-risk fault and recovery commands additionally require named confirmation with a recorded reason. API startup fails closed for missing, weak, placeholder, duplicate, or unknown security configuration. Physical-equipment connectivity remains gated by the M6 commissioning controls and explicit site authorization.

## Runtime boundary

- The API applies no-store, deny-framing, no-sniff, no-referrer, and restrictive content-security response headers. The web shell applies browser security headers globally and sends `noindex, nofollow` for operations and API routes.
- A bounded fixed-window limiter provides per-client, in-process defense in depth. Its client map is capped at 10,000 entries and stale entries are pruned. Multi-instance deployments must additionally enforce a shared or edge rate limit because local counters do not coordinate across replicas.
- `API_TRUST_PROXY_HOPS` is an exact trusted-hop count, not a blanket proxy trust switch. Keep it at `0` for direct/Compose access and set it only to the verified provider hop count (Render currently uses `1`). Incorrect proxy trust can allow client-IP spoofing and defeat per-client limits.
- Runtime credentials come only from environment or provider secret stores. Placeholder credentials are accepted in committed examples but rejected when the API boots.
- Operational access is an effective-permission plus warehouse-scope contract. A multi-warehouse context change accepts only an in-scope target UUID through the CSRF-protected signed-session update path, persists source/destination-scoped audit evidence before changing the claim, and leaves the prior context active on failure.
- Human grants are resolved from active, time-bounded persisted assignments by stable identity-provider/subject after identity proof. Each warehouse assignment owns its effective permissions; the BFF needs the dedicated `access.resolve` service permission, and no browser or environment value grants human authorization.
- Human JWTs reference a persisted, bounded session that is revalidated against current principal, assignment, expiry, and revocation state on restore. Unknown registry state removes operational authority; sign-out and administrative revocation record session-linked evidence.
- The demo credentials adapter compares fixed-size digests, sends only a keyed identifier fingerprint and proof outcome to the API, and uses PostgreSQL-backed failure windows shared across web instances. Failed and throttled attempts are durable security evidence without claiming an unproven actor or warehouse. Login denial remains generic.
- Sign-out revocation retries bounded transient delivery failures and emits structured retry/recovered/exhausted outcomes without session identifiers. This is observable but not a durable queue; production identity enablement requires provider-specific sign-out and alert policy.
- The persisted per-identifier throttle is not an edge abuse-control substitute. Production identity enablement requires trusted ingress rate controls plus an approved security-event retention/export policy so attempts spread across arbitrary identifiers cannot create unbounded evidence growth.
- Every SWP-owned PostgreSQL table has row-level security enabled without browser/provider-role policies. Non-owner roles are deny-by-default even when table privileges are granted; the dedicated table-owning API connection remains the only data path and continues to enforce effective permission plus warehouse scope.

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
