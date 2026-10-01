# URL Parser

## Purpose

Breaks a URL (optionally relative to a base) into its WHATWG URL parts, lists decoded path segments and lets you edit query parameters and rebuild the URL. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['url']`, `shareable: true`) |
| `UrlParserPage.tsx` | URL and base inputs, Parts panel (masked password), Path segments, editable Query parameters, Rebuilt URL with Send to… / Use as input |
| `features/url.ts` | `parseUrl` (absolute, then relative to base; `MAX_URL_CHARS`), `defaultPort`, `safeDecode`, `pathSegments`, `paramRows`, `rebuild`, RFC 3492 `punycodeDecode` / `hostToUnicode` |

## Core Logic

`parseUrl` tries `new URL(input)` first and falls back to `new URL(input, base)` only when a base is given; without one it distinguishes "looks relative" from "invalid" for the error message. Query edits are kept in page state keyed by `url.href`, so a new input resets them. `rebuild` replaces `search` with a fresh `URLSearchParams` built from the rows (order and duplicates kept, fully empty rows dropped). Share state is `{ input, base }` only.

## Limits

- `MAX_URL_CHARS` = 100,000.
- Default ports known for `http`, `https`, `ws`, `wss`, `ftp` only.
- Rebuilding normalises the query with `URLSearchParams` encoding.

## Tests

- Unit: `tests/tools/url-parser/url.test.ts` (absolute parsing, relative resolution, error messages, IDN hosts and opaque paths, default ports, query rebuild order/duplicates). `npm test -- url-parser`
- E2E: `e2e/url-parser.spec.ts` (parts, masked password, query editing, invalid and relative URL errors, 320 px layout). `npm run test:e2e -- url-parser`

## Known Gaps

- Only the query is editable; no editing of host, path or hash.
- No option to preserve the original query encoding when rebuilding.
