# SVG Optimizer

## Purpose

Minifies and sanitizes SVG markup with a small in-house XML parser and conservative cleaning passes (no SVGO). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `SvgOptimizerPage.tsx` | Options, input, output panel, size change, `<img>` previews from blob URLs, "What changed" and "How it works" panels |
| `features/optimize.ts` | `optimizeSvg` and its passes: `sanitize`, comments, metadata, `removeEditorData` + `removeUnusedNamespaces`, `removeUnusedIds`, `cleanAttributes` / `cleanStyle` (defaults, colours, rounding), whitespace, `removeEmpty`; `MAX_SVG_BYTES`, `DEFAULT_OPTIONS` |
| `features/xml.ts` | `parseXml` (positions for errors, one-level bounded DOCTYPE entity expansion), `serializeXml` (raw values for byte-exact round trips, optional pretty-print), `decodeEntities`, `XmlError` |
| `features/numbers.ts` | `formatNumber`, `joinNumbers`, `parsePath`, `roundPath` (rounds relative coordinates against the rounded current point), `roundList`, `roundTransform`, `isIdentityTransform` |

## Core Logic

The page runs `optimizeSvg(useDeferredValue(input), options)` on the main thread. Passes run in a fixed order: sanitize first, then comments, metadata, editor data, unused IDs, attribute cleaning, whitespace, empty groups (up to 20 rounds). Attribute values are inspected after `decodeEntities` and with control characters stripped (`schemeOf`) so encoded `javascript:` is caught. Inherited defaults are only dropped when there's no `<style>`, the element isn't `<use>` or inside `defs`/`symbol`/`clipPath`/`mask`/`pattern`/`marker`, and no ancestor sets the property. Unparseable path data is left untouched. Transforms are rounded to `precision + 2` decimals (max 8).

## Limits

- 10 MB (`MAX_SVG_BYTES`; file size on open, string length in `optimizeSvg`). Single `<svg>` root required.
- No path merging, shape-to-path conversion, command rewriting or CSS minification.

## Tests

- Unit: `tests/tools/svg-optimizer/svg-optimizer.test.ts` with fixtures in `tests/tools/svg-optimizer/fixtures/` (XML round trip and error positions, entity decoding, number formatting, arc flags, drift-free path rounding, identity transforms, Inkscape / Illustrator / Figma exports, options off, text whitespace, non-SVG root, inherited defaults, sanitizer on and off). `npm test -- svg-optimizer`
- E2E: `e2e/svg-optimizer.spec.ts` (hostile SVG sanitized without running, blob-URL previews, download name, Inkscape file shrink and "What changed", syntax error with line and column, phone layout). `npm run test:e2e -- svg-optimizer`

## Known Gaps

- Optimization runs on the main thread; very large files can make typing lag (mitigated by `useDeferredValue`).
- `removeEmpty` unwraps attribute-less `<g>` elements even when a `<style>` is present, which could change which CSS selectors (e.g. `g > path`) match.
- `optimizeSvg` checks `src.length` (UTF-16 code units) against a byte limit, so pasted text is measured slightly differently from opened files.
- The page has its own "How it works" panel that overlaps with `docs.ts`.
