# Hardware readiness drills

These deterministic drills exercise software failure semantics only. They do not replace vendor simulation, hardware-in-the-loop, site acceptance testing, or safety validation.

| Drill                      | Injected condition                                                                  | Required outcome                                                                                            | Automated evidence                                       |
| -------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Lost acknowledgement       | Adapter applies a command, then the acknowledgement frame is lost                   | Retry uses the same command ID; adapter returns the original transition as a duplicate; state advances once | `hardware-readiness-drills.test.ts`                      |
| Retry exhaustion           | Every bounded attempt loses transport confirmation                                  | Outcome is `unknown`, never success or failure                                                              | `equipment-resilience.test.ts`                           |
| Applied reconciliation     | A fresh observation exactly matches the deterministic post-command state            | Reconciliation reports `confirmed-applied`                                                                  | `hardware-readiness-drills.test.ts`                      |
| Not-applied reconciliation | A fresh observation exactly matches the pre-command state                           | Reconciliation reports `confirmed-not-applied`                                                              | `hardware-readiness-drills.test.ts`                      |
| Divergent reconciliation   | Observation is neither the pre-command nor expected post-command state              | Reconciliation remains `unresolved`; no conflicting command is authorized                                   | `hardware-readiness-drills.test.ts`                      |
| Stale telemetry            | Connection is reported online but observation age exceeds the configured bound      | Command is blocked before adapter dispatch                                                                  | `equipment-resilience.test.ts`                           |
| Connection broken          | Retained VDA connection state changes to `CONNECTION_BROKEN`                        | Link fails closed as disconnected                                                                           | `vda5050-v3.test.ts`                                     |
| Out-of-order connection    | Duplicate/older VDA connection header arrives                                       | Message is rejected and cannot restore link health                                                          | `vda5050-v3.test.ts`                                     |
| WAN loss                   | Local equipment execution remains available while an external event publisher fails | Local state advances; persisted outbox delivery is released for bounded retry                               | `hardware-readiness-drills.test.ts` and `outbox.test.ts` |

## Physical commissioning extensions

Repeat the matrix with the selected broker, adapter process, vendor simulator, and real device. Record timestamps and traces for cable pull, broker restart, adapter restart, duplicate delivery, delayed/out-of-order telemetry, database restart, edge host restart, WAN isolation, time-source loss, credential revocation, and emergency-stop activation.

For every drill, pre-approve the device-safe behavior and maximum detection/recovery times with the integrator and site safety owner. A test passes only when physical state, device state, WCS state, alarms, audit evidence, and operator guidance agree. An ambiguous physical result remains unknown and blocks conflicting work.
