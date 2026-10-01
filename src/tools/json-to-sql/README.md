# JSON to SQL

## Purpose

Generates `CREATE TABLE` and batched `INSERT` statements from a JSON array of objects for PostgreSQL, MySQL, SQLite and SQL Server, with per-column type inference and dialect-correct quoting. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `produces: ['sql']`, not shareable) |
| `JsonToSqlPage.tsx` | Page: input, dialect/table/batch/PK options, error panels, SQL output with Copy/Send to/Download, warnings, column list |
| `features/sql.ts` | `quoteIdent`, `quoteTable`, `quoteString`, type inference (`kindOf`, `merged`, `sqlTypeFor`), `literal`, `collectColumns`, `generateSql` |
| `../json-formatter/features/json.ts` | `parseJson` (raw-text tree, exact numbers), `decodeString`, `formatJson` |

## Core Logic

`collectColumns` unions keys across rows (first-seen order; `''` → `column`). For each column, `generateSql` gathers stats: kinds, nulls/presence, max code-point length, BigInt min/max for integers, integer digits/scale, and time-zone presence. `merged` collapses kinds (numeric mix → decimal/float, date + timestamp → timestamp, anything else mixed → text), and `sqlTypeFor` maps the result per dialect. Literals come only from the parse tree: number `raw` text as-is, strings via `quoteString` (lone surrogates replaced with U+FFFD). Batch size is clamped to `MAX_BATCH[dialect]`. The page parses synchronously in a `useMemo` over `useDeferredValue(input)`.

## Limits

- `MAX_INPUT_CHARS` = 10,000,000; `MAX_PREVIEW_CHARS` = 1,000,000; files via `OpenFileButton` (10 MB default).
- `MAX_BATCH`: postgres 10,000, mysql 10,000, sqlite 500, sqlserver 1,000.
- VARCHAR buckets 16/32/64/128/255; NUMERIC precision up to 1000 (PostgreSQL), DECIMAL 65/30 (MySQL), 38 (SQLite type name, SQL Server).

## Tests

- Unit: `tests/tools/json-to-sql/sql.test.ts` (hostile-string round-trips through a per-dialect literal tokenizer, dialect-specific forms, PostgreSQL NUL removal, lone surrogates, identifier and schema-qualified quoting, CREATE TABLE and batching, per-dialect types and literals, integer sizes and big numbers, dates and varchar sizes, mixed types, key union, SQL Server batch cap, single object, hostile keys, primary-key warnings, non-object rows). `npm test -- json-to-sql`
- E2E: `e2e/json-to-sql.spec.ts` (generating SQL with options, non-row and invalid-JSON errors, 320 px layout). `npm run test:e2e -- json-to-sql`

## Known Gaps

- Generated SQL isn't executed against real engines in tests; literal safety is checked with a tokenizer.
- No flattening of nested objects, no upsert/`ON CONFLICT`, no index or foreign-key output.
- Duplicate keys in one object silently keep the last value (no warning).
