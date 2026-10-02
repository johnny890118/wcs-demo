# ADR 0019 — Persisted login protection and revocation delivery

Status: Accepted

## Context

The replaceable demo credentials adapter proved one configured identity, but its
login route was outside the Nest API's per-instance request limiter. A limiter in
the Next.js process would also be bypassable across serverless instances. Failed
proofs produced no durable evidence, while sign-out attempted session revocation
only once.

An unauthenticated attempt has no proven principal or warehouse. It must not be
misrepresented as an operator action in the warehouse audit projection. The
current slice must not introduce a custom production password store or guess a
customer's security-event retention obligation.

## Decision

- Compare the configured demo username and password through fixed-size SHA-256
  digests and constant-time equality. This remains a replaceable demo identity
  adapter, not the production identity design.
- Derive a keyed HMAC-SHA-256 fingerprint from the normalized attempted
  identifier and `NEXTAUTH_SECRET`. Send only the provider, opaque fingerprint,
  and proof outcome across the service-authenticated BFF/API boundary. Never
  persist or log the attempted username or password.
- Serialize decisions for one provider/fingerprint in PostgreSQL, using the
  database clock and a persisted fixed failure window. The default policy allows
  four failures, blocks on the fifth, uses a 15-minute window, and throttles for
  15 minutes. Deployments may select only bounded values through validated
  environment configuration.
- Deny an otherwise valid proof while a persisted block is active. The login UI
  receives the same generic denial for bad credentials and throttling, preventing
  account-existence or lock-state disclosure.
- Store `failed` and `throttled` evidence in the separate
  `authentication_security_events` stream with correlation, provider, opaque
  fingerprint, and timestamp. Do not inject unproven actors or warehouse scope
  into operational `audit_events`.
- Preserve login protection state and security evidence during demo transactional
  reset. No automated deletion is enabled until an approved deployment-specific
  retention and export policy exists.
- Retry sign-out revocation only for network errors, HTTP 429, and server errors,
  using a bounded attempt count and delay. Emit structured retry, recovered, or
  exhausted delivery outcomes without session identifiers or credentials.
  Terminal authorization/client failures are not retried.

## Consequences

Credential attack state is shared across web instances and survives process
restart. Failed proof evidence is durable without turning an unverified identity
into an accountable operator. Successful proof still creates the existing
session-linked `access.login_succeeded` evidence atomically with the session.

The current sign-out retry is bounded and observable but not a durable queue: a
process termination can still interrupt delivery. The persisted session expires
within its configured maximum and every restored JWT revalidates server-side.
Production OIDC enablement still requires provider-specific sign-out semantics,
alert routing, edge-level abuse controls, security-event retention/export, and
access-review policy. Per-identifier throttling deliberately does not claim to
bound attempts spread across arbitrary identifiers or the growth of retained
security evidence.
