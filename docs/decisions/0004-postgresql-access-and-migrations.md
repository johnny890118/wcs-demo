# ADR 0004: PostgreSQL Access and Migrations

- Status: Accepted
- Date: 2026-09-17

## Context

The inbound vertical slice must atomically persist receipts, loads, transport tasks, audit-relevant facts, and outbox events. The platform also needs explicit optimistic-concurrency and idempotency behavior. The target architecture left the ORM and migration mechanism open pending evidence.

NestJS is database-agnostic and officially supports using a general-purpose database driver directly. Prisma 8 introduces useful contract and migration concepts but is still a release candidate as of this decision; adopting it would put a new warehouse execution core on a pre-stable persistence API.

## Decision

Use the maintained `pg` PostgreSQL driver behind application repository ports. Keep SQL inside infrastructure adapters. Use ordered, reviewed SQL migration files applied by a small repository-owned runner inside a PostgreSQL advisory lock.

Transactions are explicit. A business command that changes an aggregate and emits an outbox event commits both in one transaction. Mutable aggregates carry integer version fields for optimistic concurrency. Database schema synchronization at application startup is prohibited.

## Consequences

- Positive: transaction, locking, constraint, and query behavior remain visible and reviewable.
- Positive: the domain and application layers remain independent of a persistence library.
- Positive: SQL migrations work in local, hosted, and on-prem PostgreSQL without a proprietary service.
- Negative: mapping and repository code is more verbose than a generated ORM client.
- Negative: the team owns migration-runner tests and query integration coverage.
- Revisit: a stable ORM may be adopted later behind the same ports if it demonstrably reduces maintenance without obscuring operational invariants.

## Evidence

- NestJS database documentation permits direct use of a general-purpose Node.js database driver and warns against production schema synchronization.
- PostgreSQL transactions require all statements in a unit of work to share one checked-out client, which matches the explicit adapter implemented here.
- Prisma 8 documentation identifies the current release as a release candidate while Prisma 7 remains supported.
