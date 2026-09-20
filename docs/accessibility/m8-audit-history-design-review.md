# M8A audit history design review

The audit surface uses the established operations shell and tokens. It adds no decorative dashboard layer; the information hierarchy follows the investigation task: action and resource first, then time, actor, correlation, event ID, and allowlisted evidence.

| Before                                                 | After                                                                                                                        | Why                                                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Audit evidence required direct database access         | An authenticated demo operator reaches `/operations/audit` through a service identity holding `audit.view`                   | Makes accountable history operable without overstating the not-yet-built user RBAC layer |
| Workflows ended at state projections                   | Completed inbound, outbound, and alarm recovery states link to each affected receipt/order, task, and alarm resource history | Preserves context and makes each persisted workflow boundary inspectable                 |
| Raw records had no reader-safe unknown-action behavior | Unknown actions are labeled and show no evidence                                                                             | Makes vocabulary drift visible while failing closed for sensitive fields                 |
| No usable mobile audit view                            | Events use responsive cards with wrapped identifiers and native links/buttons                                                | Avoids horizontal data-table dependence and retains keyboard/reflow usability            |
| Correlation existed only in logs                       | Correlation is first-class, filterable, and keyboard navigable                                                               | Connects events from one request without inferring a business transaction                |

Automated axe coverage exercises a populated history. Chromium coverage checks both supported locales, mobile reflow, theme inheritance, the protected route, and unknown-action labeling. Manual review must still confirm meaningful screen-reader announcements with production-like event volume and site-specific actor identifiers.
