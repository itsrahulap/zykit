# Image Resizer

## Purpose

Batch-resizes images by pixels, percentage or to a box (fit, cover or stretch) and re-encodes them in the browser. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `ImageResizerPage.tsx` | Resize mode, preset, output settings, batch list, ZIP download, "How it works" panel (UI from `src/shared/ui/ImageBatch.tsx`) |
| `features/resize.ts` | Pure logic: `resizeSpec` (settings → `ResizeSpec`), `lockedSide`, `resizeJob` (output type via `resolveOutputType`), `resizedName`, `PRESETS` |

Shared code this tool depends on: `src/shared/lib/image.ts` (`planResize`, limits, decode → resample → encode), `src/shared/lib/imageClient.ts` + `image.worker.ts` (worker with main-thread fallback, `MAX_BATCH_FILES`), `src/shared/hooks/useImageBatch.ts`, `src/shared/lib/zip.ts` (stored ZIP).

## Core Logic

With the lock on, `resizeSpec` sends only the `driver` side (the one typed last) as `{ mode: 'exact' }`, so `planResize` derives the other per image; the page shows that side from the first finished image via `lockedSide`. Percent is clamped to 1–1000 in `resizeSpec` (the slider stops at 200). `planResize` computes the centred crop for `cover` and runs `checkPixels` on the output size. `resample` uses `createImageBitmap` with `resizeQuality: 'high'` when shrinking, falling back to stepwise halving. Presets switch the mode to `box`. The batch re-runs when the spec, format or quality changes.

## Limits

- 50 MB per file, 100 MP, 16,384 px per side for input and output (`MAX_IMAGE_*`, `MAX_CANVAS_SIDE`), 100 files per batch; `NumberField` caps inputs at 16,384.
- "Same as input" falls back to PNG for types the canvas can't encode.

## Tests

- Unit: `tests/tools/image-resizer/image-resizer.test.ts` (locked and unlocked pixels mode, percentage, cover crop and contain, locked side, output type fallback, presets, naming). `npm test -- image-resizer`
- E2E: `e2e/image-resizer.spec.ts` (pixels with lock, percentage and preset box, phone layout). `npm run test:e2e -- image-resizer`

## Known Gaps

- No padding / letterbox option for "Fit inside" to output the exact box size.
- With the lock on, the shown "other side" comes from the first image only, even when the batch mixes aspect ratios.
- The page has its own "How it works" panel that overlaps with `docs.ts`.
