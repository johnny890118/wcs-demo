# ADR 0001: Modular Monolith in a TypeScript Monorepo

- Status: Accepted
- Date: 2026-09-17

## Context

The prototype has no backend boundary. The product needs WMS Lite, WCS, simulation, identity, audit, and integrations, but no evidence yet requires independently operated microservices.

## Decision

Adopt a TypeScript monorepo with separately deployable Next.js web and NestJS API applications. Implement backend capabilities as modules inside one transactional monolith. Keep domain packages framework-independent and enforce imports through public module interfaces.

## Consequences

- Positive: simpler transactions, local development, testing, observability, and on-prem deployment.
- Positive: explicit module seams preserve a later extraction path.
- Negative: module boundaries require lint/tests because process isolation does not enforce them.
- Deferred: distributed services, Kubernetes, and cross-service messaging until measured operational need exists.
