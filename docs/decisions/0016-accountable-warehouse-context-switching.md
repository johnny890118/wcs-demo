# ADR 0016 — Accountable warehouse context switching

Status: Accepted

## Context

ADR 0013 requires one explicit current warehouse on every operational request
and reserves cross-warehouse aggregation for a separate capability. A principal
may nevertheless be assigned more than one warehouse, so the product needs a
bounded way to change context without accepting permissions or scopes from the
browser, weakening SSR/BFF/API checks, or losing evidence of the transition.

The current identity adapter stores access in a signed NextAuth JWT. Production
OIDC and persisted role/grant administration are not yet enabled, so this slice
must preserve that replacement seam rather than make the demo role or
environment configuration an authorization boundary.

## Decision

- Show a warehouse selector only when the signed principal has more than one
  authorized warehouse scope. A single-scope session continues to display
  static context.
- Treat selection as an authenticated session-context command, not a permission
  grant. The browser sends only the target warehouse UUID through NextAuth's
  CSRF-protected session-update flow. The JWT callback validates that UUID
  against the already signed scopes and never accepts browser-supplied
  permissions, warehouse metadata, or scope arrays.
- Before changing the signed current-warehouse claim, call the authenticated
  internal API with the existing access context. The API independently
  revalidates the service identity, `operations.view`, the source context, and
  membership of the target warehouse in the forwarded scope. Any validation,
  persistence, or API failure leaves the prior JWT context active.
- Persist the transition atomically as two audit events with one correlation:
  `access_context.warehouse_left` in the source warehouse and
  `access_context.warehouse_entered` in the destination warehouse. Each event
  identifies only its own `Warehouse` resource and contains no cross-warehouse
  details. This makes evidence visible to warehouse-scoped auditors without
  leaking another warehouse through an evidence payload.
- After the API confirms the evidence, update only `currentWarehouseId` and
  refresh the current route so SSR projections are fetched in the new context.
  Every subsequent BFF/API request continues to enforce permission plus that
  explicit current warehouse.
- Human warehouse scopes and their warehouse-local effective permissions are
  supplied by the persisted assignment resolver defined in ADR 0017. The
  credentials adapter proves only the demo identity and never supplies grants.

## Consequences

Context switching fails closed when the API or audit store is unavailable. It
does not permit cross-warehouse reads, aggregate dashboards, scope mutation, or
role administration. The session remains provider-neutral below the auth
adapter, so a future OIDC adapter can issue the same access contract.

Two scoped audit rows represent one transition. Their shared correlation ID is
the global investigation seam; each warehouse-local projection remains isolated.
The existing demo reset still truncates these rows, so reset-governance evidence
and retention hardening remain S3 and production-operability work.

Persisted assignment administration, access review, and session revocation must
still be completed before production identity is enabled.
