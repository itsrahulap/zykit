# cURL ↔ Fetch

## Purpose

Converts a pasted cURL command into JavaScript fetch, Node.js fetch, axios or Python requests code, and a `fetch()` call back into cURL, without running anything. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['curl']`, `produces: ['code', 'headers']`, `shareable: false`) |
| `CurlConverterPage.tsx` | Direction and language switches, input, output and Request headers panels, credentials notice, warnings/notes, samples |
| `features/shell.ts` | `tokenizeShell` (POSIX quoting, `$'…'`, continuations, comments, operators; cmd.exe rules auto-detected) and `shellQuote` |
| `features/curl.ts` | `parseCurl`: option table (`OPTIONS`, `IGNORED`), handlers, method defaults → neutral `HttpRequest` |
| `features/generate.ts` | `generate` for `fetch` / `node` / `axios` / `python`, `parseJsonExact`, literal printers, `credentialHeaders` |
| `features/fetch.ts` | `parseFetch` (non-evaluating literal parser) and `toCurl` |

## Core Logic

`parseCurl` tokenizes, cuts at the first control operator, strips `curl`/`curl.exe`, then walks long options (with `--name=value`), bundled short options and positional URLs. Unknown flags become warnings; options in `IGNORED` are collected into one note; recognised-but-unsupported ones get a "no equivalent" note. Method is derived after parsing (`-X` > `-I` > `-G` > `-T` → PUT > body → POST > GET). `generate` runs `prepare`, which folds duplicate headers (cookies with `; `, others with `, `), optionally folds `-u` into `Authorization`, strips `Content-Type` for multipart, and only treats a body as JSON when `parseJsonExact` round-trips it byte-for-byte (after whitespace compaction). `parseFetch` finds the first `fetch(` not preceded by an identifier or `.`, parses literals into `JsValue`, and wraps anything else as `Unresolved` placeholders; `toCurl` adds `-X` only when the method isn't implied.

## Limits

- No file access: `@file` / `<file` references become `<contents of …>` placeholders.
- Only the first command and first URL are converted; no PowerShell parsing.
- Not `shareable` (commands often carry credentials).

## Tests

- Unit: `tests/tools/curl-converter/shell.test.ts` (POSIX and cmd tokenizing, `shellQuote` round trips), `curl.test.ts` (option forms, headers, data variants, `--json`, `-F`, `-u`, `-G`, bundling, ignored/unknown options, Chrome bash/cmd copies, errors), `generate.test.ts` (literal escaping, exact JSON, each target's output and notes, `credentialHeaders`), `fetch.test.ts` (`parseFetch` literals, placeholders, no evaluation, syntax error positions, `toCurl`, round trips). `npm test -- curl-converter`
- E2E: `e2e/curl-converter.spec.ts` (all four targets with no request sent, credentials/warnings/errors, fetch → cURL, examples and 320 px layout). `npm run test:e2e -- curl-converter`

## Known Gaps

- No targets beyond the four listed (e.g. Go, PHP, `http.client`).
- `--data-urlencode @file` and `-H @file` can't be resolved; `--proxy`, `--cert`, `--max-time` and similar have no generated equivalent.
- The fetch parser handles one call and literal values only; `${…}` in template literals is kept as text.
