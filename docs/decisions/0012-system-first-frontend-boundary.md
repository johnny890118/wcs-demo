# ADR 0012 — System-first frontend boundary

Status: Accepted

## Context

The single Next.js deployment contains a canonical root, authenticated operations, BFF/API routes, and legacy migration fixtures. Interrupted frontend work had also started expanding the root, shared public footer, About/Contact navigation, and public discovery behavior as if a marketing website were the current product priority. That direction conflicted with the current system-first product decision and made the supported operational path less explicit.

Authentication also relied on the framework default sign-in page. Operations pages encoded their own redirect targets, and callback validation needed one fail-closed contract before the product could safely expose a first-party login surface.

## Decision

- Keep one Next.js application and one deployment. Deployment separation into future `www` and `app` origins remains an option, not a current requirement.
- Use `/` as a thin, indexable system entry containing product identity, one short positioning sentence, and one primary action. Resolve that action server-side to `/login` for an anonymous visitor and `/operations` for an authenticated operator.
- Use `/login` as the first-party bilingual, responsive, accessible sign-in surface. Mark it `noindex, nofollow` in both page metadata and response headers.
- Accept callback destinations only when they resolve to the configured application origin and an internal `/operations` path. Reject external, malformed, credential-bearing, legacy, login, and paused marketing destinations to `/operations`.
- Require all supported `/operations/*` pages to redirect anonymous requests through `/login` with a validated internal destination. Keep operations, BFF/API, and legacy responses out of search indexes.
- Treat `/legacy/*` only as migration reference and remove it from active product navigation. Retain `/about` and `/contact` source pages for possible future reuse, but do not expose them in the active header, operations navigation, root content, or current sitemap.
- Centralize the five route classifications and noindex header sources. Public pages receive locale/theme providers without a client session provider; login and operations receive session plus locale/theme providers; legacy receives the session provider needed by the existing prototype.
- Keep the legacy global styles temporarily because the Pages Router build currently imports them from `_app.js`. CSS payload isolation is a later migration concern and must not block the authentication boundary.

## Consequences

The active product path now describes one system rather than a marketing site: root, login, and authenticated operations. Callback handling has a narrow allowlist, private surfaces have a testable indexing contract, and legacy/marketing links no longer compete with operational navigation.

The provider split reduces unnecessary auth context on public pages but does not produce complete bundle or stylesheet isolation. About and Contact remain directly addressable and indexable if independently discovered; they are intentionally dormant rather than deleted. A future public website can reuse or replace them without changing the operational route contract.
