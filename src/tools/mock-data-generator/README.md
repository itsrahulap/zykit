# Mock Data Generator

## Purpose

Generates reproducible fake rows from a user-defined schema of 25 field types and writes them as JSON, JSON Lines, CSV or SQL. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`produces: ['json']`, `shareable: true`, no `accepts`) |
| `MockDataGeneratorPage.tsx` | Schema editor (per-type options, reorder, remove), output options, `parseSchema` for share links, `OutputPanel` |
| `features/mock-data-generator.ts` | `FIELD_TYPES`, `DEFAULT_FIELDS`, `DEFAULT_SCHEMA`, `MAX_ROWS`, `validateField` / `validateSchema`, `fromPattern`, `generateData`, `toJson` / `toJsonLines` / `toCsv` / `toSql`, `formatData` |
| `features/data.ts` | Name, city/country, street, company, job, reserved email/URL domain lists |

## Core Logic

`generateData` creates one `seededRng` (from `lorem-ipsum/features/lorem-ipsum.ts`) and walks rows in order, so output depends on schema order, row count and seed. A per-row `RowCtx` memoises the person and the city/country pair so related fields agree. Dates are parsed strictly by `dayMs` (UTC, rejects impossible dates). CSV uses `writeCsv` from `src/shared/lib/csv.ts`; SQL converts rows to a `JsonNode` array and calls `generateSql` from `json-to-sql` (`batchSize: 500`, `includeCreate: true`, no primary key). `generateData` assumes a valid schema; the page only calls it when `validateSchema` returns nothing. Generation runs on the main thread behind `useDeferredValue`.

## Limits

- `MAX_ROWS` 10,000; float decimals 0–10; share links accept at most 100 fields, names cut to 100 characters and string options to 2,000.
- IPv4 is not limited to documentation ranges; UUIDs come from the seeded PRNG, not `crypto`.

## Tests

- Unit: `tests/tools/mock-data-generator/mock-data-generator.test.ts` (determinism, well-formed values for every type, consistent name/email/username, row cap, 10,000-row speed, pattern filling and escapes, validation errors, duplicates and empty schemas, typed JSON / JSON Lines, CSV with header, SQL via JSON to SQL). `npm test -- mock-data-generator`
- E2E: `e2e/mock-data-generator.spec.ts` (builds a schema and checks seeded JSON, CSV and SQL; 320 px layout). `npm run test:e2e -- mock-data-generator`

## Known Gaps

- No nested objects, arrays, null rates or cross-field references beyond the built-in links.
- Changing only the SQL dialect or table name doesn't mark the output as busy (`stale` ignores them), though it still regenerates.
