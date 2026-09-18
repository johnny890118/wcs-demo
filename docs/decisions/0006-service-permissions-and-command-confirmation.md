# ADR 0006 — Service permissions and command confirmation

Status: Accepted

## Context

A bearer token proves a service identity but does not establish that the identity may perform every warehouse operation. Recovery commands can change physical execution state, so a generic authenticated request is insufficient evidence of deliberate authorization.

## Decision

- Every protected NestJS endpoint declares exactly one permission from the bounded service-permission catalog.
- Runtime service identities receive a least-privilege comma-separated allowlist through `API_SERVICE_PERMISSIONS`; an absent permission is denied by default.
- Authentication remains constant-time and precedes authorization so invalid credentials do not reveal permission assignments.
- Fault injection and recovery require an exact action-specific `confirmedAction` and a non-empty bounded `confirmationReason`.
- Confirmation reasons are written into the same transactional outbox and append-only audit evidence as the resulting task/alarm transition.
- Alarm acknowledgement is separately authorized but does not clear equipment faults and is not treated as recovery confirmation.

## Consequences

Deployments must provision both a service token and its explicit permissions. Adding an endpoint without permission metadata fails closed. The current single service identity is suitable for the modular-monolith phase; user-level roles and external identity-provider claims can later map onto the same permission vocabulary without changing domain services.
