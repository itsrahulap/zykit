# PDF Metadata Cleaner

## Purpose

Shows the Info dictionary, XMP, document ID and risky features (attachments, JavaScript, forms) of PDFs and removes the metadata, with pdf-lib in a worker. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `PdfMetadataCleanerPage.tsx` | Intake (button, drop, paste), file cards, options, before/after, downloads and ZIP |
| `features/pdf-metadata-cleaner.ts` | Pure logic: `inspectPdf`, `cleanPdf`, `leftovers`, XMP pretty-printing and field flags, date parsing, AI tool detection, size limits |
| `workers/meta.worker.ts` | Keeps opened bytes by file ID; `inspect`, `clean`, `close` |
| `workers/meta.protocol.ts` | Message types |
| `hooks/usePdfMetaWorker.ts` | Lazily started worker with request IDs and crash handling |

## Core Logic

`loadPdf` uses `PDFDocument.load(bytes, { updateMetadata: false })` so nothing is added on the way. `inspectDocument` reads the trailer Info dictionary, the catalog XMP stream (decoded), the trailer ID and scans every indirect object for Filespec/EF, FileAttachment, JavaScript, PieceInfo and metadata streams. `cleanPdf` deletes the chosen objects from the context (so they are not written as orphans), clears the trailer entries, saves without object streams, then re-inspects the output; `leftovers` is empty when verification passes.

## Limits

- 200 MB per file, 500 MB total, 50 files.
- Encrypted PDFs are rejected (`EncryptedPDFError`), with an explanation.
- XMP display is capped at 200,000 characters; removal is not.
- Attachments, JavaScript, form values and page content are kept.

## Tests

- Unit: `tests/tools/pdf-metadata-cleaner/pdf-metadata-cleaner.test.ts` (inspection, XMP parsing and flags, cleaning, verification, encrypted and invalid input). `npm test -- pdf-metadata-cleaner`
- E2E: `e2e/pdf-metadata-cleaner.spec.ts` (pick files, inspect, clean, download, ZIP, no off-origin requests, phone layout). `npm run test:e2e -- pdf-metadata-cleaner`

## Known Gaps

- Incremental-update history that pdf-lib cannot parse is not analysed.
- No per-page or per-annotation author reporting (annotation authors are kept).
- Output is written without object streams and may be larger.
