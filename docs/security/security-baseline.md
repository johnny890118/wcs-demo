# Security Baseline

## Current disposition

The legacy prototype routes remain outside the supported operations boundary and are not approved for public deployment or physical equipment connectivity. Supported NestJS endpoints require constant-time bearer authentication plus an explicitly configured service-permission allowlist. High-risk fault and recovery commands additionally require named confirmation with a recorded reason. Public deployment still remains blocked on the M5 hardening and release gates.

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
