# Production-like Compose verification

Date: 2026-09-19

The M5 deployment foundation was exercised locally with Docker Compose, not only parsed as configuration.

## Evidence

- `npm run build:api` produced ESM runtime bundles for the API, migration, seed, and guarded reset entrypoints.
- `docker compose ... config --quiet` accepted `infra/compose.production.yml` with the documented example environment contract.
- Both digest-pinned multi-stage images built successfully from the lockfile.
- A fresh isolated stack created PostgreSQL storage, applied all six migrations, started the API only after migration success, and started the web service only after API readiness.
- `/api/v1/health/live` returned `{"status":"ok"}`.
- `/api/v1/health/ready` returned `{"status":"ready"}`.
- `/platform` returned HTTP 200 from the standalone web image.
- The opt-in demo seed completed and the database reported six migration records plus `deployment_mode=demo`.
- Runtime inspection reported `user=warehouse`, `readonly=true`, `health=healthy` for API and `user=nextjs`, `readonly=true`, `health=healthy` for web.
- A custom-format dump and SHA-256 manifest were generated without overwriting existing files, restored into an isolated `warehouse_restore` database only after exact confirmation, and verified to contain all six migrations, the `demo` marker, and the seeded equipment descriptor.
- The isolated smoke containers, network, and test-only PostgreSQL volume were removed after verification.

The same composition is exercised by the `deployment-smoke` CI job on every main-branch push and pull request.
