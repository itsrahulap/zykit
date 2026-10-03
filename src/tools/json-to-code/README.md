# JSON to Code

## Purpose

Generates Go, Python (dataclass or Pydantic v2), Rust (serde), Java (record or POJO, Jackson), C# (record or class, `System.Text.Json`) and Kotlin (kotlinx.serialization) models from a sample JSON document. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `produces: ['code']`, `shareable: true`) |
| `JsonToCodePage.tsx` | Page: input, language/style/naming/root-name options, syntax error panel, output with Copy/Send to/Download, share state |
| `features/json-to-code.ts` | `generateCode` entry: parse tree → model → source, plus defaults |
| `features/model.ts` | `buildModel`: language-neutral structs and field types from the inferred shape |
| `features/langs.ts` | One renderer per language, `fileNameFor`, language list |
| `features/naming.ts` | Word splitting, casing, Go initialisms, unique and keyword-safe names |
| `../json-to-typescript/features/typegen.ts` | Shape inference (`inferShape`, `Shape`, `pascalCase`, `singularize`), reused, not copied |
| `../json-formatter/features/json.ts` | `parseJson` |

## Core Logic

`inferShape` merges all array items and tracks optional keys, `null`, mixed scalars and whether a number had a fraction. `buildModel` turns that into post-order `StructModel`s (children first), deduping identical shapes by signature and numbering clashing names. Each renderer derives field names with `fieldNames` (casing per language, reserved words get a `_` suffix, duplicates numbered) and writes rename annotations when the identifier differs from the key. Nullable and optional both mean `Option`/pointer/`| None`/`?` types; optional additionally adds `omitempty`, `= None`, `skip_serializing_if` or `WhenWritingNull`. Python dataclasses put defaulted fields last. Roots that aren't objects get an alias where the language has one.

## Limits

- `MAX_INPUT_CHARS` = 5,000,000; files via `OpenFileButton` (10 MB default); depth over 200 becomes “any”.
- Whole numbers are 64-bit integers, others `float64`/`f64`/`double`; no date, enum or big-number types.

## Tests

- Unit: `tests/tools/json-to-code/json-to-code.test.ts` (nested sample in every language and style, naming options, array and empty roots). `npm test -- json-to-code`
- E2E: `e2e/json-to-code.spec.ts`. `npm run test:e2e -- json-to-code`

## Known Gaps

- `json-to-typescript`'s `Shape` gained an optional `float` flag and exports for this tool; its output is unchanged.
- No package/namespace option, no Go `time.Time` or other date mapping, no JSON Schema input.
- Go struct tags drop quotes and backslashes from keys.
