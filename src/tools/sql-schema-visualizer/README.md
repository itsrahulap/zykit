# SQL Schema Visualizer

## Purpose

Turns PostgreSQL DDL into an interactive ER diagram (tables, keys, foreign keys) with SVG, PNG and Mermaid `erDiagram` export, and hands the schema to the [PostgreSQL Query Builder](../postgres-query-builder/). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `SqlSchemaVisualizerPage.tsx` | Page: input, issues list, exports, PNG rendering via canvas, Query Builder hand-off |
| `components/SchemaDiagram.tsx` | Interactive SVG: pan/zoom (pointer, keyboard, Ctrl/⌘+wheel), fit, search, highlight, table list |
| `features/parser.ts` | Tokenizer + parser for the DDL subset, issues with line/column, name-based suggestions |
| `features/diagram.ts` | Layered auto-layout, FK edge paths, SVG string export, Mermaid export |
| `features/queryBuilder.ts` | Conversion to the Query Builder's `Project` model and JSON format |

## Core Logic

- **Tokenizer** (`parser.ts`): words (folded to lower case), quoted identifiers (`""` unescaped), `'…'`/`E'…'` strings, `$tag$…$tag$`, numbers, punctuation; `--` and nested `/* */` comments are skipped. Unterminated strings, quotes or comments are a fatal error with a position.
- **Parser**: statements split at top-level `;`. `CREATE TABLE`, `CREATE [UNIQUE] INDEX` and `ALTER TABLE … ADD` are parsed with a token cursor; anything else becomes an issue with its line and is skipped. Inside a table a bad element (e.g. `EXCLUDE`) is reported and only that element is skipped. Foreign keys are resolved after all statements, so forward references work; unknown tables or columns are reported, never drawn.
- **Layout** (`diagram.ts`): Kahn topological order on the FK graph (cycles broken by taking the next unplaced table), layer = longest path from referenced tables, layers ordered by parent position and wrapped into extra columns when tall. Boxes are sized from text length and clipped with `…`.
- **Exports**: the SVG string and Mermaid text are built from the model; SVG text is XML-escaped (forbidden control characters replaced), Mermaid names are reduced to `[A-Za-z_][A-Za-z0-9_-]*` with dedupe suffixes and the original kept in a `#quot;`-escaped comment. PNG draws that SVG (as a `data:` URL) onto a canvas.
- **Query Builder hand-off**: imports the Query Builder's model types and `exportProject`/`importProject`; the project is validated with `importProject` before being written to its `localStorage` key (`STORAGE_KEY`, imported from its `hooks/useProject.ts`) and navigating there. A saved project with tables is replaced only after a confirm. The same JSON can be downloaded and imported there instead.

## Limits

- 1,000,000 input characters, 500 tables; PNG up to ~40 MP and 16,384 px per side.
- Parser and layout are iterative (no recursion), so nesting depth in the input can't overflow the stack.
- Parsing runs on the main thread behind `useDeferredValue`; a 1 MB dump parses in well under a second.
- Query Builder: up to 200 tables / 200 columns; unsupported types become `TEXT`, composite FKs and expression indexes are dropped, each change listed in notes.

## Tests

- Unit: `tests/tools/sql-schema-visualizer/sql-schema-visualizer.test.ts`. `npm test -- sql-schema-visualizer`
- E2E: `e2e/sql-schema-visualizer.spec.ts`. `npm run test:e2e -- sql-schema-visualizer`

## Known Gaps

- No support for `CREATE TABLE … PARTITION OF / AS / LIKE`, `EXCLUDE`, `ALTER TABLE … ALTER/DROP/RENAME`, `CREATE TYPE` (enums show as their type name), or `U&"…"` identifiers.
- Tables can't be dragged; the layout is automatic only.
- Index-only metadata (expression indexes, partial `WHERE`) is parsed but not shown in the diagram.
- Name-based suggestions are listed, not drawn.
