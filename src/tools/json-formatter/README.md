# JSON Formatter

## Purpose

Validates, pretty-prints, minifies and key-sorts JSON while keeping numbers and string escapes byte-for-byte. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces: ['json']`, `shareable: true`) |
| `JsonFormatterPage.tsx` | Page: input, action/indent/sort options, error panel, output preview, stats, share state |
| `features/json.ts` | `parseJson` (strict, iterative RFC 8259 parser to a raw-text tree), `formatJson`, `isBigNumber`, `decodeString`, `utf8Length` |

## Core Logic

`parseJson` is a hand-written state machine (`Value` / `Key` / `After` / `End`) with an explicit stack, so depth is bounded only by memory. Scalars are stored as their source text (`raw`), which is what keeps big numbers and escapes exact. Errors are `ParseError`s with an offset, mapped to line/column by `shared/lib/textpos` and shown with `errorSnippet`. It also collects stats: key count, max depth, numbers over `SAFE_DIGITS` (15) significant digits and up to 5 duplicate keys. `formatJson` is iterative too; `sortKeys` uses a stable code-unit comparison of decoded keys.

## Limits

- `MAX_INPUT_CHARS` = 20,000,000; `MAX_PREVIEW_CHARS` = 1,000,000 shown (copy/download get everything).
- Parsing runs on the main thread (`useDeferredValue`), not in a worker.

## Tests

- Unit: `tests/tools/json-formatter/json.test.ts` (indent styles, minify, recursive sort, top-level scalars, parity with `JSON.stringify`, big numbers and escapes, duplicate keys, stats, depth 5000/200000, error messages and positions, BOM, error snippets). `npm test -- json-formatter`
- E2E: `e2e/json-formatter.spec.ts` (format/minify/sort with big numbers kept, syntax error line and column, validate mode). `npm run test:e2e -- json-formatter`

## Known Gaps

- No JSON5 / JSONC / JSON Lines mode.
- No tree view or collapsible output.
