# ADR 0011 — Redacted audit projection

Status: Accepted

## Context

Operational commands already append events to `audit_events`, but the only way to inspect them is direct database access. Exposing the stored `details` JSON would turn internal persistence into a public contract and could disclose future credentials, free-form sensitive text, or unrestricted diagnostic payloads. Offset pagination would also become unstable while new events are appended.

OWASP distinguishes audit and transaction trails from diagnostic logging, recommends restricted read access, and requires tokens, passwords, keys, connection strings, and sensitive data to be removed, masked, or sanitized before display. Its logging vocabulary guidance also favors consistent event terminology. NIST SP 800-92 treats log generation, transmission, storage, access, retention, and disposal as an end-to-end management concern rather than only a query concern.

Sources:

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [OWASP Logging Vocabulary Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html)
- [NIST SP 800-92, Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)

## Decision

- Expose audit history through a dedicated `audit.view` service permission. `operations.view` does not imply access to operator identity or audit evidence.
- Return a framework-independent projection containing event ID, occurrence time, actor type and ID, action, resource type and ID, and a redacted evidence object.
- Persist a first-class correlation ID on every new audit event. HTTP-originated events use the validated request ID; non-HTTP execution uses an explicit `event:<audit-event-id>` fallback. Existing rows receive a stable `legacy:<event-id>` value during migration rather than an invented workflow relationship.
- Classify the current operator-originated command events as actor type `user`. Existing actor values are preserved because historical meaning must not be rewritten. Future service/system writers must select their actor type deliberately.
- Build evidence from an explicit allowlist of structured identifiers, state, strategy, severity, fault code, and quantity fields. Never return raw `details`; unknown and free-form fields are omitted by default.
- Order events by `(occurred_at DESC, id DESC)` and paginate with an opaque cursor containing that tuple. Apply a bounded default and maximum page size.
- Allow exact resource type, resource ID, and correlation ID filters only. Do not add unrestricted text or actor search in the first slice.
- Define known action and resource vocabulary in the application layer. Keep unknown action names visible, explicitly marked unknown, and with empty evidence so the projection remains honest when writers evolve before readers.
- Treat retention, archival, export, tamper evidence, and legal hold as deployment and customer-policy concerns. This read projection does not claim to solve them.

## Consequences

Authorized clients get a stable, append-friendly audit trail without coupling to the database JSON shape. Newly stored fields remain private until deliberately reviewed and allowlisted. A separate permission adds deployment configuration work but preserves least privilege. Free-form explanations remain in the protected audit store for later policy-led access rather than being exposed accidentally.

The correlation column enables workflow grouping without exposing request headers or raw payloads. A correlation value is evidence of technical request grouping, not proof that multiple requests belong to one business transaction. The projection is read-only and does not weaken the existing transactional write boundary.

The current demo reset truncates `audit_events`. That behavior is not changed by this decision and means reset itself cannot be considered accountable until M8B introduces a guarded reset/replay contract with evidence retained outside the data being reset.
