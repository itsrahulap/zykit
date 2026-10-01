# JSON Schema Validator

## Purpose

Validates a JSON document against a JSON Schema (draft 2020-12 or draft-07) with a self-contained validator in a worker, and infers a schema from sample JSON. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces: ['json']`, `shareable: true`) |
| `JsonSchemaPage.tsx` | Page: draft/format options, schema and document inputs with syntax errors, notices, error list, Generate schema, share state, Send to… intake |
| `features/json-schema.ts` | `detectDraft`, `SchemaIndex` (pointers, `$id` bases, anchors), `Validator`, `FORMATS`, `isMultiple`, `validate`, `inferSchema` |
| `hooks/useValidation.ts` | Debounced (150 ms) worker requests with a `TIMEOUT_MS` (3 s) kill switch |
| `workers/validate.worker.ts` | `JSON.parse` both texts and run `validate` |
| `../json-formatter/features/json.ts` | `parseJson` for located syntax errors |

## Core Logic

`SchemaIndex` walks the schema once and records a JSON Pointer for every subschema, its base URI (resolved against `https://zykit.invalid/schema.json`), `$id` resources and `$anchor`/`$dynamicAnchor`/draft-07 `#id` anchors. `resolve` only looks up that index, so no network access is possible. `Validator.v` is a recursive collector that returns every error with instance and schema paths. Depth is capped at `MAX_DEPTH` to catch `$ref` loops, and regexes are compiled once (`u` flag, falling back to non-unicode). `isMultiple` scales decimals to integers to avoid float error. `inferSchema` merges samples into a `Shape` (types, per-key counts for `required`, merged items, a common format from `DETECT`) and renders a `type` list or `anyOf`. The page checks syntax with `parseJson` and only sends syntactically valid texts to the worker.

## Limits

- `TIMEOUT_MS` = 3000; `maxErrors` default 500; validator `MAX_DEPTH` = 300; inference stops at depth 200.
- No input size cap on the textareas; files via `OpenFileButton` (10 MB default).

## Tests

- Unit: `tests/tools/json-schema/json-schema.test.ts` (a JSON-Schema-Test-Suite style subset covering types, enum/const, numeric and string limits, patterns, arrays, objects, dependencies, applicators, `$ref`/`$anchor`/`$id`, draft-07 `$ref` siblings, formats; error paths, remote refs, `$ref` loops, error cap, invalid patterns, draft detection, `multipleOf` with decimals, schema inference). `npm test -- json-schema`
- E2E: `e2e/json-schema.spec.ts` (error list and schema generation, catastrophic pattern timeout and recovery, 320 px layout). `npm run test:e2e -- json-schema`

## Known Gaps

- `unevaluatedProperties` / `unevaluatedItems` are ignored; `$dynamicRef` has no dynamic scope.
- No remote or multi-file `$ref` resolution, and no meta-schema validation of the schema itself.
- The worker uses `JSON.parse`, so big integers and duplicate keys behave as in JavaScript.
