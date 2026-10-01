# XML ↔ JSON

## Purpose

Converts XML to JSON and JSON to XML with a fixed set of conventions (`@attr`, `#text`, `#cdata`, `#comment`, `?xml`), using its own strict, entity-safe XML parser. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces`: `xml`, `json`; `shareable: true`) |
| `XmlJsonPage.tsx` | Page: direction and options, input, error/notices, output, share state, Send to… intake, Swap, "Conventions" panel |
| `features/xml.ts` | `parseXml` (hand-written parser to an `XmlNode` tree), `xmlToJson`, `jsonToXml`, `escapeText`/`escapeAttr`, `isXmlName` |
| `../../shared/lib/textpos.ts` | `textError` (offset → line/column), `parseJsonText` |

## Core Logic

`parse` is a single forward scan with an explicit element stack (depth capped at `MAX_DEPTH`). It handles comments (rejecting `--`), CDATA, PIs (the XML declaration must be at offset 0), DOCTYPE (skipped with quote- and `[ … ]`-aware scanning and a notice), and tags with attribute checks: quoting, duplicates, no `<`, and tab/CR/LF normalised to spaces. Errors are `XmlError`s with an offset, mapped to line/column. `elementToJson` groups children by name, so sibling order across different names and text/element interleaving are lost. `jsonToXml` emits lines with an indent unit, validates names with `isXmlName`, strips XML-invalid control characters, and splits `]]>` inside CDATA. Conversion is synchronous in a `useMemo` over `useDeferredValue(input)`.

## Limits

- `MAX_INPUT_CHARS` = 20,000,000; files via `OpenFileButton` (10 MB default). `MAX_DEPTH` = 1000 for both directions.
- Output preview capped at 1,000,000 characters by `OutputPanel`.

## Tests

- Unit: `tests/tools/xml-json/xml.test.ts` (elements, attributes, text and repeated siblings; entities, CDATA and attribute whitespace; always-arrays, coercion, comments, no trim; DOCTYPE/entity safety; error positions; deep nesting; JSON → XML elements, escaping, declaration, multiple roots, compact output, invalid names, CDATA splitting; round-trip). `npm test -- xml-json`
- E2E: `e2e/xml-json.spec.ts` (both directions, error line and column, entity expansion refused, 320 px layout). `npm run test:e2e -- xml-json`

## Known Gaps

- No namespace resolution and no ordered/mixed-content mode; CDATA isn't preserved as `#cdata` going XML → JSON.
- With **Always use arrays**, the root also becomes an array, so swapping back wraps the document in an extra `<root>` (with the "exactly one root" notice).
- JSON → XML uses `JSON.parse`, so big integers are rounded and duplicate keys collapse.
- Runs on the main thread; no worker for very large documents.
