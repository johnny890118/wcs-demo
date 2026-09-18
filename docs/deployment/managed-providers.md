# Managed provider deployment

Validated against official provider documentation on 2026-09-18. These adapters preserve the same web/API/PostgreSQL boundaries as Compose and do not add provider SDKs to domain or application packages.

## Topology

- Vercel runs the Next.js web/BFF surface from the repository root using `vercel.json`.
- Render builds the API from `infra/docker/api.Dockerfile` using `render.yaml`, runs the migration bundle before each deploy, and checks `/api/v1/health/ready` before routing traffic.
- Supabase supplies PostgreSQL through `DATABASE_URL`; the application continues to use the standard `pg` adapter and checked-in migration runner.

## Required secrets and environment

Configure secrets in provider dashboards, never in `vercel.json`, `render.yaml`, Git, build arguments, or client-visible variables.

Vercel requires `NEXTAUTH_URL`, `PUBLIC_SITE_URL`, `NEXTAUTH_SECRET`, `DEMO_ADMIN_USERNAME`, `DEMO_ADMIN_PASSWORD`, `INTERNAL_API_BASE_URL`, and the same `API_SERVICE_TOKEN` assigned to the web-to-API service identity. Set `PUBLIC_SITE_URL` to the canonical public HTTPS origin and `INTERNAL_API_BASE_URL` to the Render API HTTPS origin. Keep every variable server-only (no `NEXT_PUBLIC_` prefix).

Render prompts for `DATABASE_URL` and `API_SERVICE_TOKEN` because the Blueprint marks them `sync: false`. Existing Blueprint services do not automatically receive newly added `sync: false` variables; add them manually when updating an existing service. Keep the API permission list least-privileged for the deployed web capabilities.

Before configuring either provider, validate an equivalent local environment without printing values:

```bash
DEPLOYMENT_ENV=production npm run deployment:validate -- api
DEPLOYMENT_ENV=production npm run deployment:validate -- web
```

## Supabase connection choice

Use the direct connection for the one-shot migration command and backup/restore operations. For the persistent Render API, use a direct connection when network support permits it; otherwise use the session pooler. Do not use transaction mode for this API because the existing PostgreSQL adapter is a persistent process with its own pool. Require TLS in the provider connection string and restrict network access to the API environment where the selected plan supports it.

Apply only the repository migration runner. Do not separately translate the same schema into Supabase CLI migrations, because two migration histories would create drift. After deploy, confirm all records in `schema_migrations` and then check API readiness.

## Release gate

1. Run repository `npm run verify` and the deployment smoke job at the exact commit.
2. Validate production environment variables for both targets.
3. Take and verify a database backup before applying migrations to an existing environment.
4. Deploy the API and require a successful pre-deploy migration plus readiness check.
5. Deploy the web surface with the final API origin plus matching production `NEXTAUTH_URL` and `PUBLIC_SITE_URL` origins.
6. Run the three deterministic operator scenarios against the candidate environment without enabling physical equipment adapters.
7. Confirm `/robots.txt`, `/sitemap.xml`, public canonical metadata, and `X-Robots-Tag: noindex, nofollow` on operations/API routes before allowing indexing.

## Runtime security controls

Set `API_RATE_LIMIT_MAX` and `API_RATE_LIMIT_WINDOW_MS` to a measured traffic envelope. The built-in limiter is a bounded, per-instance safeguard; configure the provider edge or gateway with a shared limit before scaling the API horizontally. Set `API_TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies between the client and API (`1` for the current Render adapter, `0` for direct or Compose access). Never enable unconditional proxy trust.

The API refuses to start when its database URL, service identity, token, or permission list is absent, placeholder-like, weak, duplicated, or unknown. Validate provider configuration with `DEPLOYMENT_ENV=production npm run deployment:validate -- api` before rollout and confirm that failed validation output never echoes credential values.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Render Blueprint specification](https://render.com/docs/blueprint-spec), [Render health checks](https://render.com/docs/health-checks), and [Supabase Postgres connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres).
