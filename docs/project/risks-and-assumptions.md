# Risks and Assumptions

## Active risks

| Risk                                               | Impact                              | Response                                                                             |
| -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| Prototype behavior is mistaken for warehouse truth | Unsafe or unusable workflows        | Label hypotheses; validate with operators/integrators; use standards and vendor docs |
| Hardware commands have ambiguous acknowledgement   | Duplicate movement or false success | Command IDs, explicit outcomes, timeout/unknown state, reconciliation                |
| UI, domain, and simulation migrate simultaneously  | Big-bang failure                    | Strangler migration with characterization tests and vertical slices                  |
| Dependency age blocks secure deployment            | Public exploit exposure             | Upgrade framework/auth stack before public demo; enforce audit policy                |
| Alarm flood reduces operator awareness             | Missed critical condition           | Alarm philosophy, prioritization, deduplication, actionable response                 |
| Cloud assumptions break edge operation             | Warehouse stops during WAN loss     | Keep execution/database deployable inside warehouse network                          |
| Stale or spoofed equipment telemetry               | Unsafe dispatch or false recovery   | Identity binding, freshness gate, schema validation, segmentation, reconciliation    |
| Compromised adapter or broker                      | Forged command/state across cells   | Per-adapter identity, mTLS, topic/network allowlists, isolated zones and conduits    |
| Demo reset touches non-demo data                   | Data loss                           | Environment/tenant guard plus explicit authorization and audit                       |
| Product claims imply safety certification          | Legal and physical risk             | State scope clearly; never replace safety PLC/interlocks                             |

## Assumptions to validate

- MVP handles one warehouse/site but uses site-scoped identifiers.
- Loads are the first movement unit; item quantity remains owned by WMS Lite.
- A single API/database is sufficient until measured scale proves otherwise.
- WES optimization can remain an internal execution module for MVP.
- Simulator fidelity is discrete-event/state-machine fidelity, not physical dynamics.
- Public demo accounts contain no customer or personal operational data.
- Initial realtime needs are server-to-client operational updates.

## Decision triggers

- Introduce a separate WES service only if independent scaling, ownership, or optimization deployment requires it.
- Split simulator process when fault isolation, accelerated time, or load testing requires it.
- Add Kubernetes only for an explicit HA/multi-node/customer-platform need.
- Adopt a protocol adapter only after a target device/fleet contract and conformance test are available.
- Enable physical equipment only after the site commissioning gate in `docs/security/ot-threat-model.md` is approved and evidenced.
