# Git and Progress Persistence Policy

## Purpose

Persist verified progress in recoverable, understandable local history. A clean commit boundary is an engineering checkpoint, not a substitute for verification and not a reason to rewrite shared history.

## Commit boundary

Create a commit after a coherent work unit is complete, describable on its own, and verified in proportion to its risk. Suitable boundaries include a domain capability, migration, bug fix with regression test, infrastructure foundation, UI vertical slice, or milestone checkpoint whose documentation and implementation agree.

Avoid both extremes: do not commit every file edit, and do not accumulate unrelated milestones in one large commit. A known failing state is not a normal commit boundary unless a clearly labelled temporary checkpoint is necessary to preserve otherwise unsafe work.

## Pre-commit checklist

1. Review `git status` and the relevant staged and unstaged diff.
2. Confirm the boundary is coherent and does not accidentally include unrelated user work.
3. Run `npm run security:secrets` and inspect configuration changes for credentials.
4. Run the tests, static checks, migrations, and builds required by the unit.
5. Stage only the intended files and review `git diff --cached`.
6. Commit with a specific, traceable message; Conventional Commits are preferred.

Examples:

- `feat(wcs): add deterministic transport lifecycle`
- `feat(api): add transactional inbound flow`
- `fix(security): remove legacy credential handling`
- `refactor(ui): introduce configurable operations shell`
- `docs(architecture): define warehouse topology constraints`

## Milestone checkpoint

At an important milestone, make the working tree understandable, update `docs/project/roadmap.md`, record current evidence in `docs/engineering/verification-strategy.md`, run the repository gate, and commit the completed checkpoint before starting the next milestone.

When previously accumulated work cannot be separated without risking the correct working state, prefer one honestly scoped checkpoint commit over destructive history surgery.

## Push and history safety

Local commits are part of the autonomous development workflow. Remote push is a separate action and must follow the existing project workflow and available authorization. Never autonomously force-push, reset published history, rebase shared history, or delete a remote branch for commit cleanup.
