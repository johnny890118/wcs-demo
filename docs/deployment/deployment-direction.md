# Deployment Direction

## Local and enterprise

The target deliverable is OCI-compatible web and API images plus Docker Compose for web, API, PostgreSQL, and simulator. The same images must run on a developer machine, customer VM, on-prem server, edge server, or private cloud. Critical execution must remain available during WAN loss when deployed inside the warehouse network.

## Public demo

Preferred initial composition is Vercel (web), Render (API/simulator), and Supabase (PostgreSQL), subject to current plan limits and terms at deployment time. Provider SDKs must remain outside domain/application packages. No deployment occurs until the security baseline and deterministic scenario gates pass.

## Data operations

- Versioned migrations with deployment-time backup checks
- Environment/tenant-isolated demo seed and reset
- Documented backup, restore, retention, and recovery-point/recovery-time objectives before commercial use
- Health endpoints distinguish liveness, readiness, database, and equipment-adapter status

Kubernetes is intentionally deferred.

## Production-like Compose runbook

The checked-in composition is an on-premises/VM baseline, not a public-internet approval. Both published ports bind to loopback unless an operator explicitly changes the bind addresses.

1. Copy `infra/compose.env.example` to a private environment file outside version control.
2. Replace every placeholder password/token/secret. Assign the API only the permissions required for that deployment.
3. Validate with `docker compose --env-file <private-env> -f infra/compose.production.yml config --quiet`.
4. Build with `docker compose --env-file <private-env> -f infra/compose.production.yml build`.
5. Start with `docker compose --env-file <private-env> -f infra/compose.production.yml up -d --wait postgres api web`.
6. Confirm API readiness at `/api/v1/health/ready` and the web entry at `/platform`.

The one-shot `migrate` service must complete successfully before the API starts. The API and web images run as non-root users with read-only root filesystems and explicit temporary mounts. PostgreSQL data lives in the named `postgres-data` volume. Run the `demo-seed` profile only in an environment intentionally designated for deterministic demonstrations:

```bash
docker compose \
  --env-file <private-env> \
  -f infra/compose.production.yml \
  --profile demo-seed run --rm seed-demo
```

Image base references are digest-pinned. Application dependencies are locked by `package-lock.json`; changing either input requires rebuilding and rerunning the deployment smoke gate.

## Backup and restore

Backups use PostgreSQL custom format, owner/ACL-neutral output, restrictive creation permissions, and a SHA-256 checksum. Choose a private host directory and a unique backup name; the backup job refuses to overwrite an existing dump.

```bash
BACKUP_DIRECTORY=/secure/warehouse-backups \
BACKUP_NAME=warehouse-2026-09-19T0200Z \
docker compose --env-file <private-env> -f infra/compose.production.yml \
  --profile data-ops run --rm backup-database
```

Restore is intentionally separate and destructive to the selected target database. Create or select the exact restore target, verify that it is not the live production database unless a reviewed incident procedure requires it, and provide the exact confirmation string. The job verifies the checksum before invoking `pg_restore --clean --if-exists --exit-on-error`.

```bash
BACKUP_DIRECTORY=/secure/warehouse-backups \
BACKUP_NAME=warehouse-2026-09-19T0200Z \
RESTORE_CONFIRMATION=RESTORE:warehouse-2026-09-19T0200Z \
RESTORE_DATABASE_URL='postgresql://.../warehouse_restore?sslmode=require' \
docker compose --env-file <private-env> -f infra/compose.production.yml \
  --profile data-ops run --rm restore-database
```

After restore, verify `schema_migrations`, `platform_metadata`, task/inventory counts, and a representative operational projection before declaring recovery successful. The CI deployment smoke gate performs this exercise against an isolated database on every change.
