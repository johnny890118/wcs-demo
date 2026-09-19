# Managed demo release evidence

Release gate completed on 2026-09-19 for the simulator-only public demo. No physical adapter was enabled, no provider payment method was added, and no shared Git history was rewritten.

## Candidate and providers

- Functional release commit: `4affd3f8d7e953b6cb80076c6763c14e4d1b0ce7`.
- Canonical web origin: [https://wcs-demo.vercel.app](https://wcs-demo.vercel.app).
- Rotated-session Vercel production deployment: `dpl_6SWzRWzBCa2Ao8nEGYU1mmjhATFC` (`READY`).
- Render service: `srv-dan23mjtqb8s73aac4lg`, [https://warehouse-platform-api.onrender.com](https://warehouse-platform-api.onrender.com).
- Render deployment: `dep-dan2r28jo6nc7395i2ig`, exact functional release commit, `live`.
- Supabase project: `ctjhsbddbejqijsrpbom` in `ap-northeast-1`; six repository migrations and the deterministic demo marker were verified.

Provider credentials and database passwords remain in provider secret stores or macOS Keychain. They are absent from this document, Git, and client-visible variables. A diagnostic header capture exposed one temporary application session cookie during validation; `NEXTAUTH_SECRET` was rotated immediately, a replacement production deployment invalidated the session, and subsequent checks used header allowlists. The web and API production environment validators passed with the deployed configuration.

## Automated gates

- GitHub Actions run [35427084549](https://github.com/johnny890118/wcs-demo/actions/runs/35427084549) completed successfully at the functional release commit. Both `verify` and `deployment-smoke` passed.
- Local `npm run verify` passed after the managed-provider fixes: formatting, secret scan, production dependency audit, lint with zero errors, strict typecheck, 120 fast tests, seven PostgreSQL integration tests, and six Chromium E2E checks.
- The Chromium suite covered keyboard skip navigation, axe analysis, 200%-equivalent reflow, focused projection semantics, inbound completion, outbound completion, and acknowledged fault release/reassignment.
- The official Render Blueprint validator accepted `render.yaml`; the production image was also built and started locally with the provider-assigned port, migration-first startup script, and remote TLS database connection before rollout.

## Live security and discovery checks

- Public `/`, `/platform`, `/about`, `/contact`, `/robots.txt`, and `/sitemap.xml` returned `200` from the canonical origin.
- `/platform` emitted canonical and Open Graph URLs for the canonical HTTPS origin.
- Unauthenticated `/operations` redirected to sign-in, the web BFF rejected unauthenticated projection access, and the Render API rejected a missing service token with `401`.
- An authenticated `demo-operator` session received `200` from `/operations`, `/operations/projections`, and both BFF projection endpoints after the final secret rotation.
- Public and private surfaces emitted CSP, HSTS, permissions/referrer policies, deny-framing, and no-sniff headers. Operations and API responses emitted `X-Robots-Tag: noindex, nofollow`.
- The free Render service's documented idle wake-up is bounded by a 55-second internal request timeout under Vercel's 60-second Hobby function limit.

## Managed-environment scenarios

The release gate executed deterministic flows against the deployed Render API and Supabase database, then observed the results through the live API and Vercel focused projections:

- Inbound task `3dc1859e-a12a-450e-84cc-c19d0c61b113` completed and persisted available inventory.
- Outbound order `82ff1033-2a7b-485b-b28a-e3982acec79a` completed its transport task and left quantity `7` available for the scenario SKU.
- Faulted task `ca4a1a75-5136-46c7-8983-97401dc2022c` produced alarm `c5621f4a-4dde-416b-960b-a98c087e46e0`; acknowledgement plus confirmed release returned the task to `queued` and cleared the alarm.
- Database evidence reported six migrations, completed inbound/outbound records, the queued released task, the cleared alarm, and five related recovery audit records. Live projections reported the same three task outcomes and cleared alarm.

## Backup evidence

A PostgreSQL 17 custom-format, owner/ACL-neutral post-scenario backup is stored outside the repository at `/Users/caizhengxuan/.codex/backups/wcs-demo/2026-09-19/managed-demo-20260919-144542.dump` with restrictive `0600` permissions. Its SHA-256 manifest was verified twice, and `pg_restore --list` reported 495 archive entries. Destructive restore was not performed against the live project; the isolated restore exercise remains covered by the successful `deployment-smoke` job.
