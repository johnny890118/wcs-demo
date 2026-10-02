# S1 Accountable Access and Warehouse Context Plan

Status: Active

Risk: High — authentication, authorization, tenant-like warehouse isolation, and
operator attribution are load-bearing security boundaries.

Governing decisions: [ADR 0013](../decisions/0013-principal-permission-and-warehouse-context.md), [ADR 0014](../decisions/0014-deployment-profile-and-equipment-source-safety.md), [ADR 0015](../decisions/0015-principal-and-anonymous-demo-carrier.md), [ADR 0016](../decisions/0016-accountable-warehouse-context-switching.md), [ADR 0017](../decisions/0017-persisted-human-access-assignments.md), [ADR 0018](../decisions/0018-persisted-human-session-revocation.md), [ADR 0019](../decisions/0019-persisted-login-protection-and-revocation-delivery.md), [ADR 0020](../decisions/0020-deny-direct-platform-table-access.md), and [ADR 0021](../decisions/0021-operational-mutation-origin-boundary.md)

## Slice A — Delivery and deployment-safety contract

- [x] Keep the API image compilation boundary independent of Web-only NextAuth
      session augmentation and restore OCI image builds.
- [x] Replace the `/platform` Compose health dependency with the supported root.
- [x] Separate lifecycle environment, deployment profile, and equipment source.
- [x] Validate profile/source compatibility in deployment validation, API
      startup, and server-issued operational runtime context.
- [x] Prove Public Demo plus Simulation is accepted and Public Demo plus Hardware
      fails closed.

## Slice 1 — Read boundary and visible context

- [x] Add provider-neutral principal, effective-permission, and warehouse-scope
      contracts with fail-closed validation.
- [x] Adapt the demo credentials provider to issue the contract through the
      signed session without making demo roles enforcement logic.
- [x] Require and forward access context in operations summary and detail BFF
      reads. Audit scoping follows with the command/audit persistence slice because
      historical audit rows do not yet retain warehouse identity.
- [x] Revalidate user permission plus warehouse scope in the API and constrain
      those projections to the current warehouse.
- [x] Surface principal, warehouse, environment, equipment source, and projection
      freshness in the operations shell.
- [x] Prove anonymous, malformed, insufficient-permission, out-of-scope, and
      successful access paths.

## Slice B — Command boundary

- [x] Apply the same permission and warehouse-scope contract to inbound,
      outbound, transport execution, alarm acknowledgement, and recovery.
- [x] Constrain referenced locations, tasks, equipment, inventory, and alarms to
      the current warehouse before mutation.
- [x] Preserve principal and warehouse context in audit evidence.

## Slice C — Principal and anonymous-demo access contract

- [x] Define human, anonymous-demo, and service principal semantics without role
      names as authorization branches.
- [x] Add a server-issued anonymous-demo carrier and demo-session scope contract
      without implementing the complete S3 persistence/TTL lifecycle.
- [x] Revalidate the combined warehouse and optional demo-session scope at
      backend boundaries and preserve accountable actor semantics.

## Slice D — Session lifecycle and role-aware experience

- [x] Add explicit access-denied and expired anonymous-demo session behavior.
- [x] Filter navigation and permitted actions from effective permissions while
      keeping server enforcement authoritative.
- [x] Add current-warehouse selection only when more than one authorized scope is
      configured, with accountable context-change evidence.
- [x] Replace environment-derived demo grants with persistent assignments before
      production identity is enabled.
- [x] Persist active human sessions, revalidate current assignments during JWT
      restore, and add explicit sign-out/administrative revocation evidence.
- [x] Add failed-login evidence and throttling plus revocation delivery/retry
      observability before production identity is enabled.
- [x] Deny direct non-owner access to platform tables while preserving the
      authorized API as the only operational data path.
- [x] Require the configured authentication/application origin on every custom
      browser-facing operational mutation.

## Verification and review

- Focused unit and HTTP tests run during each slice.
- `npm run verify` is required before every S1 checkpoint commit.
- Runtime verification covers supported anonymous and authenticated flows in both
  locales, all theme preferences, keyboard navigation, responsive layouts, and
  permission/scope denial.
- A fresh-context security review is required before S1 is declared complete.
- Each independently verified slice is committed and pushed separately; CI must
  pass before the next checkpoint is treated as stable.
