# PDF to Images

## Purpose

Renders selected PDF pages to PNG, JPG or WebP in the browser and downloads them individually or as a ZIP.

## File Structure

```text
src/tools/pdf-to-images/
├── index.ts                 tool definition
├── PdfToImagesPage.tsx      picker, password form, options, rendering loop, results
├── docs.ts                  user guide shown on the page
└── features/pdf-to-images.ts   selectedPages(), renderScale(), imageName() (pure)
tests/tools/pdf-to-images/pdf-to-images.test.ts
e2e/pdf-to-images.spec.ts
```

Reuses `parseRanges`/`baseName` from `pdf-tools/features/pdf-tools.ts` and `createZip` from `shared/lib/zip.ts`.

## Core Logic

`pdfjs-dist` (v6) is lazy-loaded together with its worker URL (`pdf.worker.min.mjs?url`, same origin, allowed by `worker-src 'self'`). Documents open with `useWasm: false` because the CSP has no `wasm-unsafe-eval`. Each page is rendered to a canvas at `renderScale(width, height, dpi)` (DPI / 72, capped at 40 MP) and encoded with `canvas.toBlob`. A `PasswordException` shows the password form.

## Limits

- 200 MB per PDF; one page rendered at a time on the main thread (the parser runs in pdf.js's worker).
- JPEG 2000 / JBIG2 images may be blank without the WebAssembly decoders; non-embedded standard fonts fall back to system fonts.

## Tests

Unit tests cover page selection (ranges, duplicates, out-of-range errors), the DPI scale and pixel cap, and file naming. The e2e spec builds a 2-page PDF with pdf-lib, converts it, checks the ZIP holds two PNGs and that there are no off-origin requests or console errors (including CSP), plus no sideways scroll at 320 px.

## Known Gaps

- No page thumbnails before converting.
- `standardFontDataUrl` isn't configured, so pdf.js uses system fonts for the standard 14 fonts.
