# VDA 5050 v3 reference proof

## Scope

This proof targets the platform's tested mobile load-transport profile. It maps a core route plan into the mandatory VDA 5050 v3 order envelope and isolates publication behind `Vda5050MessageBus`. It also consumes retained connection-state messages into the protocol-neutral link supervisor.

The mapper verifies the topology identity and revision, the node/edge alternation, every referenced node, and every directed edge adjacency. Nodes receive even sequence IDs and edges receive odd sequence IDs. Optional node coordinates are copied only as protocol attributes; routes remain defined by the core directed topology.

## Proven behavior

- v3 topic construction rejects `/`, wildcards, whitespace, and other unsafe topic-segment characters;
- a route is emitted as one fully released base with empty action arrays;
- order publication uses MQTT QoS 0 and is not retained, matching the published v3 protocol guidance;
- connection header IDs must increase monotonically;
- `OFFLINE`, `HIBERNATING`, and `CONNECTION_BROKEN` all fail closed as disconnected; and
- VDA messages do not enter domain or application packages.

## Not production-ready

This is not a broker client or a certified VDA implementation. Before physical use, add and verify:

1. the exact robot factsheet and supported optional parameters/actions;
2. official JSON-schema validation for every inbound and outbound message;
3. mutual authentication, TLS, broker authorization, retained last will, topic allowlists, and credential rotation;
4. order update/base/horizon behavior, action states, state reconciliation, timestamp policy, and duplicate/out-of-order handling;
5. vendor simulator and hardware-in-the-loop traces; and
6. site safety, stop behavior, network-loss behavior, and recovery sign-off.

The official specification remains authoritative. If its PDF and repository artifacts differ, follow the publisher's precedence guidance and pin the commissioned adapter to the reviewed version.
