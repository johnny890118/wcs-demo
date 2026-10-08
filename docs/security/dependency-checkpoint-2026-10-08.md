# Dependency security checkpoint — 2026-10-08

D delivery evidence synchronization re-ran the full repository gate and exposed
two newly reported high-severity production dependency advisories. Targeted
compatible patch updates, not `npm audit fix --force`, address them:

- `sharp` 0.35.4 → 0.35.5 (`@img/sharp-libvips` artifact package 1.3.3 → 1.3.4,
  not the underlying libvips library version):
  [librsvg advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
- Transitive `source-map-js` 1.2.1 → 1.2.2:
  [indexed source-map advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

The lockfile changes only those packages and Sharp's associated platform
artifacts; no framework, UI, theme, authentication or domain behavior changes.
Sharp's optional Windows ia32 artifact is removed; current macOS arm64/Linux
deployments are unaffected, but this is not a zero-platform-change claim.
The production dependency audit now reports zero vulnerabilities. This does not
mean the full development graph is clean: `npm audit` still reports seven high
and two moderate findings in the Tailwind/ESLint tooling graph. Those require a
separately verified tooling change; a suggested major upgrade/downgrade is not
automatically safe, and no exception or audit check is disabled here.

Local full verification passes: 608 fast, 88 real PostgreSQL and 41
production-build browser tests, plus the closed-public-demo denial harness;
separate API build passes. The first gate correctly stopped at the new audit
findings; after patching, Docker Desktop had to be started for the disposable
integration harness. No managed database was reset. Only 15 existing legacy
lint warnings remain. Checkpoint/exact-HEAD CI/deployment/runtime gates follow.
Independent read-only review confirmed the dependency diff boundary and local
native Sharp import/PNG encoding; Linux clean-install/build remains a CI gate.
