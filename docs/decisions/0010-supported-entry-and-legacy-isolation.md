# ADR 0010 — Supported product entry and legacy isolation

Status: Accepted

## Context

The repository now has a backend-driven operations experience for overview, topology, inbound, outbound, alarm recovery, and focused projections. The root route still opened the prototype whose map, paths, task transitions, and equipment controls are browser-local migration fixtures. Keeping that prototype at the primary product URL would misrepresent the supported architecture and let obsolete deep links remain visually indistinguishable from supported workflows.

The prototype must remain available for characterization and migration comparison until its remaining behavior is either replaced or deliberately retired. Existing bookmarks also need a deterministic transition rather than silent breakage.

## Decision

- Make `/` the canonical public product entry and keep `/operations/*` as the authenticated, supported operator experience.
- Permanently redirect the former `/platform` entry to `/` so there is one indexable canonical landing URL.
- Isolate the three prototype surfaces under `/legacy`, `/legacy/fdp`, and `/legacy/engineering-mode` without changing their internal behavior.
- Permanently redirect the former `/fdp` and `/engineeringMode` deep links to their explicit legacy destinations.
- Mark all `/legacy/*` responses `noindex, nofollow`, exclude them from the sitemap, and disallow the prefix in `robots.txt`.
- Keep links to the migration reference explicitly labelled as legacy. New product navigation must never route operational work through it.

## Consequences

The public entry now describes the supported platform instead of the browser-local prototype, while existing links continue to resolve. Search engines receive one canonical landing URL and cannot treat migration fixtures as current product surfaces. The legacy code and its known lint debt remain available for characterization, but future capability work belongs in the backend-driven operations experience.
