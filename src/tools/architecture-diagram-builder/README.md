# Architecture Diagram Builder

## Purpose

An SVG editor for system architecture diagrams (frontend, service, database, cache, queue, external API and generic nodes, labelled directed edges, group boundaries) with undo/redo, zoom/pan, keyboard editing, localStorage autosave, and Mermaid/SVG/PNG/JSON export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition |
| `ArchitectureDiagramBuilderPage.tsx` | Page: history state, toolbar, undo/redo shortcuts, autosave, exports |
| `components/DiagramCanvas.tsx` | SVG canvas: pointer drag/pan/resize, wheel zoom, keyboard move/delete |
| `components/PropertiesPanel.tsx` | Label/kind/size editing and "Add an edge to" for the selection |
| `features/model.ts` | Types, limits, node shapes (SVG paths), label wrapping, edge clipping, bounds, fit/zoom math |
| `features/diagram.ts` | Immutable edits (add, move, delete, update) and the undo/redo history |
| `features/serialize.ts` | Versioned JSON format and validation of imported/stored data |
| `features/mermaid.ts` | Mermaid flowchart export and label escaping |
| `features/svgExport.ts` | Standalone SVG string built from the model |
| `features/samples.ts` | The three sample diagrams |
| `utils/png.ts` | SVG blob URL → `<img>` → canvas → PNG blob |

## Core Logic

- The model is `{ nodes, edges, groups }`; every edit returns a new object. `History` keeps `past/present/future` (100 steps). Drags call `preview` on every move and `commit(h, next, base)` once on release, so a drag is one undo step; label typing is coalesced per field by the page.
- Group membership is geometric (node centre inside the rectangle), computed from the diagram at drag start, so a group doesn't pick up nodes it passes over.
- Node shapes are SVG path strings from `nodeShape()`, used by both the canvas and the export, so they always match.
- `parseDiagram` rebuilds the diagram field by field from untrusted JSON (imports and the localStorage copy): format/version check, id pattern and uniqueness, known kinds, finite and clamped numbers, label length, edge endpoints, count caps.
- Labels reach the DOM only as React text children of `<text>` and in exports via `escapeXml`; Mermaid labels are quoted with `#NN;` entities and node ids are generated (`n1`, `n2`, …).

## Limits

200 nodes, 500 edges, 50 groups, 80-character labels, coordinates ±20,000, group sides 120–10,000 px, 2 MB import, PNG at most 8,192 px a side. All in `LIMITS` (`features/model.ts`) and `serialize.ts`.

## Tests

- Unit: `tests/tools/architecture-diagram-builder/architecture-diagram-builder.test.ts` (round trip, hostile imports, Mermaid escaping, undo/redo, group move, delete cascade, fit math). `npm test -- architecture-diagram-builder`
- E2E: `e2e/architecture-diagram-builder.spec.ts` (sample, add, connect, label, undo, keyboard move, Mermaid, network/console checks, 320 px). `npm run test:e2e -- architecture-diagram-builder`

## Known Gaps

- Single selection only; no multi-select, copy/paste or alignment guides.
- Straight edges only, no routing or auto-layout; groups don't nest.
- No pinch-to-zoom on touch screens (zoom buttons work).
- Edges are selected by click or from a node's Properties list, not by Tab.
