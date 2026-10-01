# HTTP Headers Inspector

## Purpose

Parses pasted raw HTTP headers, explains each one, grades response security headers and summarises caching. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['headers']` for Send to…) |
| `HttpHeadersPage.tsx` | Input (paste, drop, Open file, sample), security panel, caching panel, header list, skipped lines |
| `features/parse.ts` | `parseHeaders`: curl `-I`/`-v`/`-IL`, DevTools copies, pseudo headers, folding, request/response detection, `MAX_INPUT_CHARS`, `SAMPLE_HEADERS` |
| `features/headers.ts` | `HEADERS` database (~95 entries: category, description, `on`, `deprecated`) and `headerInfo` |
| `features/values.ts` | Value parsers and per-header breakdowns: directives, CSP, `Set-Cookie`, HSTS, media types, `describeValue`, `humanDuration` |
| `features/review.ts` | `reviewSecurity` (checks, score, grade) and `summariseCaching` |

## Core Logic

`parseHeaders` splits the input into blocks at every status/request line, picks the last response block (or the last block), then reads `name: value` lines; names must be RFC 9110 tokens, otherwise the line goes to `invalid`. `reviewSecurity` builds a list of `Check`s and scores `100 − 20·bad − 7·warn` (A+ = 100, A ≥ 90, B ≥ 75, C ≥ 60, D ≥ 45, else F). `summariseCaching` derives freshness from `max-age`, `Expires − Date` or heuristics and adds notes for common misconfigurations. Security and caching run only when `kind === 'response'`.

## Limits

- `MAX_INPUT_CHARS` = 512 KB (input is truncated with a notice); file input capped by `MAX_TEXT_FILE_BYTES` (10 MB).
- No fetching: headers must be pasted (CSP `connect-src 'self'`).
- Not `shareable`.

## Tests

- Unit: `tests/tools/http-headers/headers.test.ts` (status lines, duplicates, folding, `curl -IL` and `-v`, DevTools copies, pseudo headers, request detection, value parsers, header database size, security grading, caching summaries). `npm test -- http-headers`
- E2E: `e2e/http-headers.spec.ts` (sample with grade and caching, curl `-v` and request headers, 320 px layout). `npm run test:e2e -- http-headers`

## Known Gaps

- Only the last response of a multi-response paste is analysed; there's no redirect-chain view.
- CSP review is heuristic (no full CSP Level 3 evaluation, e.g. `script-src-elem`, `require-trusted-types-for`).
