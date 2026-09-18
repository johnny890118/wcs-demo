# Smart Warehouse Platform Agent Guide

## Mission

Evolve this legacy prototype into a hardware-independent, commercially evolvable Smart Warehouse Platform. Preserve working behavior until it is characterized; migrate incrementally rather than rewriting blindly.

## Repository map

- `pages/`, `components/`, `styles/`: legacy Next.js prototype. Treat as a migration source, not the target architecture.
- `src/domain/`, `src/application/`, `src/infrastructure/`: new framework-independent core and adapters. Dependencies point inward; infrastructure implements application ports.
- `tests/`: Vitest safety, domain, and simulator tests.
- `docs/product/`: product vision, users, scope, and success criteria.
- `docs/domain/`: shared warehouse language and bounded-context rules.
- `docs/architecture/`: verified current state and target architecture.
- `docs/decisions/`: accepted and proposed architecture decision records (ADRs).
- `docs/project/`: roadmap, gaps, risks, and milestone status.
- `docs/engineering/`: verification and development workflows.
- `docs/security/`, `docs/accessibility/`, `docs/deployment/`: cross-cutting requirements.

## Critical constraints

- Read `docs/product/decision-principles.md` before domain, architecture, routing, equipment, or warehouse UI work.
- One core must support different customer warehouses through validated configuration and persisted models; never fork or hard-code the core around the legacy demo layout.
- React, SVG, Canvas, coordinates, and visual path arrays are presentation data, never warehouse or routing truth.
- Derive routes from versioned topology plus runtime constraints. Treat fixed paths only as named scenario fixtures.
- Select equipment by capabilities/contracts and availability, not branches on equipment type or vendor name.
- Browser -> authorized backend -> safety validation -> equipment adapter -> equipment. Never control equipment directly from a browser.
- Domain/application code must not depend on OPC UA, MQTT, Modbus, a vendor SDK, or a cloud provider.
- Demo, simulator, and future hardware modes select adapters through configuration; do not scatter mode conditionals through the core.
- Unknown command outcome is `unknown`, never success. High-risk actions require authorization, confirmation, audit, timeout handling, and explicit feedback.
- Every hardware adapter must pass the shared conformance kit plus protocol/vendor tests. Stale or disconnected telemetry blocks new commands; acknowledgement loss uses the same command ID and unresolved divergence requires reconciliation.
- Physical commissioning requires a site-specific OT threat/risk assessment, independently authoritative safety controls, broker/network hardening, failure drills, and recorded integrator/operations/security/safety approval. Repository tests never imply safety certification.
- `zh-TW` and `en`, light and dark themes, responsive layouts, and WCAG 2.2 AA are product requirements.
- Do not add an open-source license or expose this private repository in public UI.
- Do not commit secrets or production credentials. `.env` is local-only; maintain `.env.example` with placeholders.

## Decision governance

- Owner statements are authoritative product intent and constraints, but examples and suggested implementations are hypotheses unless explicitly non-negotiable.
- Work in the order `intent -> research -> evidence -> decision -> ADR -> implementation -> verification`.
- Actively identify likely customer variations and failure modes, then add only evidence-backed extension points. Be extensible, not speculative.
- Legacy map, route, coordinate, and dispatch structures may support characterization tests but must not shape the target domain model.

## Commands

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

If the machine npm cache is not writable, use a task-local cache rather than changing global ownership:

```bash
npm_config_cache=/tmp/wcs-demo-npm-cache npm ci
```

## Verification

Run `npm run verify` before handing off a change. During migration, known gaps are tracked in `docs/project/gap-analysis.md`; do not hide failures by disabling checks or deleting tests.

## Git and progress persistence

- Create a local commit when a coherent, independently describable work unit is complete and its proportionate verification passes. Do not leave multiple verified milestones only in the working tree.
- Before committing, review `git status` and the relevant diff, run the secret scan and required tests/checks, and confirm the commit contains no credential or known broken state.
- Group commits by meaningful capability, fix, migration, infrastructure foundation, UI vertical slice, or recoverable milestone checkpoint. Do not commit every file edit or combine unrelated work merely to empty the working tree.
- Use specific, traceable messages such as `feat(wcs): add deterministic transport lifecycle`; never use vague messages such as `update`, `changes`, or `fix stuff`.
- At milestone boundaries, update the roadmap and verification evidence, commit the verified checkpoint, then continue.
- Preserve correct state over cosmetically clean history. If existing work cannot be split safely, use one clearly scoped checkpoint commit; never destructively rewrite history to manufacture a cleaner sequence.
- Local commits are authorized. A push is separate and follows the repository's established remote workflow and authorization. Never force-push, reset published history, rebase a shared branch, or delete a remote branch autonomously.

See `docs/engineering/git-progress-policy.md` for the operational checklist.

## Start here

1. `docs/product/product-definition-v1.md`
2. `docs/product/decision-principles.md`
3. `docs/domain/system-boundaries-v1.md`
4. `docs/architecture/current-state-assessment.md`
5. `docs/architecture/target-architecture-v1.md`
6. `docs/architecture/m1-m2-configurability-review.md`
7. `docs/project/roadmap.md`
8. `docs/engineering/verification-strategy.md`
9. `docs/engineering/git-progress-policy.md`
