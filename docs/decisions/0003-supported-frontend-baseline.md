# ADR 0003: Supported Frontend Baseline Before Migration

- Status: Accepted
- Date: 2026-09-17

## Context

The legacy application used Next.js 14, React 18, old UI peers, and an abandoned Faker package. The production dependency audit reported 14 vulnerabilities, including three critical and six high. Next.js 14 is outside the framework's current support window.

## Decision

Upgrade the legacy shell in place to Next.js 16.3, React 19.3, ESLint 9, and React-19-compatible UI/chart peers before deeper migration. Replace the abandoned random-data dependency with clearly marked deterministic display fixtures. Keep Pages Router temporarily because it remains supported and an App Router rewrite provides no immediate domain-boundary value.

CI blocks high/critical production dependency findings. The initial lockfile remediation reports no known audit findings; future moderate findings remain visible and must be triaged.

## Consequences

- The public-facing framework is on an active supported release and high/critical production audit findings are removed.
- React 19 lint rules expose legacy effect-driven state-machine debt as warnings scoped to the three migration files.
- The dashboard becomes reproducible but its fixtures still are not operational truth.
- App Router adoption and Auth.js replacement remain separate, testable migrations.
