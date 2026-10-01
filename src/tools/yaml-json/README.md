# YAML ↔ JSON

## Purpose

Converts YAML (multi-document, anchors, aliases, merge keys) to JSON and JSON to YAML using the `yaml` package, with warnings for YAML features JSON can't represent. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces`: `yaml`, `json`; `shareable: true`) |
| `YamlJsonPage.tsx` | Page: direction and options, input, error panel, notices, output, share state, Send to… intake, Swap |
| `features/convert.ts` | `yamlToJson` / `jsonToYaml`; lazy `import('yaml')` so the library is its own chunk |
| `../../shared/lib/textpos.ts` | `textError` (offset → line/column), `parseJsonText` |

## Core Logic

`yamlToJson` calls `parseAllDocuments` with `merge: true`, `uniqueKeys: true` and `logLevel: 'error'`. It returns the first document error with its offset, then walks each document with `YAML.visit` to count aliases and collect non-string keys, collection keys, non-core tags and non-finite numbers for warnings (`TAG_RESOLVE_FAILED` warnings are suppressed in favour of the custom-tag notice). `toJS({ maxAliasCount: MAX_ALIAS_COUNT })` throws on alias bombs, and that error is reworded as a billion-laughs error. `jsonToYaml` uses `JSON.parse` (via `parseJsonText`) and `YAML.stringify` with `version: '1.1'` and `aliasDuplicateObjects: false`. The page converts asynchronously in an effect keyed by input and options; stale results are discarded.

## Limits

- `MAX_INPUT_CHARS` = 20,000,000; files via `OpenFileButton` (10 MB default).
- `MAX_ALIAS_COUNT` = 100; output preview capped at 1,000,000 characters by `OutputPanel`.

## Tests

- Unit: `tests/tools/yaml-json/convert.test.ts` (maps/lists/scalars, anchors and merge keys, multi-document handling, JSON indent, error positions, warnings for non-JSON features, billion-laughs refusal, empty input, JSON → YAML indent/quote/line width, JSON error position, round-trip). `npm test -- yaml-json`
- E2E: `e2e/yaml-json.spec.ts` (both directions with options and Swap, duplicate-key error with jump to error, non-string key and custom tag warnings, 320 px layout). `npm run test:e2e -- yaml-json`

## Known Gaps

- No big-number handling (`intAsBigInt` is off), so large integers are rounded in both directions.
- Only the first parse error is reported; the YAML version can't be switched (always 1.2 in, 1.1 quoting out).
- Runs on the main thread; no worker for very large documents.
