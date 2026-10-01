# Image to Base64

## Purpose

Encodes an image as Base64, a data URI, a CSS rule or an `<img>` tag, and decodes Base64 or data URIs back into a downloadable image. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `ImageBase64Page.tsx` | Encode / decode tabs, previews, snippet picker, downloads |
| `features/base64-image.ts` | Pure logic: `encodeImage`, `snippet` (data URI / Base64 / CSS / HTML with escaped alt), `decodeInput` (wrapper extraction, data URI parsing, type check), `downloadName` |

Shared code this tool depends on: `src/shared/lib/base64.ts` (strict `bytesToBase64` / `base64ToBytes`), `sniffImageType` in `src/shared/lib/image.ts`, `usePageFileIntake` / `useObjectUrl`.

## Core Logic

Encode: the file is size-checked (`MAX_ENCODE_BYTES`), sniffed by magic bytes (non-images are refused), and the sniffed MIME goes into the data URI. Decode: `decodeInput` cuts a `data:` URI out of any wrapper at the first `"`, `'`, `)` or `>`, parses `;base64` vs percent-encoded payloads, auto-detects Base64URL when the text contains `-`/`_` but no `+`/`/`, then sniffs the bytes and warns on a declared/detected mismatch. Everything runs on the main thread.

## Limits

- `MAX_ENCODE_BYTES` 10 MB, `MAX_DECODE_BYTES` 20 MB (input text capped at roughly the matching Base64 length).
- Output preview is cut at `MAX_PREVIEW_CHARS` (1M characters).

## Tests

- Unit: `tests/tools/image-base64/image-base64.test.ts` (overhead, CSS/HTML snippets and escaping, size cap, raw / wrapped / CSS / HTML / Base64URL / percent-encoded input, type mismatch and non-image warnings, strict errors). `npm test -- image-base64`
- E2E: `e2e/image-base64.spec.ts` (encode then decode round trip, phone layout). `npm run test:e2e -- image-base64`

## Known Gaps

- No "Send to…" for the output, and decoded input doesn't accept handoffs.
- The page has its own "Good to know" panel that overlaps with `docs.ts`.
