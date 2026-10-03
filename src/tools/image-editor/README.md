# Image Editor

## Purpose

A general in-browser image editor: crop (free and aspect presets), rotate, flip, straighten, resize, tone and colour adjustments, sharpen, blur, denoise, black and white and sepia, with undo/redo, a before/after toggle and PNG/JPEG/WebP export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `ImageEditorPage.tsx` | Page: intake, edit history, tool tabs, preview canvas, export |
| `CropOverlay.tsx` | Draggable, keyboard-operable crop box and handles |
| `features/image-editor.ts` | `EditState`, `Adjust`, size geometry (`orientedSize`, `finalSize`), crop rotate/flip, aspect presets |
| `features/crop.ts` | Pure crop rectangle maths: clamp, move, drag handle with aspect lock, fit aspect |
| `features/history.ts` | Undo/redo with grouped (slider) steps |
| `features/pixels.ts` | RGBA operations: tone tables, saturation/vibrance/sepia/gray, box blur, median, unsharp |
| `features/render.ts` | `EditSession`: decode once, render geometry in one canvas transform, apply pixels, encode |
| `features/editor.worker.ts`, `features/editorClient.ts` | Worker protocol (load/preview/export) and the client with latest-only preview queue and main-thread fallback |
| `../../shared/lib/image.ts` | `decodeImage` (EXIF orientation), `encodeCanvas`, `detectEncodableTypes`, size caps |

## Core Logic

The state (`rotate`, `flipH/V`, `angle`, `crop`, `resize`, `adjust`) is applied to the untouched bitmap: one transform maps the crop of the rotated image onto the output canvas (quarter turn, then flip, then straighten), then `applyAdjustments` runs denoise → blur → tone LUTs and colour → unsharp. Previews render at ≤1400 px with radii scaled by the preview ratio; while the Crop tab is open the preview omits crop and resize so the overlay works in rotated-image pixels. `EditorClient` keeps only the newest pending preview, and falls back to a main-thread `EditSession` when Worker/OffscreenCanvas is missing or the worker can't decode (SVG).

## Limits

- 50 MB, 100 MP, 16,384 px per side (`decodeImage`/`checkPixels`); 100 history steps; preview 1400 px.
- Median filter is O(pixels × window), so strong denoise on large images is slow.

## Tests

- Unit: `tests/tools/image-editor/image-editor.test.ts` (geometry, crop maths with aspect locks, history grouping, every pixel adjustment and filter). `npm test -- image-editor`
- E2E: `e2e/image-editor.spec.ts`. `npm run test:e2e -- image-editor`

## Known Gaps

- No curves/levels, selective colour, text or drawing, or layers; no multi-image batch.
- Straighten uses whole degrees in the UI; the crop is cleared when the angle changes.
- Output is always sRGB without a colour profile.
