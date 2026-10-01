# Favicon Generator

## Purpose

Draws a favicon set (multi-size ICO, PNG favicons, Apple and Android icons) from text, an emoji or an image, plus a web manifest and the HTML link tags. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `FaviconGeneratorPage.tsx` | Design and site options, previews, file list, ZIP download |
| `features/favicon.ts` | Pure logic: `buildIco` / `readIcoDirectory` (PNG-in-ICO container), `ICO_SIZES`, `PNG_FILES`, `normalizeBasePath`, `buildManifest`, `buildHtmlSnippet` |
| `utils/render.ts` | Canvas drawing (browser only): `renderIcon` (shape clip, background, text fitting or image fit), `generateFavicons` |

Shared code this tool depends on: `src/shared/lib/image.ts` (`decodeImage`, `planResize`, `resample`, `encodeCanvas`, `makeCanvas`), `src/shared/lib/imageClient.ts` (`downloadBlob`, `downloadZip`), `usePageFileIntake` for page-wide drop and paste.

## Core Logic

The page re-runs `generateFavicons(design, bitmap)` 120 ms after any design change, on the main thread. `renderIcon` clips to the shape, fills the background (forced opaque square for `apple-touch-icon.png`), then either fits the image with `planResize({ mode: 'box', fit })` or sizes the text from `measureText` ink bounds and centres the ink box. `buildIco` writes ICONDIR + 16-byte entries pointing at whole PNG files (width/height 256 stored as 0). The manifest's `background_color` is the design background unless it's transparent.

## Limits

- Image input goes through `decodeImage`: 50 MB, 100 MP, 16,384 px per side.
- Text is cut to the first 4 code points (the input allows 8 characters).
- Fixed sizes: ICO 16/32/48, PNG 16/32/180/192/512.

## Tests

- Unit: `tests/tools/favicon-generator/favicon-generator.test.ts` (ICO directory written and read back, bad input rejected, manifest, link tags with base path, base path normalisation). `npm test -- favicon-generator`
- E2E: `e2e/favicon-generator.spec.ts` (text icon and full ZIP contents, uploaded image, phone layout). `npm run test:e2e -- favicon-generator`

## Known Gaps

- No SVG favicon, maskable icon or dark-mode variant.
- The manifest's background colour for transparent icons has no UI (always `#ffffff`).
- Text is truncated by code points, so multi-code-point emoji (ZWJ sequences, flags with modifiers) can be cut mid-sequence.
- The page has its own "How it works" panel that overlaps with `docs.ts`.
