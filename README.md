# Smart Warehouse Platform

Smart Warehouse Platform is evolving from a legacy visual prototype into a hardware-independent warehouse management, control, and simulation product. The source is private and proprietary.

The current UI demonstrates early dispatch, map, dashboard, and engineering-control concepts. It is not yet approved for public deployment or connection to physical equipment. See the [current-state assessment](docs/architecture/current-state-assessment.md) and [roadmap](docs/project/roadmap.md) before extending it.

## Local development

Requirements: Node.js 22, npm, and Docker Desktop (for the PostgreSQL verification gate).

```bash
cp .env.example .env
# Replace every placeholder in .env with local-only values.
npm ci
npm run dev
```

Open <http://localhost:3000>.

The new product entry is available at `/platform`. The session-protected operations overview is at `/operations`, with focused read-only projections at `/operations/projections`; the original `/`, `/fdp`, and `/engineeringMode` routes remain migration references rather than target architecture.

### API and database

The M2 API requires PostgreSQL and never synchronizes schemas implicitly. After setting `DATABASE_URL`, `API_SERVICE_ID`, a strong `API_SERVICE_TOKEN`, and the least-privilege comma-separated `API_SERVICE_PERMISSIONS` in the local `.env`:

```bash
npm run db:migrate
npm run db:seed:demo
npm run dev:api
```

The API listens on <http://127.0.0.1:3001> by default. Liveness is exposed at `/api/v1/health/live`; readiness additionally verifies PostgreSQL at `/api/v1/health/ready`. Inbound mutations require both a bearer service token and an `Idempotency-Key` header.

The first vertical slice accepts inbound receipts at `POST /api/v1/inbound-receipts` and executes their queued transport task through the deterministic simulator at `POST /api/v1/transport-tasks/:taskId/execute`. Inventory becomes available only after unloading and the final database transaction succeed.

The M4 outbound flow accepts authenticated, idempotent allocation requests at `POST /api/v1/outbound-orders`. It reserves persisted SKU quantities transactionally, validates an available destination with the `outbound.stage` capability, creates outbound-owned transport tasks, and records outbox/audit evidence. `POST /api/v1/outbound-transport-tasks/:taskId/execute` drives deterministic equipment movement and confirms shipping plus inventory consumption atomically; failures after dispatch remain `unknown` for reconciliation.

Assigned or in-progress transport tasks support explicit fault handling through `POST /api/v1/transport-tasks/:taskId/faults`. The resulting persisted alarm must be acknowledged at `POST /api/v1/alarms/:alarmId/acknowledge` before `POST /api/v1/alarms/:alarmId/recover` can either resume the interrupted task or release it back to the queue for reassignment. Equipment-command/persistence disagreements are marked `unknown` for reconciliation; acknowledgement alone never clears a fault.

Every protected API declares one required service permission and denies access when the authenticated service identity lacks it. Fault injection and recovery also require an exact `confirmedAction` plus a bounded `confirmationReason`; the reason is persisted in outbox/audit evidence with the resulting transition.

Demo transactional data can be cleared only when both the command switch and an in-database `deployment_mode=demo` marker agree:

```bash
ALLOW_DEMO_RESET=true npm run db:reset:demo
```

The reset command is intentionally unavailable for unmarked production databases.

## Verification

```bash
npm run verify
```

The repository gate checks formatting, secret hygiene, high/critical production dependency findings, lint, strict TypeScript, unit/API tests, real PostgreSQL migrations and integration tests in an ephemeral container, a production web build, and authenticated Chromium E2E accessibility/responsive scenarios. Install the Playwright Chromium runtime once with `npx playwright install chromium` before running the local gate; CI installs it automatically. Current gaps remain visible in the [verification strategy](docs/engineering/verification-strategy.md).

## Documentation

- [Product definition](docs/product/product-definition-v1.md)
- [Domain and system boundaries](docs/domain/system-boundaries-v1.md)
- [Target architecture](docs/architecture/target-architecture-v1.md)
- [Roadmap](docs/project/roadmap.md)
- [Agent guide](AGENTS.md)
- [Git and progress persistence policy](docs/engineering/git-progress-policy.md)

Public contact for the future product surface: [johnny0929560027@gmail.com](mailto:johnny0929560027@gmail.com).
