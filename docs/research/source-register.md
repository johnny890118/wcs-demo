# Research Source Register

Checked 2026-09-18. These sources inform boundaries and requirements; they do not substitute for site-specific safety engineering or purchased standards.

- [ISA-95 Enterprise-Control System Integration](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard): technology-neutral enterprise/operations/control layering and information exchange.
- [MHI software fundamentals](https://og.mhi.org/fundamentals/software): WMS process ownership, WCS device-control scope, and simulation terminology.
- [Dematic software overview](https://www.dematic.com/en-pl/software/): practical WMS/WES/WCS distinction and emulation-first WCS evidence.
- [Oracle WMS allocation documentation](https://docs.oracle.com/en/cloud/saas/warehouse-management/26b/owmwr/allocation.html): allocations as reservations of inventory for order needs and grouping into tasks; informs the M4 separation between inventory reservation, transport work, and later shipping confirmation.
- [VDA 5050](https://www.vda.de/en/topics/automotive-industry/vda-5050): order/status interface between a central master control and heterogeneous mobile robots; candidate adapter standard, not core domain model.
- [Official VDA 5050 specification repository](https://github.com/VDA5050/VDA5050): the fleet control retains the complete node/edge graph, filters edges by robot restrictions, exchanges route segments, and consumes machine-readable factsheets for physical/protocol capabilities.
- [VDMA LIF 1.0 guideline](https://www.vdma.org/documents/34570/3317035/FuI_Guideline_LIF_GB.pdf): layout interchange for mobile-robot track networks, including nodes, edges, positions, actions, and vehicle-specific properties; useful as an import/export boundary rather than the universal warehouse model.
- [MassRobotics AMR Interoperability](https://www.massrobotics.org/autonomous-mobile-robot-standards-published-by-massrobotics/): heterogeneous fleet status and shared-space coordination evidence; not a full routing or warehouse-domain standard.
- [OPC UA overview](https://reference.opcfoundation.org/specs/OPC-10000-1/4): secure, platform-independent information/service model; candidate industrial adapter technology.
- [MQTT 5.0](https://www.oasis-open.org/standard/mqtt-v5-0-cs02/): lightweight publish/subscribe transport; candidate adapter transport.
- [ISA-18 alarm standards](https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards): lifecycle, philosophy, rationalization, priority, monitoring, and actionable HMI principles.
- [NIST SP 800-82 Rev. 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final): OT security guidance balancing cyber controls with performance, reliability, and safety.
- [ISA/IEC 62443 overview](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards): IACS cybersecurity lifecycle, risk assessment, and system security concepts.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): normative accessibility target.
- [Deque axe-core](https://www.npmjs.com/package/axe-core): maintained automated accessibility engine with WCAG 2.2 rules; used as an early semantic/ARIA gate, not a substitute for manual review.
- [React Testing Library](https://www.npmjs.com/package/@testing-library/react): DOM-focused component testing guidance that favors user-observable behavior over implementation details.
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing): browser-level axe guidance and the explicit limitation that automated checks require complementary manual assessment.
- [Playwright web server](https://playwright.dev/docs/test-webserver): supported production-like startup of multiple local web servers for deterministic E2E tests.
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json): current `vercel.json` schema, Next.js framework selection, and dashboard-managed environment guidance.
- [Render Blueprint specification](https://render.com/docs/blueprint-spec): current Docker build-context, pre-deploy migration, health-check, and `sync: false` secret fields used by the API adapter.
- [Render health checks](https://render.com/docs/health-checks): HTTP success criteria and routing/restart behavior for readiness checks.
- [Supabase Postgres connections](https://supabase.com/docs/guides/database/connecting-to-postgres): direct versus pooler selection, TLS, persistent-backend pooling, and direct connections for migrations/backup/restore.
