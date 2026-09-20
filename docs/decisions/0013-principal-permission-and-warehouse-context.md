# ADR 0013 — Principal, permission, and warehouse context

Status: Accepted

## Context

The supported web application currently treats any valid NextAuth session as an
operator and forwards a separate service credential to the NestJS API. The API
authorizes that service identity, but it cannot distinguish the human principal,
their effective permissions, or the warehouse in which they are acting. Read
projections consequently select the most recent active topology and operational
rows without an explicit warehouse boundary.

S1 requires a production-capable access foundation without prematurely choosing
an OIDC vendor or building a password system. The existing credentials login must
remain usable for the managed demo, but it must be an adapter rather than the
authorization model.

## Decision

- Define a provider-neutral operational access context containing a stable
  principal subject and display name, identity-provider key, effective user
  permissions, allowed warehouse scopes, and one explicit current warehouse.
- Keep effective user permissions in the application contract. They are distinct
  from `API_SERVICE_PERMISSIONS`, even when a web-to-API service and a user need
  similarly named capabilities.
- Treat role names as optional adapter-side permission bundles. Server, BFF, and
  API authorization checks evaluate permissions and warehouse scope directly and
  never branch on a role name.
- Retain the current credentials provider only as the `demo-credentials` identity
  adapter. It issues the same provider-neutral access context that a future OIDC
  adapter must issue. Demo warehouse identity is adapter configuration, not core
  warehouse truth.
- Sign the access context into the NextAuth JWT. The BFF validates it before every
  operational request and forwards the minimum principal, permission, current
  warehouse, and allowed-scope claims across the already authenticated service
  boundary.
- The NestJS API treats forwarded user claims as trusted only after the service
  token succeeds. Protected operational endpoints then revalidate the required
  user permission and that the current warehouse belongs to the forwarded scope.
- Repository queries and commands receive the explicit current warehouse and
  constrain persisted reads and referenced warehouse resources accordingly.
- Cross-warehouse access requires a future explicit aggregation capability. An
  empty or omitted warehouse context always fails closed.

## Consequences

An authenticated session alone no longer implies operational authority. OIDC can
replace the demo identity adapter without changing downstream authorization, and
the same user can eventually hold different permissions across configured
warehouse scopes.

The web-to-API service credential still authenticates the BFF as a service. It
does not grant a human permission or warehouse scope. Any additional trusted
service caller will need an explicit non-human access contract rather than
forging forwarded user headers.

This decision does not yet implement warehouse selection, user administration,
OIDC discovery, cross-warehouse aggregation, or persistent role assignment.
Those capabilities build on this contract in later S1 slices.
