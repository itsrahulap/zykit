# JSON to TypeScript

## Purpose

Infers TypeScript interfaces or type aliases from sample JSON, merging array items into one shape (optional keys, `| null`, union arrays) and deduplicating identical object shapes. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `produces: ['code']`, `shareable: true`) |
| `JsonToTypescriptPage.tsx` | Page: input, style/root name/export/readonly options, syntax error panel, output with Copy/Send to/Download, date note, share state |
| `features/typegen.ts` | `generateTypes` (`infer` → `merge` → render), `pascalCase`, `singularize`, `propertyKey` |
| `../json-formatter/features/json.ts` | `parseJson` (raw-text tree), `decodeString` |

## Core Logic

`infer` builds a `Shape` per position: a primitive set plus an optional merged object map and array item shape. Deeper than `MAX_DEPTH` it becomes `unknown`. `merge` unions primitives, marks keys missing on either side optional, and recursively merges objects and array items. Rendering registers each non-empty object via `named`, keyed by a signature of its sorted field lines, so identical shapes reuse the first name. Names come from the key hint through `pascalCase`, `singularize`/`itemHint` for array items, a `Type` suffix for `RESERVED` globals and numeric suffixes for clashes. Output is the root first, then nested declarations. Generation is synchronous in a `useMemo` over `useDeferredValue(input)`.

## Limits

- `MAX_INPUT_CHARS` = 5,000,000; files via `OpenFileButton` (10 MB default).
- `MAX_DEPTH` = 200 (deeper values → `unknown`).

## Tests

- Unit: `tests/tools/json-to-typescript/typegen.test.ts` (flat objects, type alias/no export/readonly, array item merging with optional and nullable keys, union and empty arrays, shape dedupe and distinct names, quoted keys, array and primitive roots, nullable object unions, ISO date flag, reserved names, deep nesting, `pascalCase`, `singularize`, `propertyKey`). `npm test -- json-to-typescript`
- E2E: `e2e/json-to-typescript.spec.ts` (generating types with options, syntax error location, 320 px layout). `npm run test:e2e -- json-to-typescript`

## Known Gaps

- No literal/enum inference, no `bigint` for large integers, no `Date` option.
- Signature dedupe only merges fully identical shapes; near-identical ones (one extra optional key) stay separate.
- No JSON Schema or Zod output.
