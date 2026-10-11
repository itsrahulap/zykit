# Placeholder Image Generator

## Purpose

Generates placeholder images (width x height up to 8000, colours, text, auto font size) as PNG/JPEG/WebP via canvas or as an SVG string / data URI, with a contrast warning and a batch-to-ZIP mode. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `PlaceholderImagePage.tsx` | Page: settings, contrast warning, SVG preview (data URI `<img>`), `render` (SVG blob or canvas + `encodeCanvas`), download, ZIP via `createZip`, share state (w, h, bg, fg, text, fmt) |
| `features/placeholder-image.ts` | `parseSide`, `parseSizes`, `normalizeColor`, `contrastRatio`, `autoFontSize`, `buildSvg`, `escapeXml`, `svgDataUri` |

## Core Logic

`buildSvg` emits a rect and a centred `<text>`; PNG/JPEG/WebP reproduce it on a canvas and are encoded with `shared/lib/image.encodeCanvas` (rejects when the browser falls back to another type). Batch parses `WxH` / `N` tokens, renders each size sequentially and stores the files in a ZIP (`shared/lib/zip.ts`, stored entries).

## Limits

- Sides 1 to `MAX_SIDE` (8000); at most `MAX_BATCH` (30) sizes per ZIP; hex colours only.
- Canvas size limits vary by browser; WebP depends on browser support.

## Tests

- Unit: `tests/tools/placeholder-image/placeholder-image.test.ts` (SVG builder, escaping, font size, colour/contrast, size parsing). `npm test -- placeholder-image`
- E2E: `e2e/placeholder-image.spec.ts`. `npm run test:e2e -- placeholder-image`

## Known Gaps

- Single line of text, no custom font, no transparent background.
- Canvas and SVG text rendering can differ slightly.
