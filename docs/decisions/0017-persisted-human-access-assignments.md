# ADR 0017 — Persisted human access assignments

Status: Accepted

## Context

The demo credentials adapter proves identity with a configured username and
password, but it previously also derived human permissions and warehouse scope
from environment variables. That makes grants deployment configuration, cannot
represent different permissions per warehouse, and is not an acceptable seam
for later OIDC identity.

Production identity remains OIDC-first and provider-replaceable. This decision
must establish a durable authorization boundary without building a production
password system, role-administration UI, or provider-specific core model.

## Decision

- Persist human principals by the stable `(identity_provider, subject)` pair.
  Display names are presentation data and never serve as identity keys.
- Persist warehouse assignments separately. Every assignment has its own
  validated effective permission set, active/revoked state, validity interval,
  and optional default-context marker. Role templates may later compose these
  permissions, but authorization never branches on a role name.
- Require exactly one active default when a principal has multiple active
  assignments; a sole active assignment is unambiguous without one. Missing,
  expired, disabled, malformed, or ambiguous assignments fail closed.
- After the credentials adapter proves the demo identity, the trusted BFF calls
  a service-authenticated resolver protected by the dedicated `access.resolve`
  service permission. The resolver returns the provider-neutral operational
  access contract; no human permission or warehouse grant comes from the
  browser or web-process environment.
- Store each warehouse scope's effective permissions in the signed access
  contract. The top-level effective permission set must exactly match the
  current warehouse. Context switching changes both current warehouse and the
  effective permission set to the already signed target assignment.
- Record a successful resolution as `access.login_succeeded` evidence in the
  default warehouse, within the same transaction that reads and validates the
  assignments. Evidence contains no credential, token, or cross-warehouse
  assignment details.
- Keep the demo username/password as a temporary identity-proof adapter only.
  The deterministic demo seed owns the demo principal and assignment. Existing
  databases explicitly marked as demo receive a guarded migration backfill;
  production databases do not receive a demo principal automatically.

## Consequences

Human grants now survive process and deployment changes and can differ by
warehouse. OIDC can later supply the same provider/subject identity reference
without changing authorization contracts. The BFF requires `access.resolve` in
addition to the least-privilege service permissions needed by its operations.

This slice did not itself provide assignment administration, role-template
management, active-session persistence, revocation, failed-login security
events, or expiry/sign-out evidence. ADR 0018 subsequently adds persisted human
sessions, bounded expiry, assignment revalidation, and explicit revocation;
administration and failed-login controls remain S1 work.
