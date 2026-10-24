# OpenAPI Designer

## Purpose

Form-based editor for OpenAPI 3.1 documents with live JSON/YAML output, validation, a per-endpoint docs preview and a handoff to the OpenAPI Dependency Mapper. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `OpenapiDesignerPage.tsx` | Page: import, info/servers/tags/paths forms, validation, output tabs, "Map dependencies" |
| `components/OperationEditor.tsx` | One operation: parameters, request body, responses, tags |
| `components/SchemasEditor.tsx` | Component schemas as JSON text with per-schema parse errors |
| `components/DocsPreview.tsx` | Endpoint docs with example curl and responses |
| `components/fields.tsx` | Labelled inputs and add/remove buttons |
| `features/openapi.ts` | Parse (JSON/YAML), validate, `$ref` resolve/collect, unsupported-construct list, serialize. **Shared with `openapi-dependency-mapper`** |
| `features/editing.ts` | Schema picker choices, copy-on-write updates, operation listing |
| `features/examples.ts` | Example values from schemas, curl request, response examples |
| `features/sample.ts` | Example document (also used by the mapper) |

## Core Logic

The document is kept as plain JSON (`JsonObject`) in a `createStore` localStorage store. Every form edit goes through `produce()` (structuredClone + mutate), so unknown fields survive untouched; `findUnsupported()` only reports what the forms can't edit. `parseSpec()` uses `parseJsonText` for JSON and the YAML tool's `yamlToJson` (alias-capped, located errors) for YAML, then checks size, depth (iterative), Swagger 2 and the `openapi` version. `validateSpec()` checks required fields, path template parameters, statuses, response descriptions, duplicate operationIds and every `$ref` (local refs must resolve; remote refs are warnings, never fetched). YAML output reuses `jsonToYaml` (YAML 1.1 quoting). Examples walk schemas with a depth cap and a seen-set for cycles.

## Limits

2 MB input, 64 nesting levels, YAML alias cap from the YAML tool. Docs preview: 100 endpoints; examples stop at depth 8 and 50 properties per object. All on the main thread (validation and serialization are linear in document size).

## Tests

- Unit: `tests/tools/openapi-designer/` (`openapi.test.ts`: parsing, invalid specs, caps, round trips, refs, validation; `editing.test.ts`: schema picker, updates, examples, curl). `npx vitest run tests/tools/openapi-designer`
- E2E: `e2e/openapi-designer.spec.ts`. `npx playwright test e2e/openapi-designer.spec.ts`

## Known Gaps

- Component schemas are edited as JSON text; the JSON Schema tool's visual builder isn't embedded yet.
- No form for response headers, security schemes, examples objects, callbacks, links, webhooks or path-level parameters (all preserved, listed on import).
- Paths, response statuses and schema names can't be renamed in place (remove and re-add); renaming a tag doesn't update operations.
- 3.0 documents aren't converted to 3.1 (`nullable`, `example` vs `examples`).
- Example values are placeholders, not `mock-data-generator` data.
- Parsing and serialization run on the main thread, not in a worker.
