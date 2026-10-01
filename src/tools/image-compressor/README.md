# Image Compressor

## Purpose

Batch-compresses images by re-encoding them in the browser at a chosen quality and optional max size. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `ImageCompressorPage.tsx` | Settings, batch list, before/after compare, ZIP download (UI from `src/shared/ui/ImageBatch.tsx`) |
| `features/compress.ts` | Pure logic: `compressedType` ("Auto" format choice), `compressJob` (settings → `RenderJob`), `pickOutput` (keep the original if it's smaller) |

Shared code this tool depends on: `src/shared/lib/image.ts` (limits, decode → resample → encode), `src/shared/lib/imageClient.ts` + `image.worker.ts` (worker with main-thread fallback, `MAX_BATCH_FILES`), `src/shared/hooks/useImageBatch.ts`, `src/shared/lib/zip.ts` (stored ZIP).

## Core Logic

`useImageBatch` turns each file into a `RenderJob` via `compressJob`, then `renderImage` decodes with `createImageBitmap` (`imageOrientation: 'from-image'`), resamples onto an (Offscreen)Canvas and encodes with `convertToBlob` / `toBlob`. Encodable formats are probed once with `detectEncodableTypes()`. JPEG output gets a white background because it has no alpha. Changing a setting re-runs the whole batch (`key: JSON.stringify(settings)`).

## Limits

- 50 MB per file, 100 MP, 16,384 px per side (`MAX_IMAGE_*`, `MAX_CANVAS_SIDE`), 100 files per batch.
- Decodable and encodable formats depend on the browser. Output is lossy only (JPEG / WebP / AVIF); animation and metadata are not preserved.

## Tests

- Unit: `tests/tools/image-compressor/image-compressor.test.ts` (format choice, fallbacks, job building, naming, keep-original rule). `npm test -- image-compressor`
- E2E: `e2e/image-compressor.spec.ts` (batch compress, compare, single and ZIP download, paste, phone layout). `npm run test:e2e -- image-compressor`

## Known Gaps

- No target-file-size mode (e.g. "under 200 KB"); quality is set manually.
- The page has its own "How it works" panel that overlaps with `docs.ts`; it could be removed now that docs render under every tool.
