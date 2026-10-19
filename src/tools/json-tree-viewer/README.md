# JSON Tree Viewer

## Purpose

Explores (large) JSON as a virtualised, searchable tree with type badges, counts, JSONPath copy and keyboard navigation. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `shareable: false`) |
| `JsonTreeViewerPage.tsx` | Page: input, tree controls, virtual list (`role="tree"`), path bar, copy actions |
| `features/json-tree-viewer.ts` | Pure logic: `flatten`, `expandToDepth`, `jsonPath`, `searchTree`, `valueText`, `truncate` |
| `tree.worker.ts` | Runs `parseJson` off the main thread for input over 1,000,000 characters |

## Core Logic

Parsing reuses `parseJson` from `json-formatter` (raw-text tree, iterative, exact numbers). The tree state is a `Set<JsonNode>` of expanded containers; `flatten` walks it iteratively into `Frame` rows (`node`, `key`, `depth`, `parent`), and `jsonPath` / `ancestors` follow the `parent` chain. The page keeps a prefix-sum `offsets` array so rows can have different heights (only expanded long strings do) and finds the first visible row by binary search. Search (`searchTree`) is one iterative pass over keys and decoded scalar values; the page auto-expands the ancestors of every match until the user toggles something (`autoExpand`), and `Next`/`Prev` merge the current match's ancestors into the expanded set. Keyboard support follows the ARIA tree pattern with `aria-activedescendant` on the focused container. `jsonPointer` (RFC 6901) and `jsAccess` (optional chaining) are built from the same `parent` chain. `parsePath` reads JSONPath, JSON Pointer or JavaScript paths into keys (pointer segments stay strings), and `findPath` walks them from the root, matching numeric strings to array indexes and taking the last of duplicate keys; the page merges the result's ancestors into the expanded set and selects it. `searchTree` takes a `keys` / `values` / `both` scope.

## Limits

- Files up to 100 MB (`MAX_FILE_BYTES`); over `SYNC_LIMIT` (1,000,000 chars) parsing happens in the worker and the text is not put in the textarea.
- `MAX_ROWS` = 1,000,000 rows, `MAX_MATCHES` = 10,000, strings cut at `STRING_PREVIEW` (120) and shown up to 100,000 characters.
- The worker posts the parsed tree back with structured clone, so peak memory is high for huge files.

## Tests

- Unit: `tests/tools/json-tree-viewer/json-tree-viewer.test.ts` (flatten, depth expansion, deep nesting, paths, types, values, search). `npm test -- json-tree-viewer`
- E2E: `e2e/json-tree-viewer.spec.ts` (tree, search, path copy, keyboard, no network, 320px). `npm run test:e2e -- json-tree-viewer`

## Known Gaps

- No editing, no JSONPath query language, no diff.
- Search is plain text (no regex), and does not highlight inside a value.
- Parse errors for opened files have no jump-to-line, because the text isn't shown.
