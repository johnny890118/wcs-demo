# Operational manual export workflow

The authenticated web manual and both downloadable PDFs share
`src/ui/manual/manual-content.ts`. Change content and increment `manualVersion`
together, then regenerate and verify artifacts. This is system guidance, not
marketing or equipment authority. PDFs contain no warehouse/customer data.

Manual revision `2026-10-05.1` adds durable creation-to-Work continuation,
queued-only execution review, reload-cleared confirmation and outcome investigation
without blind resend. It retains exact server-resolved Task/context handoffs,
owned Work/Task returns and exact stock/load/location filters without claiming
physical occupancy or future controls. It retains reloadable Work investigation,
recorded contents versus physical evidence, qualified task counts, Home investigation,
actual All work/load-more queue traversal, task-investigation tabs, bounded stock
hints, unknown recovery outcomes and spatial read qualifications. Software package
release comes from `package.json` (currently development version `0.1.0`), separately
from the dated manual revision. Both appear on Web/PDF and in the hashed canonical
payload/manifest; the date is the manual revision date, not an invented deployment
timestamp. Package version does not prove a specific deployed commit or production
readiness. Deployment evidence separately identifies exact commit SHA. Increment
manual revision whenever shipped guidance changes, even within one package release.

## Generation

Use an isolated Python environment with
`scripts/manual-pdf-requirements.txt`, then run:

```bash
npx tsx scripts/manual-payload.ts | python3 scripts/generate-manual-pdfs.py
npm run manual:check
```

Generation uses ReportLab and FontTools only offline. It downloads a
[pinned Google Fonts Noto Sans TC source](https://github.com/google/fonts/tree/3be1884c48c3e45b52ecc725676a08f87776373e/ofl/notosanstc),
verifies its SHA-256, instantiates regular weight and embeds subsets. Font
software notice is preserved in `output/pdf/FONT-OFL.txt`; this is not a license
change to the private SWP repository. `tmp/pdfs` is an ignored authoring cache;
never stage it or its virtual environment. Production builds and downloads do
not fetch fonts, generate documents, or run Python. Invariant PDF timestamps are
intentional for reproducibility; the manual version identifies content currency.

## Verification and delivery

`manual:check`, included in `verify`, rejects source/version drift, unexpected
artifact filenames, byte/hash changes and missing extracted bilingual text.
It requires Poppler `pdftotext`; CI installs `poppler-utils`. A bundled executable
can be selected via `PDFTOTEXT_BIN` without changing global PATH or ownership.
Missing extraction tooling is a failed gate, never a skipped check.

Production builds additionally run `manual:integrity` to reject stale
source/version or altered bytes before Next compilation, without requiring
Poppler or Python. That lightweight build guard does not replace the complete
extracted-content check in `verify`.

Render every page with `pdftoppm`, inspect glyphs, wrapping, heading/paragraph
continuity and footer clearance, and repeat after layout changes. Full-topic
grouping avoids orphaned safety context. These Unicode-searchable PDFs are not
tagged or PDF/UA-certified; the keyboard/screen-reader-accessible web manual
remains primary. No screen-reader conformance claim is made for exported PDFs.

Commit both PDFs and `manifest.json` as the same coherent content checkpoint.
Private GET `/api/operations/manual/en` and `/api/operations/manual/zh-TW`
revalidate session, `operations.view` and warehouse scope; all other locale/path
inputs fail closed. No-store/noindex and a versioned attachment filename apply.
Files are outside `public/`; explicit Next tracing includes them in standalone
deployment. Production-build browser tests assert both downloads and standalone
asset presence. A PDF describes permission requirements but grants no access;
workflow paths are readable deployment-relative guidance, not embedded external
customer URLs.
