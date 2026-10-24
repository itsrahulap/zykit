# OpenAPI Dependency Mapper

## Purpose

Shows which operations of an OpenAPI 3.x document use which components (schemas, parameters, responses…), as an SVG graph with filters, a details panel, `$ref` problem reports and a Markdown/JSON export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `OpenapiDependencyMapperPage.tsx` | Page: input, filters, SVG graph, details, export |
| `features/dependency-map.ts` | Builds the map, filters it, exports Markdown/JSON |
| `features/layout.ts` | Column layout and edge paths for the SVG graph |

Parsing, `$ref` resolution/collection and the example document come from `../openapi-designer/features/` (`openapi.ts`, `editing.ts`, `examples.ts`, `sample.ts`).

## Core Logic

`buildDependencyMap()` seeds a node for every declared component, then collects `$ref`s per operation (path-level parameters + the operation object) with the designer's iterative `collectRefs`. Local refs are resolved with `resolveRef` (JSON Pointer, own properties only); each new target is queued and its refs collected breadth-first, so nested refs resolve transitively and cycles terminate. Unresolved and remote refs are recorded (deduplicated) with their location. `allRefs` per operation is a reachability walk; a component is `cyclic` when it can reach itself. `filterMap()` applies tag/method/path/schema filters. `layoutGraph()` puts operations in column 0 and each component at its shortest reference depth. Untrusted names are rendered as SVG text and escaped in the Markdown export.

## Limits

2 MB input, 64 nesting levels (shared parser). 2,000 operations, 3,000 components; the graph is drawn for at most 400 visible nodes. Parsing is debounced (250 ms) and runs on the main thread.

## Tests

- Unit: `tests/tools/openapi-dependency-mapper/dependency-map.test.ts` (shared schemas, nested and path-level refs, cycles, missing/remote refs, invalid input, filters, export). `npx vitest run tests/tools/openapi-dependency-mapper`
- E2E: `e2e/openapi-dependency-mapper.spec.ts`. `npx playwright test e2e/openapi-dependency-mapper.spec.ts`

## Known Gaps

- No zoom/pan; large graphs scroll inside their box, and edges can cross in dense specs (no crossing minimisation).
- Webhooks and path-item `$ref`s are reported but not mapped.
- Cycles are flagged per component; the exact cycle path isn't listed.
- Work runs on the main thread, not in a worker.
