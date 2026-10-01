# Encode / Decode

## Purpose

Converts text to and from Base64, Base64URL, URL encoding, HTML entities and hex, working on UTF-8 bytes. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text', 'url', 'jwt']`, `produces: ['text']`) |
| `EncodeDecodePage.tsx` | Codec and direction pickers, swap, input/output panes, Send to… intake (JWT → payload segment as Base64URL, URL → URL decode) |
| `features/codecs.ts` | `CODECS` labels and hints, `transform`, `htmlEncode` / `htmlDecode` (named-entity table `NAMED`), `hexToBytes`, strict `utf8Decode`, `CodecError` |

Shared code: `src/shared/lib/base64.ts` (strict RFC 4648 encoder/decoder), `bytesToHex` from `src/shared/lib/bytes.ts`.

## Core Logic

`transform(codec, direction, input, opts)` is pure and synchronous; the page runs it in a `useMemo` on every change and turns `CodecError` into the inline error. Byte-based codecs encode with `TextEncoder` and decode through a fatal `TextDecoder`, so non-UTF-8 results throw. URL codecs wrap the built-in `encodeURI*` / `decodeURI*` and translate their `URIError`s. HTML decoding is a regex over `&…;` with no DOM involvement.

## Limits

- Text only; binary results are rejected. No file output.
- HTML decoding covers a fixed subset of named entities.
- File input via `OpenFileButton` / `CodeArea` drop, 10 MB cap (`MAX_TEXT_FILE_BYTES`).

## Tests

- Unit: `tests/tools/encode-decode/codecs.test.ts` (Unicode round trips for every codec, RFC 4648 vectors, Base64 errors and padding, URL malformed / lone-surrogate errors, HTML escape and decode rules, hex separators and errors). `npm test -- encode-decode`
- E2E: `e2e/encode-decode.spec.ts` (encode, swap, hex, Base64 and HTML decode with no off-origin requests; phone layout). `npm run test:e2e -- encode-decode`

## Known Gaps

- No binary mode (decode Base64 to a downloadable file, or encode a file's bytes).
- The page footer (`EncodeDecodePage.tsx`) repeats the privacy note now shown by `docs.ts`.
