# Clean Image

## Purpose

Inspects JPEG, PNG and WebP metadata (EXIF, GPS, XMP, IPTC, ICC, C2PA, AI-generation fields) and removes it without re-encoding, then proves the image data is unchanged. User-facing docs, including supported formats and FAQs, live in [`docs.ts`](docs.ts).

## File Structure

```text
src/tools/clean-image/
├── CleanImagePage.tsx, hooks/useImageProcessor.ts   UI state machine: idle → analyzing → ready → sanitizing → completed
├── components/                          Presentational React components (metadata rendered as text only)
├── workers/                             image.worker.ts + promise client (cancel = terminate worker)
├── features/
│   ├── formats/      detect.ts + {jpeg,png,webp}.structure.ts   walk containers, classify each as metadata or image data
│   ├── metadata/     exif / xmp / iptc / icc / c2pa parsers, per-format scanners, classify.ts, metadata.service.ts
│   ├── sanitizer/    per-format sanitizers + minimal orientation EXIF builder
│   ├── validation/   metadata diff, image-data identity check, validation.service.ts
│   └── pipeline.ts   analyze → sanitize → re-analyze → validate (shared by worker and tests)
├── config/limits.ts  size / pixel / decompression / value-length limits
└── types/            shared types, plus test fixtures
```

Byte helpers, CRC-32, bounded inflate, hashing and `AppError` live in `src/shared/lib`.

## Core Logic

- **One structure walker per format, shared by parser, sanitizer and validator.** `describe*()` decides whether a container is metadata, so the three stages can't disagree about which bytes are metadata.
- **Container removal, not re-encoding.** The sanitizer rebuilds the file from the original's kept byte ranges. Validation extracts the image-data containers from input and output and requires them to be byte-identical, which proves no recompression happened.
- **Fail closed.** If the output can't be re-parsed or changes format, it's discarded and the user sees an error. The original is never modified.
- **Classification ≠ detection.** Fields are labelled Privacy / Generator / Provenance. Only standardized explicit declarations (IPTC `DigitalSourceType`, C2PA) are reported as "Declared in file", and even these are described as unverified.
- **Hostile input.** Every offset is bounds-checked, EXIF IFD loops are tracked, compressed chunks are inflated with an output cap, and pixel limits are enforced from the header before any decode or preview. Values are truncated and stripped of control characters, then rendered as React text, never as HTML.
- **No DOMParser in the worker**, so XMP is read by a small tolerant tokenizer.
- **Privacy is enforced three ways:** the worker has no network code; the CSP (`connect-src 'self'`, `default-src 'none'`) blocks third-party requests; and `e2e/clean-image.spec.ts` fails if processing makes any request other than a same-origin `GET`, or logs a console/CSP error.

### What is removed and kept

| Metadata | JPEG | PNG | WebP | Default mode | "Remove all" mode |
|---|:-:|:-:|:-:|---|---|
| EXIF (incl. GPS, thumbnail) | APP1 | `eXIf` | `EXIF` | Removed (orientation optionally kept) | Removed |
| XMP | APP1 + Extended XMP | `iTXt` XML:com.adobe.xmp | `XMP ` | Removed | Removed |
| IPTC / Photoshop IRB | APP13 | – | – | Removed | Removed |
| Comments / text | COM | `tEXt` `zTXt` `iTXt` | – | Removed | Removed |
| Modification time | – | `tIME` | – | Removed | Removed |
| C2PA / JUMBF | APP11 | `caBX` | `C2PA` | Removed (detected, not validated) | Removed |
| ICC color profile | APP2 | `iCCP` | `ICCP` | **Kept** | Removed |
| Multi-Picture / FlashPix / other APPn | ✓ | – | – | Removed | Removed |
| Unknown ancillary / unknown chunks | – | ✓ | ✓ | Removed | Removed |
| Data after end of image | ✓ | ✓ | ✓ | Removed | Removed |

Always kept, because decoding needs them:

- **JPEG:** SOF/DQT/DHT/SOS/DRI/scan data, APP0 JFIF header, APP14 Adobe (color transform).
- **PNG:** `IHDR PLTE IDAT IEND tRNS bKGD gAMA cHRM sRGB sBIT cICP mDCV cLLI pHYs hIST sPLT` and APNG `acTL fcTL fdAT`.
- **WebP:** `VP8X` (flags rewritten to match remaining chunks), `VP8 `, `VP8L`, `ALPH`, `ANIM`, `ANMF`.

Orientation: if the original EXIF orientation isn't `1`, the sanitizer can write a new 26-byte TIFF block containing only the Orientation tag (on by default). For WebP this only happens when the file already uses the extended (VP8X) format.

## Limits

`config/limits.ts`: 50 MB file size, 100 MP from the header, 60 MP max for the output decode check, 4 MB per inflated chunk, 5,000 metadata entries, 2,000-character values. C2PA signatures are not validated.

## Tests

- Unit: `tests/tools/clean-image/` (`metadata/`, `sanitizer/`, `validation/`, with binary `fixtures/`). `npm test -- clean-image`
- E2E: `e2e/clean-image.spec.ts` (end-to-end clean of real JPEG/PNG/WebP with no network uploads, non-image rejection, keyboard access, theme). `npm run test:e2e -- clean-image`

## Known Gaps

- Planned formats: HEIC/HEIF, AVIF, TIFF (inspect → sanitize → verify, in that order).
- No C2PA signature validation.
