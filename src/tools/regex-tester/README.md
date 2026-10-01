# Regex Tester

## Purpose

Tests JavaScript regular expressions live: highlighted matches, a group table, a replacement preview and a token-by-token explainer. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['regex']`, `shareable: true`) |
| `RegexTesterPage.tsx` | Pattern / flags / text / replacement inputs, highlighted text, match table (`TABLE_ROWS` = 500), Replace and Pattern explained panels, share state; incoming `/pattern/flags` literals are split |
| `features/regex.ts` | `FLAGS`, `compile`, `findMatches` (exec loop with empty-match stepping), `replacePreview`, `segments` (highlight runs, rendered as text), `groupNames`, `explain` |
| `hooks/useRegex.ts` | Debounced (120 ms) worker requests; terminates the worker after `TIMEOUT_MS` or when superseded |
| `workers/regex.worker.ts`, `regex.protocol.ts` | Runs `findMatches` + `replacePreview` off the main thread |

## Core Logic

`findMatches` compiles with `new RegExp(pattern, flags)`, resets `lastIndex` and loops `exec` until no match, `max` is reached (`truncated`), or after the first match when not global. Zero-length matches advance `lastIndex` by 1, or 2 across a surrogate pair in `u`/`v` mode. The replacement preview is a plain `text.replace(re, replacement)`. Runaway backtracking can't be interrupted inside a worker, so `useRegex` terminates the worker and lazily creates a new one. `explain` is a linear tokenizer capped at 200 tokens.

## Limits

- `MAX_MATCHES` = 5,000; `MAX_TEXT` = 1,000,000 characters (checked on the page, text not sent when over); `TIMEOUT_MS` = 1,000.
- Flags limited to `g i m s u y d` (`validFlags` drops anything else, including `v`).
- `explain` is best effort: no nesting awareness and no `v`-mode class syntax.

## Tests

- Unit: `tests/tools/regex-tester/regex.test.ts` (global vs single match, empty matches with surrogate pairs, match cap, `d` indices and undefined groups, sticky, syntax errors, `$1` / `$<name>` replacement, highlight segments, group names, explainer tokens). `npm test -- regex-tester`
- E2E: `e2e/regex-tester.spec.ts` (highlights, groups and replacement preview, catastrophic backtracking timeout and recovery, 320 px layout). `npm run test:e2e -- regex-tester`

## Known Gaps

- No `v` flag, no flavour switch (PCRE, Python, .NET).
- Zero-length matches aren't highlighted in the text view.
- The replacement preview runs the regex a second time in the worker, sharing the same timeout.
