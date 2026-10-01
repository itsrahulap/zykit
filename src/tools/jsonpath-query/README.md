# JSONPath Query

## Purpose

Evaluates RFC 9535 JSONPath queries against pasted JSON, listing each match's value and normalized path. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `produces: ['json']`, `shareable: true`) |
| `JsonpathQueryPage.tsx` | Query input, examples, JSON input, result list, copy / download / Send to…, share state |
| `features/jsonpath.ts` | Dependency-free RFC 9535 implementation: `parseQuery` (parser + well-typedness checks), `Evaluator`, `iRegexpToJs`, `normalizedPath`, `evaluate` |
| `features/jsonpath-query.ts` | `runQuery`: query parse, JSON validation via `json-formatter/features/json.ts`, located `TextError`s; `MAX_RESULTS`, `BOOKSTORE`, `EXAMPLES` |
| `hooks/useJsonPath.ts` | Debounced (150 ms) worker requests with a `TIMEOUT_MS` kill switch |
| `workers/jsonpath.worker.ts` | Runs `runQuery` off the main thread |

## Core Logic

The parser builds an AST (segments → selectors; filters as `or` / `and` / `not` / `cmp` / `exists` / `fnTest`) and enforces the RFC's type rules at parse time: only singular queries are comparable, function argument and result types are checked, and errors carry a character offset. The evaluator walks nodes with parent links (for normalized paths), does descendant segments in pre-order with an explicit stack, and counts produced nodes against `MAX_NODES`. `match()` anchors the converted I-Regexp as `^(?:…)$`, `search()` doesn't; both use the `u` flag and are cached per pattern, with invalid patterns treated as non-matching. The document is validated with the strict `parseJson`, then re-read with `JSON.parse` for evaluation.

## Limits

- `MAX_NODES` = 1,000,000; `TIMEOUT_MS` = 3,000; `MAX_RESULTS` = 2,000 matches returned; page shows `MAX_SHOWN` = 300, values cut at `MAX_VALUE_CHARS` = 4,000.
- `JSON.parse` semantics for evaluation: large integers lose precision, last duplicate key wins, integer-like keys ordered first.

## Tests

- Unit: `tests/tools/jsonpath-query/jsonpath-query.test.ts` (RFC 9535 bookstore table and built-in examples, name/wildcard/index/slice/descendant selectors, null semantics, filters and functions, comparison table, well-typedness and syntax errors, JSON error positions, normalized path escaping). `npm test -- jsonpath-query`
- E2E: `e2e/jsonpath-query.spec.ts` (queries with paths, phone layout). `npm run test:e2e -- jsonpath-query`

## Known Gaps

- No compatibility mode for pre-RFC dialects (Goessner/Jayway script expressions, `.length`).
- `iRegexpToJs` only rewrites `.`; it doesn't reject JS-only regex syntax outside the I-Regexp subset.
- Big-number precision is lost because evaluation uses `JSON.parse`, unlike JSON Diff/Formatter.
