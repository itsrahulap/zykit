# HTTP Status Codes

## Purpose

Searchable reference of the registered HTTP status codes, with meaning, typical use, cacheability, retry hint, related headers and the defining RFC. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `HttpStatusPage.tsx` | Search box, class filter, grouped cards, `#404` deep links (scroll + highlight, `hashchange`), share state |
| `features/statuses.ts` | `STATUSES` data (63 entries: IANA registry + 418), `CLASS_INFO`, `classOf`, `searchStatuses` |

## Core Logic

`searchStatuses` treats `1xx`–`5xx` as a class filter, 1–3 digits as a code prefix, and anything else as words that must all appear in the code, name, meaning, usage or headers; results are ranked exact name → all words in name → other, then by code. Deep links use a plain `#<code>` hash, separate from the `#s=…` share fragment handled by `useShareState` (`query`, `filter`, `code`).

## Limits

- Static data; only registered codes plus 418, no vendor codes (499, 52x…).
- `cacheable` and `retry` are general guidance per RFC 9110/9111, not per-server behaviour.

## Tests

- Unit: `tests/tools/http-status/statuses.test.ts` (registry coverage, sorted and complete entries, key headers, `classOf`, search by code, prefix, name and words with ranking). `npm test -- http-status`
- E2E: `e2e/http-status.spec.ts` (search, class filter, `#` deep link highlighting, 320 px layout). `npm run test:e2e -- http-status`

## Known Gaps

- No unofficial or vendor-specific codes.
- The registry is copied by hand; new IANA registrations need a manual update.
