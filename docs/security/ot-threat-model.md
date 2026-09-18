# OT Threat Model

## Purpose and limits

This model covers the Smart Warehouse Platform execution path from an authorized operator request through the API, database, adapter, message broker, and warehouse equipment. It uses the availability/safety priorities in [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final) and the risk-based zones-and-conduits concept in [ISA/IEC 62443-3-2](https://www.isa.org/getmedia/661c718f-8e64-446d-acf9-2c6286db1b33/isa-62443-3-2-preview.pdf). It does not claim certification, conformance, or that documentation alone makes a deployment safe.

Safety-rated PLCs, interlocks, protective devices, emergency stops, and equipment controllers remain authoritative for physical safety. The platform must not bypass them or be assigned a safety function it was not engineered and certified to perform.

## Assets and unacceptable outcomes

Protected assets include personnel safety, equipment integrity, loads and inventory, active topology/configuration, command identity and audit evidence, adapter credentials, database availability, and the ability to stop or recover operations deliberately.

Unacceptable outcomes include unauthorized or duplicate movement; movement based on stale/spoofed telemetry; route execution against the wrong topology revision; loss of safety functions; silent inventory divergence; credential disclosure; unaudited recovery; and cloud/WAN failure stopping a locally deployed warehouse.

## Zones and conduits

| Zone                   | Contents                                                                    | Trust posture                                                                    |
| ---------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Public/user            | Browser, public product pages, remote user device                           | Untrusted; no direct equipment reachability                                      |
| Enterprise application | Authenticated web/BFF, API ingress, identity provider                       | Authenticated and least-privileged; not trusted as physical proof                |
| OT operations          | On-edge API/execution worker, PostgreSQL, local monitoring                  | Restricted administrative access; execution remains local during WAN loss        |
| Adapter/broker         | Per-protocol adapter and local message broker                               | Dedicated identities/topics; protocol payloads are untrusted input               |
| Equipment cell         | Robot/fleet manager, conveyor/lift controller, scanner or vendor controller | Device-specific trust after commissioning; safety controller remains independent |
| Safety                 | Safety PLC, interlocks, emergency stops and protective devices              | Independent and authoritative; no dependency on web/API availability             |

Allowed conduits are explicit: browser to HTTPS web/API; API to PostgreSQL; execution worker to a configured adapter; adapter to a mutually authenticated broker/device endpoint; monitoring to an append-only destination; and tightly controlled maintenance access through an approved jump path. Default routes between enterprise/public networks and equipment cells are denied. Database, broker, and device ports are never internet-exposed.

## Threats and controls

| Threat                                    | Consequence                                          | Required controls and current evidence                                                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen operator/service identity          | Unauthorized command or data access                  | Deny-by-default service permissions, constant-time token comparison, named confirmation for high-risk actions, audit transaction; production identity provider and rotation remain deployment duties |
| Replay or duplicate delivery              | Repeated physical action                             | Unique command ID, content fingerprint, idempotent adapter result, monotonic protocol header, bounded replay trace                                                                                   |
| Acknowledgement loss                      | False retry or false success                         | Same-ID retry; explicit `unknown` on exhaustion; observation-based reconciliation before conflicting work                                                                                            |
| Spoofed, stale, or cross-device telemetry | Unsafe decision from false state                     | Configured device identity, freshness threshold, link plus observation health, out-of-order rejection, stale dispatch block; production schema/signature/broker controls required                    |
| Topology/configuration tampering          | Route crosses an unsafe or unavailable path          | Versioned persisted topology, validation/activation boundary, capability/resource checks, route plan revision binding, audited configuration authorization required before commissioning             |
| Compromised broker or adapter             | Forged commands/state across cells                   | Separate zone, least-privilege topic ACLs, mTLS, credential rotation, egress/ingress allowlists, per-adapter process identity, no shared wildcard credentials                                        |
| Network flood or alarm storm              | Loss of control/awareness                            | Edge rate limits, bounded queues/maps/retries, alarm rationalization/deduplication, resource monitoring and upstream shared limits                                                                   |
| WAN or cloud outage                       | Warehouse execution stops                            | OCI/on-edge deployment, local database/broker/execution, durable outbox retry; public demo/cloud control is not the local execution dependency                                                       |
| Ransomware or database loss               | Loss of configuration, inventory, and audit evidence | Segmentation, least privilege, immutable/offline backup policy, checksum restore exercise, recovery validation and separate administrative credentials                                               |
| Vulnerable dependency or image            | Remote compromise                                    | Locked dependencies, digest-pinned bases, non-root/read-only containers, dependency audit, secret scan, rebuild and patch process                                                                    |
| Unauthorized remote maintenance           | Persistent OT foothold                               | Disabled by default; approved jump host/VPN, MFA, time-bounded access, session audit, explicit site authorization, revocation test                                                                   |
| Clock drift                               | Incorrect freshness, ordering, or audit timestamps   | Authenticated local time sources, drift monitoring, monotonic sequence identifiers, no timestamp-only command idempotency                                                                            |
| Unsafe recovery action                    | Motion resumes into a hazard                         | Independent safety clearance, named authorization/confirmation, explicit reason, alarm acknowledgement, audit, and physical reconciliation                                                           |

## Secure commissioning gate

Before any physical adapter is enabled:

1. inventory the exact devices, firmware, factsheets, protocols, ports, data flows, safety functions, and responsible owners;
2. perform a site-specific risk assessment and assign zones, conduits, target security levels, and compensating controls with qualified OT/security/safety stakeholders;
3. pass the common adapter conformance kit, official protocol schemas, vendor simulator, hardware-in-the-loop, and the full failure-drill matrix;
4. configure unique credentials, mTLS where supported, topic/network allowlists, certificate/secret rotation, protected time sources, and deny-by-default firewalls;
5. verify safety independence and safe device behavior for stale telemetry, broker loss, adapter restart, edge restart, WAN isolation, and emergency stop;
6. establish monitored backups, restore evidence, log retention, asset/firmware baselines, vulnerability/patch procedures, and rollback artifacts;
7. train operators on unknown outcomes and manual reconciliation; and
8. obtain recorded approval from the site operations, equipment integrator, cybersecurity, and safety owners.

## Incident posture

On suspected compromise or unexplained state divergence, stop issuing new equipment work through the affected conduit, preserve logs/traces, notify the site control authority, and use the independently engineered safety process. Isolate only through pre-approved procedures: abrupt network or power removal can itself create a hazard. Restore from known-good artifacts, rotate affected credentials, reconcile physical inventory/equipment state, and require a reviewed return-to-service decision.

## Residual risk

The repository proves deterministic software behavior, not physical safety or protocol certification. Vendor implementations, radio conditions, broker behavior, cell layout, load physics, human procedures, safety systems, and customer network controls remain outside automated repository verification and require site evidence.
