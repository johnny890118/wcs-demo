# Audit retention policy

## Current M8A contract

Operational audit events are append-only through application workflows and read-only through the authorized projection. The supported API has no update, delete, raw-details, export, or bulk-search endpoint. Read access requires the dedicated `audit.view` permission and the web boundary additionally requires an authenticated operator session.

Projection evidence is an action-specific allowlist. Raw JSON details, free-form confirmation text, credentials, tokens, and fields from unknown actions are not returned. Unknown actions remain visible with empty evidence so vocabulary drift is detectable.

## Retention and disposal

SWP does not currently enforce a universal number of retention days. Before a production site is commissioned, its owner must record:

- applicable legal, contractual, security, and operational investigation periods;
- online retention, archival, backup, legal-hold, and disposal responsibilities;
- who may view, export, restore, or dispose of audit records;
- storage encryption, access review, time synchronization, and restore-test evidence;
- the relationship between audit retention and customer or facility data-retention rules.

Until that site policy exists, automated production deletion is prohibited. Database backup retention is not a substitute for a queryable audit archive, and this repository does not claim tamper-evident or immutable storage.

## Demo reset limitation

The current guarded demo reset truncates `audit_events` with other demo operational data. M8A deliberately does not change that behavior. M8B must make reset/replay an explicitly authorized, confirmed, idempotent workflow and retain reset evidence outside the rows being destroyed. Production reset denial and deterministic replay require integration and runtime proof before the workflow is supported.
