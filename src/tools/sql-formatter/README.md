# SQL Formatter

## Purpose

Formats SQL for 20 dialects with the `sql-formatter` library, and minifies it with a dialect-aware tokenizer of its own. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['sql']`, `produces: ['sql']`, `shareable: true`) |
| `SqlFormatterPage.tsx` | Options, lazy `import('sql-formatter')`, format/minify in a `useMemo` on a deferred input, error panel with jump-to-position, output actions, share state |
| `features/minify.ts` | `tokenizeSql` (strings, quoted identifiers, dollar quotes, line/block comments per dialect), `minifySql` (`needsSpace` rules, hint-preserving comment stripping) |
| `features/options.ts` | `DIALECTS` (values are sql-formatter `language` names), `describeFormatError` (summary line + `line`/`column` from the library's message) |

## Core Logic

Format calls `format(text, { language, keywordCase, identifierCase, dataTypeCase, functionCase, tabWidth, useTabs, linesBetweenQueries, denseOperators, logicalOperatorNewline })`, with data-type and function case tied to the keyword case. Minify never consults the library: `tokenizeSql` round-trips the input exactly, and `minifySql` drops whitespace tokens, re-inserting one space only where `needsSpace` says joining could change meaning (word–word, operator–operator, around comments), and a newline after a kept line comment. Dialect sets in `minify.ts` decide `#` comments, backslash escapes, `[…]` identifiers, dollar quoting and nested block comments.

## Limits

- `MAX_INPUT_CHARS` = 5,000,000. Runs on the main thread (deferred value, no worker).
- Formatting quality and accepted syntax are those of `sql-formatter` ^15.9.

## Tests

- Unit: `tests/tools/sql-formatter/minify.test.ts` (tokenizer round-trip, doubled quotes, dialect-specific backslashes / `#` comments / nested comments / brackets / dollar quotes, unterminated strings; minifier whitespace, comment keeping and stripping with hints, no merged tokens or new comments, prefixes, multiple statements, output still formattable; `describeFormatError`). `npm test -- sql-formatter`
- E2E: `e2e/sql-formatter.spec.ts` (format and minify with dialect and case options, comment stripping, parse errors with position and dialect switch, example and 320 px layout). `npm run test:e2e -- sql-formatter`

## Known Gaps

- No unit tests for the format path itself (covered only by E2E).
- Large inputs are formatted synchronously on the main thread.
