# Approved operator UI implementation

Status: In progress. S3 implementation remains paused until UI acceptance.

## Authority and scope

Owner approved the six final production-to-proposal comparisons on 2026-10-09.
The approved artifact is `swp-design-proposal-final.html`, with comparison and
review evidence in the Owner's external design-preview workspace. Do not reopen
the proposal or copy its snapshot records into product code.

Implement shared neutral Light/Dark tokens, compact responsive shell, collapsible
desktop navigation, adaptive tablet navigation and compact mobile menu. Apply
consistent hierarchy to Home, Work, Inbound, Outbound, Live, Exceptions and
Inventory. Keep the six existing primary destinations and all exact Work links.

Risk: broad presentation/interaction change, with accessibility and context-loss
regression risk. No new domain or authorization decision is authorized. A
persistent plan is appropriate; a new architecture ADR is not necessary unless
implementation uncovers a load-bearing contract change.

## Evidence-backed constraints

- Brand remains `#E6F000`; neutral selection with a restrained brand marker
  supersedes the previous full-yellow selection treatment.
- Existing inbound external reference and carrier fields are required by the
  shipped contract. The proposal's optional disclosure cannot make them optional
  or hide required inputs. Preserve their requirement and make grouping readable.
- Preserve strict mutation revalidation, permission/scope checks, session expiry,
  warehouse switching, confirmations, idempotency, unknown outcomes and audit.
- Preserve qualified observation timestamps, recorded versus observed evidence,
  physical/calibration limits and unavailable capabilities. Never invent maps,
  equipment status, progress, business stages or inventory outcomes.
- UI/UX Pro Max guides overall coherence; Emil guides interaction/polish. Record
  actual reviews, not claims of personal designer involvement.

## Delivery phases

1. Shared tokens/shell and accessible responsive navigation; focused regression
   tests for preference restoration, menu keyboard behavior and context exposure.
2. Seven-surface hierarchy and workflow layouts using real existing projections;
   preserve required forms, safe actions and reloadable exact handoffs.
3. Full verification, separate API build, security/Operator/Emil review and real
   browser journeys. Compare six approved views at native viewport dimensions.
4. Durable evidence, secret/staged-diff review, coherent checkpoint(s), push,
   exact-HEAD CI, matching Vercel/Render deployment and runtime smoke.

## Acceptance gates

- Both locales/themes at desktop, tablet, mobile and 375 px/landscape/reflow.
- Visible keyboard focus, menu escape/focus return, no obscured controls, Axe and
  actual foreground/background contrast; 44–48 px practical touch targets.
- Inbound/outbound, Live, exception investigation and inventory journeys retain
  context without remembered IDs, repeated search or Browser Back dependency.
- Loading/empty/denied/stale/offline/unknown states remain truthful and readable.
- Production build and complete `npm run verify` pass; no reduced test gates.
- Distinguish isolated test data, local production-build evidence, authenticated
  deployed evidence and physical-device testing. Do not imply certification.
- Delivery report includes screenshots, proposal deviations with reasons,
  verification counts, exact commit/CI/deployment identities and clean-tree proof.

## Progress

- Repository baseline: clean `0fc3b5d4821fb35b0d07d972fbd23ba1d330cf4b`.
- Shared shell, seven-surface hierarchy, required-field grouping and truthful Live
  prioritization implemented; no domain/API/authentication changes.
- Full local gate passes 616 fast, 88 PostgreSQL and 44 browser tests plus denial
  harness; API build and six native screenshot comparisons reviewed.
- Checkpoint and exact CI/deployment/runtime gates remain pending. S3 stays paused.
