# QR Code Generator

## Purpose

Builds QR codes for text, URLs, Wi-Fi, email, phone, SMS, contacts and locations with its own ISO/IEC 18004 encoder, and exports PNG or SVG. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`, `accepts: ['text', 'url']` for Send to…) |
| `QrCodeGeneratorPage.tsx` | Content forms, appearance options, logo upload, SVG preview, PNG rendering (`renderPng`), share state and shortcuts |
| `features/qr.ts` | Encoder: capacity tables, `chooseMode`, `fitVersion`, segment and codeword building, Reed–Solomon over GF(256), block interleaving, `Matrix` (function patterns, zig-zag placement), 8 masks with `penaltyScore`, format/version bits, `encodeQr`, `maxBytes` |
| `features/qr-code-generator.ts` | Payload builders (`wifiPayload`, `emailPayload`, `phonePayload`, `smsPayload`, `vcardPayload`, `geoPayload`), `modulesPath`, `toSvg`, `contrastRatio`, `colorWarnings` |

## Core Logic

The page memoises `payload` → `encodeQr(payload, { ecc })`, with `ecc` forced to `H` while a logo is set. `encodeQr` uses one segment in the smallest mode, the smallest fitting version, and evaluates all masks by applying, scoring and XOR-undoing each. `toSvg` validates colours as `#rrggbb` and only embeds logos that match a base64 image data URL, escaping the attribute. `renderPng` uses `floor(size / dim)` pixels per module. Share state excludes the Wi-Fi password, the other forms' fields and the logo; restored `fg`, `bg`, `quiet` and `size` are validated and clamped.

## Limits

- `maxBytes`: 2953 (L), 2331 (M), 1663 (Q), 1273 (H) bytes at version 40.
- No mixed-mode segmentation, Kanji, ECI or Micro QR. Logo under 1 MB (`MAX_LOGO_BYTES`), size 64–4096 px, quiet zone 0–16.

## Tests

- Unit: `tests/tools/qr-code-generator/qr-code-generator.test.ts` (capacity tables, alignment positions, format/version bits, mode choice, ISO Annex I and "HELLO WORLD" codewords, UTF-8, block interleaving, version fitting, symbol read-back across versions and levels, mask penalties, oversize input; Wi-Fi, mailto, tel, SMS, geo and vCard payloads; SVG path, colour and logo sanitising, contrast). `npm test -- qr-code-generator`
- E2E: `e2e/qr-code-generator.spec.ts` (mode and version in the status, error-correction level, PNG and SVG downloads, Copy SVG, Wi-Fi escaping with masked password, logo forcing H, low-contrast warning, no off-origin requests; phone layout). `npm run test:e2e -- qr-code-generator`

## Known Gaps

- No decoder to verify a code after a logo is added; users must test-scan.
- PNG output uses a whole number of pixels per module, so its size doesn't match **Size (px)** exactly.
- The **Error correction** control still accepts clicks while a logo forces H; the choice only applies after the logo is removed.
- The page ends with a short privacy/encoder paragraph that overlaps with `docs.ts`.
