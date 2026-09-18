# Equipment adapter conformance

The equipment port is protocol-neutral. A vendor, simulator, or protocol adapter must prove the same observable contract before it can participate in execution; implementing the TypeScript interface alone is not sufficient.

## Required fixture

An adapter fixture supplies a fresh configured adapter, its adapter key and equipment identity, required capabilities, and one valid lifecycle expressed as command envelopes. `runAdapterConformance` then checks:

1. the descriptor is discoverable and identifies the expected adapter;
2. required capabilities are explicitly reported;
3. the lifecycle accepts each command once and in order;
4. an identical command ID is idempotent and returns the original transition; and
5. reuse of a command ID with different content is rejected.

Protocol-specific suites may add schema, topic, timing, authentication, and device-behavior checks. They must not weaken these common checks.

## Recorded traces

`RecordingEquipmentAdapter` wraps any equipment port and records ordered, timestamped descriptor reads, state reads, command results, and sanitized errors. Trace version `1` is JSON serializable. `replayEquipmentTrace` reissues command events against a fresh adapter and fails on the first divergent result.

The checked-in simulator trace at `tests/fixtures/equipment/simulator-transport.trace.json` proves a new command, an idempotent replay, and the resulting state. Trace fixtures contain synthetic identifiers only; production payloads can contain facility or load information and must not be committed without sanitization.

## Connection boundary

`EquipmentLinkSupervisor` distinguishes current observations from stale telemetry and an explicitly disconnected link. `ResilientEquipmentGateway` retries only errors explicitly classified as retryable, always with the same command ID. Exhaustion returns an `unknown` outcome; it never fabricates failure or success. Operators or reconciliation logic must resolve unknown physical outcomes before issuing conflicting work.

Retry counts, backoff, telemetry age, and device-safe behavior are adapter/site configuration. They require validation against the device vendor and site safety assessment before physical commissioning.
