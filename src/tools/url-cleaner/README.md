# URL Cleaner

## Purpose

Strips tracking parameters from one or many URLs (or from every link in pasted text) and unwraps known redirect links, without requesting anything. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['url']`, `produces: ['url']`, not `shareable`) |
| `UrlCleanerPage.tsx` | Input type switch, input, group checkboxes, unwrap toggle, Also remove / Always keep, output, per-link "What was removed" list (first 500) |
| `features/clean.ts` | `GROUPS` (rules with optional host scoping), `classify`, `REDIRECTORS` / `unwrapOnce`, `SHORTENERS`, `cleanUrl`, `findUrls`, `cleanLines`, `cleanText` |

## Core Logic

`cleanUrl` accepts only `http:`/`https:` URLs, unwraps up to 5 redirectors, then splits the raw `search` on `&` and decodes each key only for matching, so kept pairs are emitted byte-for-byte. `classify` order: `keep` → `extraStrip` (group "Custom") → enabled `GROUPS`; names ending in `*` are prefixes, matching is case-insensitive, and host-scoped rules match the host or a subdomain (after stripping `www.`). The output string is assembled from `href` minus `search`/`hash` to avoid a dangling `?`. `cleanText` replaces each `findUrls` span in place.

## Limits

- No network: shorteners (`SHORTENERS`) only get a note.
- Unwrap depth capped at 5.
- Parameter lists are static; Amazon rules are scoped to 10 domains.

## Tests

- Unit: `tests/tools/url-cleaner/clean.test.ts` (utm and click IDs with fragment kept, empty `?`, host-scoped `si`, email and prefix params, group toggles and custom lists, redirect unwrapping, shortener notes, invalid URLs, `findUrls` punctuation trimming, text and line modes). `npm test -- url-cleaner`
- E2E: `e2e/url-cleaner.spec.ts` (stripping, unwrapping and Copy all; links in text; 320 px layout). `npm run test:e2e -- url-cleaner`

## Known Gaps

- Tracking tokens in the path (e.g. Amazon `/ref=…`) are not removed.
- Option choices (groups, custom lists) are not remembered between visits.
