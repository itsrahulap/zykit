# Mock API Generator

## Purpose

Lets you define fake API endpoints (method, path, status, JSON response) and export them as fixture files, a json-server `db.json`, or an OpenAPI 3.1 document that Prism can serve. It never hosts anything. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `MockApiGeneratorPage.tsx` | Sample picker, project import/export, endpoint list + editor with inline errors, export preview (OpenAPI YAML/JSON, db.json), fixtures ZIP |
| `features/mock-api-generator.ts` | `SAMPLES`, `pathError` / `validateProject`, `fixtureFiles`, `jsonServerDb`, `openApiDocument`, `exportProject` / `importProject` |

## Core Logic

`validateProject` checks each path segment (letters, digits, `._~-`, or a `:id` / `{id}` parameter, each name once), the status (100–599) and the body (`parseJsonText`, with line/column), and flags routes that differ only in parameter names (`GET /users/:id` vs `GET /users/{userId}`). Exports only run when everything is valid. `openApiDocument` converts `:id` to `{id}`, declares every path parameter once per path item, and puts each body under `responses.<status>.content.application/json.example`, which Prism serves. `jsonServerDb` takes only `GET /<name>` endpoints that return an array, because that's the shape json-server understands; other endpoints are counted as skipped. The project is kept in `localStorage` through `createStore` (`zykit-mock-api-project`). `importProject` validates every field of the untrusted file and caps it at 500 endpoints. YAML output reuses the YAML ↔ JSON tool's `jsonToYaml`, which lazy-loads `yaml`.

## Limits

- One response per method and path; no request matching, headers, delays or random data.
- The OpenAPI document has examples but no schemas.
- Output was checked by unit tests, not by running Prism or json-server.

## Tests

- Unit: `tests/tools/mock-api-generator/mock-api-generator.test.ts` (path rules, duplicate routes, JSON errors, fixture names, db.json shape, OpenAPI structure and declared parameters, project round trip and hostile files). `npm test -- mock-api-generator`
- E2E: `e2e/mock-api-generator.spec.ts`. `npm run test:e2e -- mock-api-generator`

## Known Gaps

- No response headers or multiple examples per status.
- No import from an existing OpenAPI file (planned with the OpenAPI Designer).
