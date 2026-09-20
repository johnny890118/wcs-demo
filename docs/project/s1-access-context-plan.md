# S1 Accountable Access and Warehouse Context Plan

Status: Active

Risk: High — authentication, authorization, tenant-like warehouse isolation, and
operator attribution are load-bearing security boundaries.

Governing decision: [ADR 0013](../decisions/0013-principal-permission-and-warehouse-context.md)

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

## Slice 2 — Command boundary

- [ ] Apply the same permission and warehouse-scope contract to inbound,
      outbound, transport execution, alarm acknowledgement, and recovery.
- [ ] Constrain referenced locations, tasks, equipment, inventory, and alarms to
      the current warehouse before mutation.
- [ ] Preserve principal and warehouse context in audit evidence.

## Slice 3 — Session lifecycle and role-aware experience

- [ ] Add explicit access-denied and expired-session behavior.
- [ ] Filter navigation and permitted actions from effective permissions while
      keeping server enforcement authoritative.
- [ ] Add current-warehouse selection only when more than one authorized scope is
      configured, with accountable context-change evidence.
- [ ] Replace environment-derived demo grants with persistent assignments before
      production identity is enabled.

## Verification and review

- Focused unit and HTTP tests run during each slice.
- `npm run verify` is required before every S1 checkpoint commit.
- Runtime verification covers supported anonymous and authenticated flows in both
  locales, all theme preferences, keyboard navigation, responsive layouts, and
  permission/scope denial.
- A fresh-context security review is required before S1 is declared complete.
- Each independently verified slice is committed and pushed separately; CI must
  pass before the next checkpoint is treated as stable.
