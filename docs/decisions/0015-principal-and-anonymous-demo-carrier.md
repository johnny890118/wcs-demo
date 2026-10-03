# ADR 0015 — Principal semantics and anonymous-demo carrier

Status: Accepted

S3 supersession: ADR 0023 pauses browser issuance and authorization of existing
carriers until isolated persisted provisioning/access exist. Carrier cryptography
remains a characterized primitive, not an active public-demo authorization path.

## Context

S1 established effective permissions and warehouse scopes, but the access
contract still treated every interactive subject as the same kind of user.
Public Demo must work without a login while remaining an explicitly authorized,
simulation-only context. Service-to-service commands also require an accountable
identity that cannot be replaced by a browser-supplied operator header.

The complete demo-session lifecycle, persistence, quotas, reset ownership, and
expiry cleanup belong to S3. S1 needs a small security boundary that later work
can extend without treating anonymous access as an authentication bypass.

## Decision

- Use three principal kinds: `human`, `anonymous_demo`, and `service`.
  Authorization continues to use effective permissions, not role or principal
  kind branches. Principal kind controls identity/session validation and audit
  attribution only.
- Human and anonymous-demo principals use the operational access contract.
  Anonymous-demo access must include a server-issued session UUID and expiry;
  human access must not carry demo-session scope.
- A Public Demo session is represented by an opaque, HMAC-SHA-256 signed,
  HttpOnly, SameSite=Strict carrier. Its payload contains only version,
  audience, session UUID, issue time, and expiry. Permissions and warehouse
  scope are re-derived from server configuration after verification and are
  never accepted from the carrier.
- Issue the carrier only when the server-owned deployment profile is
  `public_demo` and equipment source is `simulation`, and only for an exact
  configured-origin POST. The default lifetime is 30 minutes and deployment
  validation bounds it to 5–120 minutes.
- The Web/BFF validates the carrier before forwarding an anonymous operational
  context. The API revalidates principal kind, permission, warehouse membership,
  session UUID, and unexpired session scope on every protected request. The API
  continues to authenticate its BFF/service caller separately.
- Service callers have a configured `API_SERVICE_ID` and known service
  permissions. The API attaches that principal only after constant-time token
  authentication. Service-only actions use this identity rather than an
  `X-Operator-Id` value.
- Audit actor types are `user`, `anonymous_demo`, `service`, and `system`.
  Interactive command evidence maps human principals to `user` and anonymous
  demo principals to `anonymous_demo`; service-only actions use `service`.

## Consequences

Public Demo has a no-login authorization carrier, but it is not yet a complete
public-demo product flow. There is no persisted session row, quota, reset
ownership, revocation list, abuse protection beyond the existing HTTP controls,
or replay workspace lifecycle in this slice. Those remain S3 concerns.

The signed carrier is deliberately replaceable by a persisted session lookup.
Its stable session UUID and forwarded scope provide that migration seam. A
carrier secret must be independent of NextAuth and contain at least 32 bytes.
Changing it invalidates all outstanding anonymous sessions.

The API still accepts user context only from an authenticated service caller;
network and credential separation remain required in deployment. Direct browser
access to the API is not a supported trust boundary.
