# TOML ↔ JSON

## Purpose

Converts TOML 1.0 to JSON and JSON to TOML with no dependencies. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `TomlJsonPage.tsx` | Page: direction, indent, input, error panel, notices, output, share state, Send to… intake, Swap |
| `features/toml.ts` | `parseToml` (own parser), `tomlToJson`, `jsonToToml`, `jsonTextToToml` |

## Core Logic

`parseToml` is a single-pass recursive-descent parser over the string with an offset `i`; every error throws a `TomlSyntaxError` carrying an offset, which `tomlToJson` turns into line/column with `textError`. Tables are null-prototype objects. Four WeakSets track what may be reopened: inline tables and static arrays (`frozen`), `[header]` tables, dotted-key tables, and array tables. Dates become `TomlDate` (its `toJSON` returns the source text). `jsonToToml` writes scalars first, then sub-tables, then arrays of tables; null is dropped with a notice.

## Limits

- Input is 5,000,000 characters; opened files 10 MB.
- Nesting depth 200. Integers are checked against 64 bits and returned as JS numbers (a notice for > 2^53).

## Tests

- Unit: `tests/tools/toml-json/toml.test.ts`. `npm test -- toml-json`
- E2E: `e2e/toml-json.spec.ts`. `npm run test:e2e -- toml-json`

## Known Gaps

- TOML 1.1 syntax is not accepted. Comments and formatting are not preserved. Only the first error is reported.
