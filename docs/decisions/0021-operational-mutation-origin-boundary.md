# ADR 0021 — Operational mutation origin boundary

Status: Accepted

## Context

The custom Next.js BFF endpoints for inbound, outbound, execution, alarm
acknowledgement, and recovery authorize the restored operator session and the
Nest API revalidates permission plus warehouse scope. They previously relied on
the session cookie's `SameSite` behavior for cross-site request protection.

Cookie policy is useful defense in depth but is not a complete mutation
contract. Browser behavior, same-site sibling origins, and future separation of
the public website from the operational application must not decide which origin
may submit warehouse commands.

## Decision

- Every custom browser-facing operational mutation requires an exact `Origin`
  match with the origin of `NEXTAUTH_URL` before session resolution or command
  validation.
- Missing, malformed, credential-bearing, or foreign origins fail closed with a
  generic `403 ORIGIN_FORBIDDEN` response.
- `NEXTAUTH_URL` is the operational authentication/application origin.
  `PUBLIC_SITE_URL` is not accepted for mutations merely because the two values
  currently share an origin. A future `www`/`app` split therefore preserves this
  boundary without rewriting command routes.
- NextAuth-owned mutation routes keep their framework CSRF handling. The Public
  Demo carrier route retains its separate configured-public-origin contract.
- Non-browser integrations call the authenticated Nest API through dedicated
  service identities and adapters. They do not emulate browser session cookies
  or weaken this BFF origin check.

## Consequences

Cross-origin form/fetch attempts cannot reach session restoration or operational
command forwarding, while normal same-origin browser flows remain unchanged.
The origin check complements session, effective permission, warehouse scope,
confirmation, and API service authentication; it replaces none of them.

Requests from scripts or tests to the browser BFF must supply the configured
application origin. A client that can steal both a session cookie and execute on
the trusted application origin remains outside this control and requires the
existing XSS/CSP, session-revocation, and deployment protections.
