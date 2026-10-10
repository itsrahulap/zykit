# Image Diff

## Purpose

Compares two images with several views and a per-pixel difference heatmap. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `ImageDiffPage.tsx` | Two image slots (picker, drop, paste), size alignment, five views, stats, PNG export |
| `diff.worker.ts` | Runs `compare` off the main thread |
| `features/compare.ts` | Draws both bitmaps to a shared canvas size and reads RGBA (OffscreenCanvas or `<canvas>`) |
| `features/diff.ts` | Pure: `diffPixels` (delta, tolerance, anti-alias skip, stats, bbox), `targetSize` |

Shared: `src/shared/lib/image.ts` (`decodeImage` with EXIF orientation, limits, `makeCanvas`, `encodeCanvas`), `useImageBatch.ts` (`usePageFileIntake`), `ImageBatch.tsx` UI.

## Core Logic

Delta is the max absolute channel difference including alpha; changed means delta greater than tolerance. Anti-alias skipping treats a pixel as an edge blend when its luma is strictly between a darker and a lighter neighbour (range above 24) in both images. Top-left alignment pads to the larger size with transparency; scale redraws B at A's size.

## Limits

- 50 MB, 100 MP, 16,384 px per side per image; animation uses the first frame.
- The anti-aliasing check is a heuristic, not pixelmatch's full algorithm.

## Tests

- Unit: `tests/tools/image-diff/image-diff.test.ts` (diff math on small RGBA arrays). `npm test -- image-diff`
- E2E: `e2e/image-diff.spec.ts` (load two images, stats, views, export, phone layout).

## Known Gaps

- No overlay of the bounding box on the image.
- No perceptual (colour-profile-aware) comparison.
