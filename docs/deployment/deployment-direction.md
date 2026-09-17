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
