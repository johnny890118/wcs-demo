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

## M7 equipment-observation extension — 2026-09-19

- Fresh isolated PostgreSQL storage applied all eight migrations through `0008_location_topology_bindings.sql`.
- The deterministic demo seed created three warehouse-consistent location-to-node bindings.
- Restarting the API after the opt-in seed loaded the persisted simulator descriptor and published `AMR-01|deterministic-simulator|1|connected` rather than relying on seeded assignment or browser state.
- API readiness and the `/platform` web entry both passed from the production images.
- The isolated containers, network, and test-only PostgreSQL volume were removed after verification.

The CI deployment smoke now repeats this startup sequence, asserts eight migration records, three bindings, and a connected simulator observation, then continues through the existing backup/restore gate.

## S1A access-context delivery and profile safety — 2026-09-29

- API compilation was narrowed to the API entry graph, so Web-only NextAuth
  declaration augmentation no longer breaks the API OCI builder.
- Lifecycle environment, deployment profile, and equipment source are explicit
  in both API and Web containers. API startup validates the shared fail-closed
  compatibility contract.
- Public Demo plus Simulation is accepted; Public Demo plus Hardware is rejected
  by both runtime and deployment-environment tests.
- Fresh API and Web images built successfully. A fresh isolated Compose stack
  applied all nine migrations, reported API readiness, and served the supported
  `/` Web entry through the updated healthcheck.
- Demo seed/restart produced the connected deterministic simulator observation;
  three location bindings and nine migrations were verified.
- Custom-format backup/checksum and isolated restore passed, including the nine
  migration records and demo marker. Containers, network, and database volume
  were removed after the exercise.
