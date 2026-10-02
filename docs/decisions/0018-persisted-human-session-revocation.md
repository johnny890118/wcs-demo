# ADR 0018 — Persisted human session revocation

Status: Accepted

## Context

ADR 0017 moved human permissions and warehouse assignments out of deployment
environment variables, but the signed NextAuth JWT still held an authorization
snapshot until refresh or reauthentication. Disabling a principal, revoking an
assignment, or changing warehouse-local permissions therefore could not
invalidate an already-issued browser session promptly.

Production identity remains provider-replaceable and OIDC-first. This change
must establish a durable session and revocation seam without introducing a
custom password store, role administration, or the separate anonymous Public
Demo lifecycle.

## Decision

- Persist each issued human session by an unguessable UUID, principal,
  server-selected current warehouse, issue time, bounded expiry, and optional
  revocation time/reason. The default lifetime is eight hours and deployments
  may configure 15 minutes through 24 hours with
  `HUMAN_SESSION_TTL_SECONDS`.
- Create the session, resolve the current assignment, and write
  `access.login_succeeded` evidence in one database transaction. Audit evidence
  links to the session UUID and contains no credential or token material.
- Keep the session UUID only inside the encrypted, HttpOnly NextAuth JWT. Do not
  expose it through the browser session object.
- On every human JWT restore, call the service-authenticated session validator.
  It checks the session is not expired or revoked, re-reads the active
  principal and assignments, revalidates the selected warehouse, and returns
  current warehouse-local permissions. Missing, ambiguous, unavailable, or
  malformed state removes operational authority from the token.
- Persist the selected current warehouse when the validated JWT changes
  context. Revocation evidence therefore uses the last validated warehouse.
- Support explicit `sign_out` and `administrative` revocation. The first
  revocation writes one attributable `access.logout` or
  `access.session_revoked` event; repeated revocation is idempotent.
- Treat registry/API outage as unknown authorization state and fail closed. A
  transient outage can require the operator to authenticate again after service
  recovery; availability never extends authority.

## Consequences

Assignment and principal changes now affect restored sessions without waiting
for JWT expiry, and operators or authorized services can revoke a session before
its maximum lifetime. The internal BFF/API boundary continues to require the
dedicated `access.resolve` service permission.

NextAuth's sign-out event calls the durable revocation endpoint before clearing
the local cookie. [ADR 0019](0019-persisted-login-protection-and-revocation-delivery.md)
adds bounded retry and structured delivery outcomes while retaining the explicit
non-durable-delivery limitation. Administrative session UI, OIDC integration,
access review, deployment-specific security-event retention/export, and
anonymous-demo session persistence remain separate work.
