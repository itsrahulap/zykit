# XML Formatter

## Purpose

Formats, minifies and validates XML (with line/column errors) and tests XPath 1.0 expressions against it. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces: ['xml']`, `shareable: true`) |
| `XmlFormatterPage.tsx` | Page: action/indent/comment options, error panel, output, XPath tester with prefix map |
| `features/xml-formatter.ts` | `formatXml`, `serializeXml`, `runXPath`, `nodePath`, `parseNamespaces` |

## Core Logic

`formatXml` parses with `parseXml` from `xml-json` (strict, no DOCTYPE or entity expansion) and serialises its tree: `isMixed` elements (real text or `xml:space="preserve"`) are written inline with every character, other elements drop blank text and are indented by `pretty`. `runXPath` serialises the checked tree compactly (so the browser never sees a DOCTYPE), parses it with `DOMParser`, and evaluates with `document.evaluate`: a probe with `ANY_TYPE` finds number/string/boolean results, otherwise an ordered snapshot gives the nodes. The namespace resolver uses the prefix map first, then the document element's own declarations.

## Limits

- `MAX_INPUT_CHARS` = 20,000,000; XPath only up to 5,000,000 characters; `MAX_XPATH_ITEMS` = 1000 listed.
- `MAX_DEPTH` = 1000 (from the parser). Well-formedness only, no DTD/XSD.
- The DOCTYPE is dropped, and attribute quoting and character references are normalised.

## Tests

- Unit: `tests/tools/xml-formatter/xml-formatter.test.ts` (indent, mixed content, CDATA, comments, idempotence, errors with positions, DOCTYPE safety, namespace map parsing). `npm test -- xml-formatter`
- E2E: `e2e/xml-formatter.spec.ts` (format, minify, validate error position, XPath nodes/value/namespaces, no network, 320px). `npm run test:e2e -- xml-formatter`
- `runXPath` needs `DOMParser`, so it is covered by E2E only (unit tests run in Node).

## Known Gaps

- No XPath 2.0/3.0, no XSLT, no schema validation.
- No attribute wrapping or sorting; no preservation of original quotes or entities.
