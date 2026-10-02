# ADR 0020 — Deny direct platform table access

Status: Accepted

## Context

SWP deploys its PostgreSQL schema through the trusted API connection. The
managed PostgreSQL provider also exposes a Data API and reported platform tables
in the `public` schema without row-level security. Browser and integration
clients must never become an alternate path around the authorized backend, even
if a provider client credential is later introduced or disclosed.

Warehouse rows cannot be made safe with a generic end-user row policy because
the authoritative access context is resolved and revalidated by SWP, not by a
database-provider JWT. Adding permissive provider-specific policies would create
a second authorization model and violate the application boundary.

## Decision

- Enable PostgreSQL row-level security on every SWP-owned table, including
  migration metadata, with no policies for non-owner roles.
- Keep the API and migration runner on the dedicated table-owning server
  connection. Table owners continue to use PostgreSQL's normal owner bypass;
  SWP does not use `FORCE ROW LEVEL SECURITY` for this deployment model.
- Do not put database provider keys or direct table access in the browser.
  Browser traffic remains `browser -> authorized BFF/API -> database`.
- Verify the contract in PostgreSQL integration tests by granting a probe role
  table privileges and proving that it still observes no rows and cannot insert.
- Future production database roles must preserve the same boundary. If a
  non-owner API role is introduced, it requires an explicit least-privilege
  server policy and its own migration/release verification; it must not reuse a
  browser-facing provider role.

## Consequences

Provider `anon`/`authenticated` roles and other granted non-owner roles receive
deny-by-default behavior instead of relying only on the absence of a client key.
The existing API, migrations, seed/reset jobs, backup/restore flow, and worker
continue through the table owner and remain subject to application authorization.

This is defense in depth, not tenant authorization inside PostgreSQL. Warehouse
scope, effective permission, actor attribution, and command safety remain API
responsibilities. Database owner credentials therefore remain high-impact
secrets that require server-only storage, rotation, and deployment-specific
access review.
