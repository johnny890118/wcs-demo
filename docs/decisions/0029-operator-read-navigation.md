# ADR 0029 — Operator read navigation with bounded authority-scoped data

Status: Foundation under verification; navigation activation requires separate
runtime integration and timing evidence. Supersedes ADR 0022's default interval,
not its strict command/warehouse-switch or expiry contract.

## Evidence

The active plan records a real local production-stack baseline: 0 persisted
validations across 60 navigations, SSR p50 7.03 ms and projection HTTP 6.32 ms.
Automation and two-frame settled-view timing have separate limitations. No
authenticated deployed production p50/p95 exists. Pages currently mount shell
inside each page and block view replacement on SSR projection. Task → Live and
Task → Exceptions links omit selected task context. These are concrete change
targets, not grounds for a framework rewrite.

Next supports a reused layout in Custom App and per-page layouts that preserve
state ([official layout documentation](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts)).
Existing Link support stays; projection prefetch is a separate authorized read,
not an assumption that Link automatically caches dynamic SSR data
([official Link documentation](https://nextjs.org/docs/pages/api-reference/components/link)).

## Decision and required boundaries

### Scope correction after Owner approval (2026-10-04)

The checkpoint delivers the configurable 900-second default, request-isolated
opaque read metadata and a tested bounded cache primitive. No page imports the
primitive. The layout reuse, projection deferral, prefetch and contextual UX
items below are activation requirements/proposals, not delivered features.
Work-centered Operator Experience A → B → C → D is a separate approved sequence.
It must not be bundled into this existing auth/navigation WIP checkpoint.

The baseline already has zero persisted validation spans; changing the default
does not prove a navigation speedup. Activation requires a measured use case,
complete invalidation/stale-state integration and fresh security/runtime review.
No performance benefit is attributed to the unwired cache.

Independent review found pending reads could return after their authority
deadline or with missing response authority. Completion now rejects both before
returning data, including exact deadline; invalidation still fences late results.
Wrapped operational SSR/BFF responses explicitly use private/no-store, including
redirects and denied/error JSON. These changes do not alter command authority.

- Default human read freshness becomes configurable 900 seconds, range 0–3600;
  0 remains strict. Read authority may survive withdrawal until the earlier
  freshness deadline/session expiry, without event-driven revocation. Switch,
  account/config administration and every command/mutation remain strict.
- Retain Pages Router and one deployment. Reuse OperationsShell at the Operations
  surface boundary so navigation does not rebuild the header/sidebar. Route
  transition immediately identifies the requested view/loading state and hides
  previous-view actions; direct entries still render authorized SSR projections.
- For the supported read workspaces only, client route navigation may defer the
  projection until a same-origin authorized BFF read. SSR still validates signed
  authority, route permission and query shape. No header/query can bypass these.
  Targeted pointer/keyboard projection prefetch can overlap this route request.
- Implement small bounded memory-only read caching, not persistent browser storage
  or a new state library. Partition by a server-issued opaque authority scope
  fingerprint and deadline, then locale, route and normalized filters. Fingerprint
  includes identity/session, effective permissions and warehouse; the browser
  receives no session reference, token or validation timestamp. Cache retention
  never extends past server-proven read authority/expiry. Strict mode cannot use
  cached authority to skip validation. Read deadline/scope metadata are not grants.
- Context/permission/session transitions clear incompatible entries and abort
  work; late responses cannot repopulate another scope. 401/403 clear affected
  authority without stale fallback. Network failure may retain bounded, explicitly
  stale data only while authority remains valid. Live/alarms retain independent
  observation freshness; cached data cannot be called live.
- Cache is read evidence only. Server mutation authorization/preconditions/audit
  remain authoritative; mutation attempts/outcomes invalidate relevant reads.
  Bound entries, payload bytes, in-flight requests and prefetch; do not cache audit,
  manuals, login or mutation responses under the read strategy.
- Preserve current filters and contextual Task → Load/Location/Live/Exception →
  back paths with owned references, selected highlights and permitted next action.
  Primary state/impact/next-action text outranks technical enum/UUID disclosure.
  No wholesale IA redesign, marketing changes or invented physical context.

## Evidence still required

Auth boundary/withdrawal/strict mutation and switch regressions; scope/permission/
deadline/cache isolation, failed refresh and mutation invalidation; real browser
direct/back/keyboard/mobile/bilingual/theme scenarios; operator click counts,
same-workload total/stage/cache/validation comparison, independent security review,
full verification and exact deployment/runtime/clean checkpoint. If total timing
does not improve, investigate the dominant path rather than claim auth speedup.
