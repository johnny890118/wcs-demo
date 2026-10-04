# ADR 0027 — Isolated simulator bundles before runtime activation

Status: Accepted

## Evidence and decision

The API currently owns a singleton simulator/virtual clock for its private demo.
New reference snapshots deliberately stay inactive. Sharing that singleton or its
command-id cache would mix virtual state and time across anonymous sessions.

Create a fresh infrastructure bundle per trusted owned workspace: an independent
simulator, advancing clock, bounded command-dedup cache and observation sequence
publisher. Reuse existing EquipmentPort/state-machine/observation contracts,
without adding demo conditionals to WMS Lite/WCS. Validate owned references,
allow only the existing registered simulation adapter profile, and reject opaque
equipment constraints until a supported interpretation exists. Do not infer
ownership from labels or copy source observations/state. Fresh equipment starts
offline, without an invented position.

Bundle reads/results are defensive copies. Foreign equipment and node commands
fail before state changes/publication. A configured command budget refuses new
commands without evicting prior idempotency results. Stop blocks new work,
cancels scheduled virtual actions, waits for in-flight publications and records
disconnect; publication failure is not reported as successful drain.

Command replay returns its historical idempotency result but observation
publication re-reads current adapter state; cached transition state must never
receive a new telemetry timestamp. Missing current state fails closed.

Scheduled actions also have a lifetime bound, including cancellations. Local
reads/commands/heartbeat are serialized with a bounded pending-operation queue
(default 32, validated configurable range 1–100), so older state capture cannot
overtake a transition's publication. Local
stop records disconnected/unknown-qualified observations; it is not business
task completion or proof that active-runtime resources may be deleted.

## Activation gates and limits

This factory is not registered with NestJS/HTTP or the legacy singleton and is
not authorization. Durable runtime leases/fencing and activation evidence must
precede binding to persisted observations, public request resolution or workers.
Duplicate factories for one persisted namespace are forbidden by that future
owner, not prevented by this local bundle. Restart restoration, heartbeat worker
ownership, active-runtime cleanup, task/load scope authorization, quotas and
public projection redaction remain required. The existing inactive cleanup must
not be used once activation can occur. No public entry is enabled here.
