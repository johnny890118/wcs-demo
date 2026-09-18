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
