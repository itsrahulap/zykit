# Barcode Generator

## Purpose

Encodes Code 128, Code 39, EAN-13, EAN-8, UPC-A and ITF-14 with its own encoders and exports PNG or SVG. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `BarcodeGeneratorPage.tsx` | Type and appearance controls, SVG preview, PNG via canvas, share state (validated and clamped on restore) |
| `features/barcode-generator.ts` | `code128` (DP over sets A/B/C, check symbol), `code39` (mod-43 option), `ean13`/`ean8`/`upca`/`itf14` with `gs1CheckDigit`, `encode`, `layout`, `toSvg`, `drawToCanvas` |

## Core Logic

Encoders return a module string (`1` bar, `0` space) plus label groups; `layout` merges runs into bars on whole pixels and `toSvg` and `drawToCanvas` both draw that layout. EAN/UPC/ITF accept N-1 digits (check digit added) or N (verified). UPC-A is encoded as EAN-13 with a leading 0.

## Limits

- Code 128 ASCII only, no FNC characters; Code 39 without Full ASCII; text up to 200 characters.
- No UPC-E, add-ons, ITF bearer bars or extended EAN guard bars. Bar width 1–10 px, height 20–400, quiet zone 0–20 modules.

## Tests

- Unit: `tests/tools/barcode-generator/barcode-generator.test.ts` (symbol table consistency, check digits and known codes, set selection, EAN parity patterns, ITF interleaving, layout, SVG escaping and colours, canvas drawing). `npm test -- barcode-generator`
- E2E: `e2e/barcode-generator.spec.ts` (type switching, check-digit status, invalid input, PNG and SVG downloads, no off-origin requests; phone layout). `npm run test:e2e -- barcode-generator`

## Known Gaps

- Output is not verified by a scanner in CI; tests compare against known encodings and a Code 128 round trip.
