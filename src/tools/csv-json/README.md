# CSV ↔ JSON

## Purpose

Converts CSV/TSV to JSON (objects or arrays, with optional type inference) and JSON arrays or objects back to CSV. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces`: `csv`, `json`; `shareable: true`) |
| `CsvJsonPage.tsx` | Page: direction, options, input, notices, output; share state, Send to… intake, Swap |
| `features/convert.ts` | `inferCell`, `uniqueHeaders`, `rowsToJson` (rows → JSON), `jsonToRows` (JSON → rows, key union, `a.b` flattening) |
| `../../shared/lib/csv.ts` | Shared RFC 4180 `parseCsv` / `writeCsv`, `detectDelimiter`, BOM stripping |

## Core Logic

The page converts synchronously on the main thread inside a `useMemo` over a `useDeferredValue` of the input. CSV → JSON: `parseCsv` (single forward scan, issues capped at 100, first 3 shown) then `rowsToJson`, which pads the header to the widest row and counts ragged rows. `inferCell` only turns strings into numbers when they match a JSON number and, for integers, are safe integers. JSON → CSV: `parseJsonText` (located errors) then `jsonToRows`; non-array/non-object input throws `JsonShapeError`. Flattening stops at depth 50 and leaves empty objects as `{}`.

## Limits

- `MAX_INPUT_CHARS = 25_000_000`; files go through `readTextFile` (10 MB cap, binary refused).
- Delimiters: `,` `;` `\t` `|`. Detection samples the first 64 KB / 30 lines.
- Output preview capped at `MAX_PREVIEW_CHARS` (1,000,000) by `OutputPanel`.

## Tests

- Unit: `tests/tools/csv-json/convert.test.ts` (type inference and safe-number rules, unique headers, objects/arrays shapes, key union and flattening, accepted JSON shapes, quoting round-trip). The parser itself is covered by `tests/shared/csv.test.ts`. `npm test -- csv-json`
- E2E: `e2e/csv-json.spec.ts` (both directions, opening a file, JSON error reporting, 320 px layout). `npm run test:e2e -- csv-json`

## Known Gaps

- No worker: very large inputs convert on the main thread (deferred, but still blocking while it runs).
- In **Arrays** output, ragged rows are not padded to the header width.
- Arrays inside objects are always written as JSON text; there is no option to explode them into rows or indexed columns.
