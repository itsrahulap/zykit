# Images to PDF

## Purpose

Builds one PDF from images with page size, orientation, margins, fit, per-image rotation, ordering and optional document info, with pdf-lib in a worker. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `ImagesToPdfPage.tsx` | Intake, page grid (drag and arrows, rotate, remove), options, progress, download |
| `features/images-to-pdf.ts` | Pure logic: `planPage`, `exifOrientation`, `classifyImage`, `outputName`, `buildPdf` |
| `workers/pdf.worker.ts` | Embeds images and writes the PDF with throttled progress |
| `workers/pdf.protocol.ts` | Message types |
| `hooks/useBuildWorker.ts` | Lazily started worker with request IDs, progress and crash handling |

## Core Logic

`classifyImage` sniffs the type: JPEG and PNG are embedded as is, with JPEG EXIF rotations (3, 6, 8) added to the user rotation and mirrored orientations converted. Other formats are decoded with `decodeImage` (EXIF applied) and re-encoded by `ImageClient` as JPEG or PNG on a white background. `planPage` computes page size, centred placement, the rotation origin per quarter turn and an optional clip for cover mode. `buildPdf` creates the document with `updateMetadata: false` so no Producer or dates are written, and sets only the info the user typed.

## Limits

- 200 images, 50 MB each, 500 MB total, 100 MP per image (shared image limits).
- Format support for conversion depends on the browser (HEIC mostly Safari).
- Fit-to-image pages are capped at 14,400 pt.
- Animated images use the first frame.

## Tests

- Unit: `tests/tools/images-to-pdf/images-to-pdf.test.ts` (layout planning, EXIF, classification, output names, PDF building without Producer). `npm test -- images-to-pdf`
- E2E: `e2e/images-to-pdf.spec.ts` (add images, reorder, rotate, create PDF, WebP conversion, no off-origin requests, phone layout). `npm run test:e2e -- images-to-pdf`

## Known Gaps

- No page previews that show margins or clipping.
- PNG EXIF orientation is ignored.
- No per-page size override.
