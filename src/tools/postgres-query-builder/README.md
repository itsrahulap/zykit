# PostgreSQL Query Builder

## Purpose

Visual schema designer and `SELECT` builder that generates PostgreSQL SQL (query and `CREATE TABLE` DDL) from structured data, entirely in the browser. It never connects to a database. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `PostgresQueryBuilderPage.tsx` | Toolbar (samples, undo/redo, import/export JSON, reset), tabs, empty state, table add/duplicate/delete with confirmation, keyboard undo |
| `hooks/useProject.ts` | Project state with undo/redo history (100 steps), drag gestures as one step, merged typing (`mergeKey`), debounced `localStorage` save, validated reload |
| `components/SchemaCanvas.tsx` | Pointer-event drag, pan, zoom (buttons, Ctrl/⌘ + wheel), fit; SVG relationship curves with 1/N markers; PK/FK/UQ/nullable indicators; connect dots; arrow-key moves |
| `components/TableEditor.tsx` | Table name, columns (type, length/precision/scale, PK, NOT NULL, UNIQUE, identity, default, CHECK, reorder), table CHECKs, indexes |
| `components/RelationshipPanel.tsx` | Relationship list/edit/remove, add form (prefilled from the canvas), junction-table creation |
| `components/QueryBuilder.tsx` | Sources and joins (suggestions need confirmation), select items, GROUP BY, ORDER BY, LIMIT/OFFSET |
| `components/ConditionBuilder.tsx` | Recursive AND/OR groups for WHERE and HAVING |
| `components/SqlPanel.tsx` | Query/DDL output, copy, download, manual edit with a stale-edit notice, `sql-formatter` for hand-edited SQL, plain-language explanation |
| `components/Reference.tsx` | Static PostgreSQL examples (joins, grouping, INSERT/UPSERT/UPDATE/DELETE, EXISTS, CTE) and the parameterized-query note |
| `components/fields.tsx` | Compact inputs, checkbox, native select, problem list, section |
| `features/model.ts` | Types, `PG_TYPES`, operators, factories (`newId`, `newTable`, …), lookups |
| `features/sql.ts` | `quoteIdent` (reserved words, case, 63-byte limit), `quoteString`, `literal` (per-type serialization and validation), `expressionError`, `typeSql`, `keyType` |
| `features/ddl.ts` | `validateSchema`, `relationshipErrors`, `creationOrder`, `generateDdl` |
| `features/query.ts` | `generateQuery` (validation + formatting), `suggestJoinConditions`, `columnOptions`, `refKey` |
| `features/explain.ts` | `explainQuery`: plain-language description from the query model |
| `features/samples.ts` | E-commerce, blog, clinic and project-management schemas with starter queries |
| `features/project.ts` | `exportProject` / `importProject` (strict, size-limited), `junctionTable`, `pruneProject`, relationship drafts |

## Core Logic

Everything references tables and columns by id. `pruneProject` runs after every change and removes relationships, indexes, joins, selected columns, conditions, GROUP BY and ORDER BY entries that point at deleted tables, columns or query sources. `generateDdl` validates first and returns no SQL while errors exist; it orders tables with a dependency sort (self-references ignored), writes foreign keys inline when the parent already exists, and defers the rest to `ALTER TABLE … ADD CONSTRAINT` so cycles work. Constraint and index names follow PostgreSQL's conventions (`<table>_<col>_fkey`, `_idx`, `_key`) truncated to 63 bytes. `generateQuery` likewise validates (joins, grouping with primary-key functional dependency, aggregate types, HAVING/WHERE placement, DISTINCT + ORDER BY, LIMIT/OFFSET) and then prints a fixed, indented layout; columns are qualified only when the query has more than one table. Values go through `literal`, which validates and types them (`DATE '…'`, `'…'::uuid`, `'…'::jsonb`); identifiers through `quoteIdent`. Defaults are typed literals or an allow-listed expression; CHECK text passes `expressionError` (no `;`, comments, unbalanced quotes/brackets).

## Limits

- Imports: 2 MB, 200 tables × 200 columns, 1,000 relationships, 500 items per list, condition depth 8.
- Single-column foreign keys; join conditions are `=` between two columns.
- SELECT only in the builder; no migrations, no execution.

## Tests

- Unit: `tests/tools/postgres-query-builder/sql-generation.test.ts` (quoting, literals, CHECK validation, exact DDL including cycles/self-reference/composite keys/one-to-one, exact SELECT output with joins/aggregates/grouping/nested conditions, validation errors, join suggestions only from relationships, samples, JSON round-trip and rejection, junction tables, pruning). `npm test -- postgres-query-builder`
- E2E: `e2e/postgres-query-builder.spec.ts` (sample load, query SQL, building a join and filter, schema DDL, no network requests, 320 px layout). `npm run test:e2e -- postgres-query-builder`

## Known Gaps

- Hand-edited SQL isn't parsed back into the visual model.
- The canvas has no auto-layout; tables from imports keep their saved positions.
- No unit tests for the React components (covered by E2E).
