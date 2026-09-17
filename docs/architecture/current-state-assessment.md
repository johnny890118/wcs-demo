# Current Architecture Assessment

Assessment date: 2026-09-17. Baseline commit: `24a2782`.

## Classification legend

- **Verified fact**: observed in tracked code or command output.
- **Interpretation**: conclusion supported by multiple facts.
- **Assumption**: working hypothesis requiring stakeholder or runtime validation.
- **Suspected defect**: code behavior likely violates its apparent intent; reproduce before fixing.

## Verified facts

- One private Next.js Pages Router application uses JavaScript, Tailwind 3, Sass, Chart.js, NextAuth 4, Axios, and Headless UI. The baseline was upgraded in place to Next.js 16.3 and React 19.3 after discovery; see ADR 0003.
- There are three pages: dispatch/map (`/`), dashboard (`/fdp`), and engineering controls (`/engineeringMode`); two API routes are `/api` and `/api/auth/[...nextauth]`.
- No NestJS service, PostgreSQL schema, ORM, migrations, persistence, Docker, CI, unit/integration/E2E test framework, i18n system, light theme, observability, audit store, or equipment adapter exists.
- Warehouse and task state live in React component state. A timer advances a single vehicle through an in-memory path.
- `components/path.js` contains an A\*-like routing implementation coupled to React setters and numeric map codes.
- `components/map.js` (6,558 lines) and `components/mapPerfect.js` (4,138 lines) contain large inline SVG/rendering implementations with duplicated simulation logic.
- Dashboard values were generated with `Math.random()`/Faker and were not derived from warehouse state. They are now deterministic display fixtures pending real projections.
- The `/api` route accepts any POST body and echoes it. It rejects GET, while engineering mode polls it with GET every second.
- Discovery found credentials hard-coded in the NextAuth route and `.env` tracked. The credentials were removed, `.env` was untracked, and the legacy control endpoint now requires a server session and fails closed while no adapter exists. Full RBAC is still absent.
- The Next.js 14 production build succeeded after dependency installation with six hook warnings. The Next.js 16 baseline also builds; React 19 diagnostics expose 15 warnings in the legacy map/task state machine.
- Discovery found 25 dependency vulnerabilities (3 critical, 12 high, 8 moderate, 2 low), 14 in production. After ADR 0003 and lockfile remediation, the audit reports no known findings.
- The UI is almost entirely hard-coded Traditional Chinese, always dark, and uses numerous unlabeled controls, mouse-only interactions, color-dependent states, and motion without a reduced-motion policy.

## Interpretation

This is a visual proof of concept with useful behavioral clues—map topology, simple routing, inbound/outbound intent, and engineering-control vocabulary—but no trustworthy backend execution model. The most valuable migration strategy is to preserve and characterize scenarios while moving state and decisions into a tested domain/application core. The current UI cannot be used as an equipment-control security boundary.

## Suspected defects to reproduce and protect with regression tests

1. Engineering mode repeatedly GETs an endpoint that always returns `405`, so its equipment list cannot load.
2. Both inbound and outbound completion checks contain mismatched `JSON.stringify(...)` parentheses, comparing a boolean string instead of positions.
3. JavaScript bounds expressions such as `0 <= x < 9` do not perform mathematical chained comparison and can accept invalid coordinates.
4. A\* open/closed sets store object identities, so semantically identical nodes are not deduplicated; path cost updates appear ineffective.
5. Inbound chooses the first `trigger === ""` cell without first proving it is a valid, reachable storage location.
6. Direct mutation of copied arrays and effect dependency omissions can produce stale or repeated task transitions.
7. Engineering "emergency stop" is a normal unauthenticated echo request, despite UI wording implying a safety-critical action.

## Security and operational risk

The repository is safe only as a disconnected prototype. Do not publish it or connect it to physical equipment until credentials are removed, dependencies are remediated, API authorization and validation exist, high-risk actions are redesigned, and the equipment port enforces command/result semantics.

## Legacy assets to retain during migration

- Warehouse map visual references and topology hypotheses
- Inbound/outbound demo intent and task-list UI concepts
- A\* behavior as characterization input, not as trusted production routing
- Engineering-control vocabulary as research prompts, not executable requirements
