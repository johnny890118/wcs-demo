# Security Baseline

## Current disposition

The legacy prototype routes remain outside the supported operations boundary and are not approved for public deployment or physical equipment connectivity. Supported NestJS endpoints require constant-time bearer authentication plus an explicitly configured service-permission allowlist. High-risk fault and recovery commands additionally require named confirmation with a recorded reason. API startup fails closed for missing, weak, placeholder, duplicate, or unknown security configuration. Public deployment still remains blocked on the remaining M5 content and release gates.

## Runtime boundary

- The API applies no-store, deny-framing, no-sniff, no-referrer, and restrictive content-security response headers. The web shell applies browser security headers globally and sends `noindex, nofollow` for operations and API routes.
- A bounded fixed-window limiter provides per-client, in-process defense in depth. Its client map is capped at 10,000 entries and stale entries are pruned. Multi-instance deployments must additionally enforce a shared or edge rate limit because local counters do not coordinate across replicas.
- `API_TRUST_PROXY_HOPS` is an exact trusted-hop count, not a blanket proxy trust switch. Keep it at `0` for direct/Compose access and set it only to the verified provider hop count (Render currently uses `1`). Incorrect proxy trust can allow client-IP spoofing and defeat per-client limits.
- Runtime credentials come only from environment or provider secret stores. Placeholder credentials are accepted in committed examples but rejected when the API boots.

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
