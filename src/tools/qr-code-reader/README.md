# QR Code Reader

## Purpose

Reads QR codes from an image (picked, dropped or pasted) with `BarcodeDetector` when available and otherwise a built-in decoder, then classifies the content and flags risky links. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: false`) |
| `QrCodeReaderPage.tsx` | Image picker/drop/paste, EXIF-aware decode via `shared/lib/image.ts`, `readBitmap` (canvas downscale to 2000 px, detector then built-in decoder), result view with masked Wi-Fi password |
| `features/decode.ts` | `decodeQrPixels`: Otsu binarise, `findFinders` (1:1:3:1:1 runs, vertical confirm), `sampleGrid` (affine map from three finders), `readFormat`, unmask and zig-zag read using the generator's `functionMask`/`MASKS`/`formatBits`, block de-interleave, `rsCorrect` (Berlekamp–Massey, Chien, Forney), `parseSegments` (numeric, alphanumeric, byte, ECI skip) |
| `features/qr-code-reader.ts` | `analyze` into URL, Wi-Fi, vCard, email, SMS, tel, geo or text; `urlWarnings`, `parseWifi`, `parseVCard`, `mask` |

## Core Logic

Tries dark-on-light, then inverted. Every triple among the six strongest finder candidates is sampled and decoded until one passes Reed–Solomon. The block-count table is copied from the encoder because it is not exported. Nothing is ever navigated to: URLs are text only.

## Limits

- Clean, roughly straight-on codes; no alignment-pattern refinement, so perspective-warped or curved codes fail (the detector handles those where present).
- One code per image, no mirrored codes, no Kanji/structured append/FNC1/Micro QR.

## Tests

- Unit: `tests/tools/qr-code-reader/qr-code-reader.test.ts` (encoder-to-pixels round trips across versions, levels and modes, inverted code, Reed–Solomon repair and rejection, blank image; URL, Wi-Fi, vCard, mailto, SMS, tel and geo analysis). `npm test -- qr-code-reader`
- E2E: `e2e/qr-code-reader.spec.ts` (load a generated code, content and link warning, Wi-Fi masking, error on a blank image, no off-origin requests; phone layout). `npm run test:e2e -- qr-code-reader`

## Known Gaps

- No camera scanning.
- Large photos with a small code are only downscaled, never cropped or searched at several scales.
