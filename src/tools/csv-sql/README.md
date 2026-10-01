# Query CSV with SQL

## Purpose

Loads CSV/TSV files as tables in an in-memory SQLite database (sql.js, WebAssembly) and runs arbitrary SQL against them, with CSV/JSON export of the result. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['csv']`, `shareable: false`) |
| `CsvSqlPage.tsx` | Page: add/paste/drop data, schema sidebar, SQL editor and examples, virtualised result table, export; Send to… intake via `useIncomingText` |
| `features/csv-sql.ts` | Pure logic: table/column naming, `inferType`/`coerce`, `createTableSql`, `exampleQueries`/`joinColumns`, `resultToCsv`/`resultToJson`, `mayChangeSchema`, limits and sample data |
| `hooks/useSqlDb.ts` | Owns the worker: request/response map, size check, query timeout, cancel by terminate-and-reload |
| `workers/sql.worker.ts` | sql.js database; CSV parse and bulk insert in one transaction, query execution, schema, export |
| `workers/sql.protocol.ts` | Worker message types |
| `../../shared/lib/csv.ts` | Shared `parseCsv`, `detectDelimiter`, `stripBom`, `writeCsv` |

## Core Logic

The worker is created lazily and lazily initialises sql.js with the bundled `sql-wasm.wasm` URL. The worker script gets its own CSP with `'wasm-unsafe-eval'` (`vercel.json`, `/assets/sql-worker-*`), and the page CSP never does. Loading a table: binary sniff (NUL in the first 8 KB), `parseCsv` (forced tab for `.tsv`/`.tab`), `columnNames`, `inferTypes`, `DROP TABLE IF EXISTS` + `CREATE TABLE`, then a prepared `INSERT` inside `BEGIN`/`COMMIT`. Queries run through `iterateStatements`. The last statement with columns becomes the result, and its rows are kept in the worker (`last`) so export doesn't round-trip through the page. The schema is re-read only when `mayChangeSchema` says the SQL might change it. Cancel and timeout terminate the worker and reload the original sources into a new one. Tables created by queries are not sources, so they are lost.

## Limits

- `MAX_TOTAL_BYTES` = 200 MB (string length / `File.size`, checked in `useSqlDb.add`).
- `MAX_DISPLAY_ROWS` = 1,000 sent to the page; `MAX_EXPORT_ROWS` = 500,000 kept for export.
- `TYPE_SAMPLE` = 1,000 non-empty values per column; `QUERY_TIMEOUT_MS` = 30,000.
- BLOB values are shown as `[BLOB n bytes]`.

## Tests

- Unit: `tests/tools/csv-sql/csv-sql.test.ts` (table name sanitising and uniqueness, column naming, identifier quoting, type inference and "all TEXT", value coercion, join-key detection, example queries, CSV/JSON export, `mayChangeSchema`). `npm test -- csv-sql`
- E2E: `e2e/csv-sql.spec.ts` (loading files, inferred types, page vs worker CSP, GROUP BY and JOIN, CSV/JSON export, SQLite error text, cancelling a runaway query and reload, no off-origin requests, 320 px layout). `npm run test:e2e -- csv-sql`

## Known Gaps

- The worker itself is not unit-tested; it is only covered by the E2E spec.
- No way to set the delimiter or turn off the header row for a file.
- Changes made by queries can't be persisted or exported as a database file.
- `drop` sends `DROP TABLE`, so removing a view created by a query from the sidebar fails silently.
