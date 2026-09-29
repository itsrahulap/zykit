# CleanImage

A privacy-first web app that inspects and removes embedded metadata (EXIF, XMP, IPTC, PNG text, C2PA and more) from images, **entirely in the browser**. Images are never uploaded.

> CleanImage removes supported embedded metadata and provenance information from the image file. It does not modify pixels, so it does not remove invisible watermarks or other signals in the image content, and it does not make an image "undetectable".

## Features

- **Inspect** EXIF (incl. GPS, camera, dates, embedded thumbnails), XMP, IPTC/Photoshop IRB, JPEG comments, PNG `tEXt`/`zTXt`/`iTXt`/`eXIf`/`tIME`, ICC profiles, C2PA manifests and trailing data.
- **AI / provenance labelling**: flags generator-related fields (e.g. `Software`, `CreatorTool`, Stable Diffusion `parameters`) and explicit declarations (IPTC `DigitalSourceType`, C2PA). These are labels, not a detection verdict.
- **Lossless sanitization**: metadata containers are cut out of the file and the compressed image data is copied byte for byte, so nothing is re-encoded.
- **Two modes**: *Clean privacy metadata* (keeps the ICC color profile) and *Remove all supported metadata*.
- **Orientation-safe**: optionally keeps a single-tag EXIF block so rotated photos still display upright.
- **Self-verification**: the output is re-parsed, then checked for leftover metadata, unchanged dimensions, byte-identical image data, valid PNG CRCs and decodability.
- Before/after comparison, per-field diff, a Web Worker with cancellation, drag & drop, paste, dark mode, and keyboard and screen-reader support.

## Privacy

- No backend, no uploads, no database, no analytics, no telemetry.
- All processing happens in a Web Worker. The worker has no network code.
- A strict Content Security Policy (`connect-src 'self'`) is shipped for Netlify/Cloudflare (`public/_headers`) and Vercel (`vercel.json`).
- The e2e suite asserts that processing an image triggers only same-origin `GET` requests for app assets.

See [docs/privacy.md](docs/privacy.md).

## Supported formats

| Format | Inspect | Sanitize | Verification |
|---|:-:|:-:|:-:|
| JPEG | ✓ | ✓ | ✓ |
| PNG (incl. APNG) | ✓ | ✓ | ✓ |
| WebP (lossy, lossless, animated) | ✓ | ✓ | ✓ |
| HEIC / AVIF / TIFF | Planned | Planned | Planned |

Details per metadata type: [docs/supported-formats.md](docs/supported-formats.md).

## Architecture

```text
React UI ──postMessage(File)──▶ Web Worker
                                  │
                                  ├─ detect format (magic bytes)
                                  ├─ walk structure (JPEG segments / PNG chunks / RIFF chunks)
                                  ├─ parse payloads (EXIF, XMP, IPTC, ICC, C2PA)
                                  ├─ sanitize (drop metadata containers, copy image data)
                                  └─ verify (re-parse + diff + checks + createImageBitmap)
React UI ◀──ArrayBuffer (transferred)──┘  → Blob → object URL → download
```

The parsers are written from scratch against the format specs, with no third-party metadata libraries. See [docs/architecture.md](docs/architecture.md).

## Development

Requires Node 20.19+ (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright; builds and serves the production bundle)
npm run lint
npm run build        # static output in dist/
npm run preview
```

First-time e2e setup: `npx playwright install chromium`.

## Testing

- `tests/`: unit tests for parsers, sanitizers, verification, classification and hostile input (truncated files, IFD loops, invalid lengths, decompression bombs, oversized values, pixel limits, XSS strings). Fixtures are generated in code (`tests/fixtures/builders.ts`), so each test documents exactly what it feeds in.
- `e2e/`: real Chromium. Real JPEG/PNG/WebP files are produced by the browser's canvas encoder, metadata is injected, and each file is cleaned through the UI. The test downloads the result, re-analyzes it, and asserts all checks pass with no off-origin requests and no console/CSP errors.

## Deployment

`npm run build` produces a fully static `dist/`. Deploy it to Netlify, Cloudflare Pages, Vercel or GitHub Pages. Keep the CSP headers from `public/_headers` / `vercel.json`. GitHub Pages can't set headers, so prefer a host that can.

## Limitations

- Pixel-level signals (invisible watermarks, steganography) are not touched.
- C2PA manifests are detected and removed, but their signatures are **not** validated. Removing the embedded manifest doesn't affect provenance records held elsewhere.
- Extra images appended to a JPEG (MPF previews, depth maps) are removed as trailing data. Their pixels are not analyzed.
- Limits: 50 MB file size, 100 MP (header-checked before any decode). Configurable in `src/config/limits.ts`.

## Roadmap

Next: PWA/offline install, batch mode + ZIP, HEIC/AVIF/TIFF, deeper C2PA inspection, optional ExifTool backend. See the implementation plan.

## License

MIT
