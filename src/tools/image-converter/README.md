# Image Converter

## Purpose

Batch-converts images between PNG, JPEG, WebP and AVIF by re-encoding them with the browser's canvas encoder. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `ImageConverterPage.tsx` | Format, quality and background settings, batch list, ZIP download, "Supported formats" panel (UI from `src/shared/ui/ImageBatch.tsx`) |
| `features/convert.ts` | Pure logic: `convertJob` (settings → `RenderJob`, hex validation, quality clamp, when to fill a background), `convertedName`, `READABLE` |

Shared code this tool depends on: `src/shared/lib/image.ts` (limits, `detectEncodableTypes`, decode → resample → encode), `src/shared/lib/imageClient.ts` + `image.worker.ts` (worker with main-thread fallback, `MAX_BATCH_FILES`), `src/shared/hooks/useImageBatch.ts`, `src/shared/lib/zip.ts` (stored ZIP).

## Core Logic

`convertJob` always uses `resize: { mode: 'none' }`. The background is applied when the target has no alpha (JPEG) or `flatten` is on; a malformed background falls back to `#ffffff`. Quality (1–100) becomes 0.01–1 for lossy types only. The format list is filtered by `detectEncodableTypes()` (initially PNG and JPEG until the probe resolves). `encodeCanvas` rejects a blob whose type differs from the requested one, because browsers silently fall back to PNG. The batch re-runs when `JSON.stringify(job)` changes. SVG fails in the worker and is retried on the main thread through an `<img>`.

## Limits

- 50 MB per file, 100 MP, 16,384 px per side (`MAX_IMAGE_*`, `MAX_CANVAS_SIDE`), 100 files per batch.
- Decodable and encodable formats depend on the browser; animation and metadata are not preserved.

## Tests

- Unit: `tests/tools/image-converter/image-converter.test.ts` (JPEG background and quality, alpha formats and flatten, malformed colour and quality clamp, renaming). `npm test -- image-converter`
- E2E: `e2e/image-converter.spec.ts` (PNG to JPEG/WebP/PNG, undecodable HEIC flagged, ZIP download, SVG via image element, phone layout). `npm run test:e2e -- image-converter`

## Known Gaps

- No resizing or "keep original if smaller" option; use Image Resizer or Image Compressor.
- The page has its own "Supported formats" panel that overlaps with `docs.ts`.
