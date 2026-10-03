# Color Palette Extractor

## Purpose

Extracts 3–12 dominant colours from an image (seeded k-means++ in OKLab, or median cut), shows share, HEX/RGB/HSL/OKLCH and WCAG contrast, and exports CSS variables, SCSS, a Tailwind v4 theme or JSON. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `ColorPaletteExtractorPage.tsx` | Page: intake (picker/drop/paste), settings, swatch cards, export panel; swatch click opens Color Converter |
| `features/color-palette-extractor.ts` | Pure logic: `histogram`, `kmeans`, `medianCut`, `extractPalette`, contrast badges, `exportPalette` |
| `features/sample.ts` | Browser: `decodeImage` + `resample` to ≤128 px and `getImageData` |
| `../color-converter/features/color-converter.ts` | OKLab, `formatAll`, `wcag`, `toHex`, reused |

## Core Logic

`histogram` buckets opaque pixels at 5 bits per channel, keeping each bucket's mean and weight. `kmeans` converts the points to OKLab, seeds with weighted k-means++ using `mulberry32`, runs up to 40 Lloyd iterations (empty clusters restart on the farthest point) and converts the centres back with `fromOklab` + `clampColor`. `medianCut` splits the box with the highest weight × range at the weighted median. Swatches sort by share. The page hands a colour to the Color Converter with a share link (`buildShareLink({ color })`), because that tool reads its state from the `#s=` fragment rather than a text handoff.

## Limits

- 50 MB / 100 MP via `decodeImage`; sampled at `SAMPLE_SIDE` = 128 px; `k` clamped to 3–12.
- Runs on the main thread (a few thousand points), so there is no worker.

## Tests

- Unit: `tests/tools/color-palette-extractor/color-palette-extractor.test.ts` (both methods, shares, transparency, k bounds, seed determinism, histogram, contrast, formats, exports). `npm test -- color-palette-extractor`
- E2E: `e2e/color-palette-extractor.spec.ts`. `npm run test:e2e -- color-palette-extractor`

## Known Gaps

- No palette from a URL, no drag-to-reorder or lock-a-colour, no named-colour labels.
- Animated images use the first frame; HEIC works only where the browser decodes it.
