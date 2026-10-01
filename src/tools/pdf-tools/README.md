# PDF Merge & Split

## Purpose

Merges PDFs, splits them by page or range, and extracts, deletes, reorders and rotates pages, with pdf-lib running in a worker. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `PdfToolsPage.tsx` | Drop zone, file list (merge order), Merge / Split / Pages modes, page tiles, size limits on intake |
| `features/pdf-tools.ts` | Pure logic, no pdf-lib: `MAX_FILE_BYTES`, `MAX_TOTAL_BYTES`, `MAX_PAGES`, `parseRanges`, `everyPage`, output names, `pageSizeLabel`, `normRotation`, `moveItem` |
| `features/pdf-ops.ts` | pdf-lib: `openPdf` (encrypted / invalid / too many pages), `describePdf`, `composePdf` (copy pages, rotate, metadata copy or strip) |
| `workers/pdf.worker.ts` | Holds open `PDFDocument`s by file ID; `open`, `close`, `build` (one PDF or a stored ZIP), throttled progress |
| `workers/pdf.protocol.ts` | Request/response message types |
| `hooks/usePdfWorker.ts` | Lazily started worker, request IDs, progress callbacks, crash handling |

## Core Logic

The page transfers each file's `ArrayBuffer` to the worker, which parses it once with `PDFDocument.load(bytes, { updateMetadata: false })`. The page only keeps `{ index, rotate }` per page, and every operation sends `PageRef[]` lists to `build`. `composePdf` creates a new document and calls `copyPages` in runs of consecutive refs from the same file (a run breaks on a repeated index), adds the extra rotation to the page's `/Rotate`, then either copies Info fields from the first source or empties the Info dictionary (`stripInfo`). pdf-lib is only imported by the worker, so it is its own chunk.

## Limits

- 200 MB per file and 500 MB total (checked on intake), 5,000 pages per file (checked after parsing).
- Encrypted PDFs are rejected; `ignoreEncryption` is not used.
- Only pages are copied, so catalog-level data (outlines, document-level form data, XMP) is not carried over.

## Tests

- Unit: `tests/tools/pdf-tools/pdf-tools.test.ts` (range parsing and errors, file names, page size labels, rotation and move helpers; with pdf-lib: describe, merge with reorder, rotation on rotated pages, extract / delete / split, metadata kept and removed, encrypted and invalid files). `npm test -- pdf-tools`
- E2E: `e2e/pdf-tools.spec.ts` (merge, split to ZIP, rotate, no off-origin requests, phone layout). `npm run test:e2e -- pdf-tools`

## Known Gaps

- No rendered page thumbnails; tiles show only number, size and rotation.
- Files are dropped only on the drop zone, not anywhere on the page.
- No compression option, and no way to open password-protected files.
- The page intro paragraph overlaps slightly with `docs.ts`.
