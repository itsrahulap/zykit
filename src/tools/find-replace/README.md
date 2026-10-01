# Find & Replace

## Purpose

Finds and replaces in text with plain strings or JavaScript regular expressions, as an ordered list of rules with live highlighting. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`, `produces: ['text']`, `shareable: true`) |
| `FindReplacePage.tsx` | Options, rule list, text input, highlighted matches with navigation, Result panel, share state, incoming Send to… text |
| `features/findReplace.ts` | `buildRegex`, `literalReplacement`, `runRules`, `toSegments`; reuses `compile` / `findMatches` / `MAX_MATCHES` / `TIMEOUT_MS` from `regex-tester/features/regex.ts` |
| `hooks/useFindReplace.ts` | Debounced (120 ms) worker calls, terminates the worker on timeout or when superseded |
| `workers/` | `findReplace.worker.ts` runs `runRules`; `findReplace.protocol.ts` holds the message types |

## Core Logic

`buildRegex` escapes the find string unless regex mode is on, wraps it in lookarounds for whole word (`\p{L}\p{N}_` with the `u` flag in plain mode, `\w` in regex mode so user patterns don't have to be `u`-valid) and adds `g` plus `i`/`m` from the options. `runRules` feeds each enabled, non-empty rule the previous rule's output: `findMatches` gives the counts and highlight spans (capped at `MAX_MATCHES`), then `String.prototype.replace` does the replacement (without `g` for "Replace first"). Plain-mode replacements go through `literalReplacement` (`$` → `$$`). An invalid regex is reported on its rule and the chain carries on. `toSegments` builds highlight runs rendered as text, never HTML.

## Limits

- `MAX_MATCHES` 5,000 per rule (counts and highlights), `TIMEOUT_MS` 1,000 ms, `MAX_HIGHLIGHT_CHARS` 200,000 on screen.
- Options are global to all rules; no `s`/`u` flags in regex mode.
- Share links restore at most 50 rules.

## Tests

- Unit: `tests/tools/find-replace/findReplace.test.ts` (literal and case-insensitive replace, replace first, `$1`/`$<name>`/`$&`, whole word with non-ASCII text, multiline anchors, rule sequencing and disabled rules, per-rule regex errors, match cap, escaping, highlight segments). `npm test -- find-replace`
- E2E: `e2e/find-replace.spec.ts` (find, highlight, navigate and replace with chained rules; catastrophic pattern stopped without freezing; 320 px layout). `npm run test:e2e -- find-replace`

## Known Gaps

- The per-rule "replaced" count is capped at `MAX_MATCHES` even though `replace` changes every match, so the status line under-reports on very large inputs.
- No per-rule options and no dotAll / Unicode flags.
