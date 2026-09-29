# ADR 0014 — Deployment profile and equipment-source safety

Status: Accepted

## Context

The product must run as a public simulation demo, an authenticated private demo
or training system, and a customer-specific commercial deployment. The existing
runtime exposed `development`, `test`, `demo`, `staging`, or `production` beside
`simulation`, `hardware`, or `hybrid`, but `demo` mixed software lifecycle and
product usage. The values were produced by the web identity adapter and shown in
the shell; the API did not validate them at startup.

That ambiguity is unsafe once real adapters exist. A public deployment must not
become hardware-capable through a URL, client state, session claim, or accidental
configuration change.

## Decision

- Model three independent server-owned values:
  - lifecycle environment: `development`, `test`, `staging`, `production`;
  - deployment profile: `public_demo`, `private_demo`, `pilot`, `production`;
  - equipment execution source: `simulation`, `hardware`, `hybrid`.
- Validate a fail-closed compatibility matrix in the shared runtime contract and
  at API startup. Public and private demos allow simulation only. Pilot and
  production allow hardware or hybrid; a simulation-only commercial rehearsal
  uses a private-demo deployment rather than weakening the production profile.
- Derive these values from server/deployment configuration. Browser input,
  query parameters, and user session claims cannot select or override them.
- Expose the deployment profile and equipment source in operational context so
  people can distinguish a simulation from commissioned equipment. Lifecycle
  environment remains separate diagnostic context.
- Require the same values in deployment validation for web and API processes.
  The API and web must agree even though they run as separate images.
- Keep a narrow compatibility adapter for the already deployed legacy
  `SWP_ENVIRONMENT=demo` setting: while the managed environment is migrated, it
  resolves to lifecycle `production`, profile `private_demo`, and still requires
  `simulation`. New deployment files use only the explicit variables.
- Production processes without that legacy marker must configure all three
  runtime dimensions explicitly. Missing or partial configuration fails startup
  instead of silently selecting a deployable profile.
- Profile/source validation is one defense. Later adapter packaging, credential
  separation, network policy, registry allowlists, and command guards must add
  independent enforcement before hardware is commissioned.

## Consequences

`demo` no longer exists in the lifecycle-environment type, and operational
sessions carry a distinct deployment profile. Invalid combinations fail before
the API accepts traffic and fail when the web builds a server-owned session.
Public Demo remains a future no-login principal/session capability; this ADR does
not create anonymous sessions or their persistence.

The compatibility adapter prevents an unsafe or unexplained managed-demo outage,
but it is not the deployment contract. Provider configuration must move to
`SWP_LIFECYCLE_ENVIRONMENT`, `SWP_DEPLOYMENT_PROFILE`, and
`SWP_EQUIPMENT_SOURCE`, after which the legacy fallback can be removed.
