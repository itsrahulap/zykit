# JSON Diff

## Purpose

Structural diff of two JSON documents with a tree view, a path-keyed change list and an RFC 6902 JSON Patch. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['json']`, `shareable: true`) |
| `JsonDiffPage.tsx` | Page: two inputs, options, per-side errors, `DiffTree` / `ChangeList`, copy buttons, share state |
| `features/diff.ts` | `diffJson`, `canonicalNumber`, `formatPath` (JSONPath), `jsonPointer` (RFC 6901), `toJsonPatch`, `changesToJson`, `preview` |

Parsing reuses `parseJson` / `formatJson` from `json-formatter/features/json.ts`.

## Core Logic

`diffJson` hashes each node canonically (sorted object keys; sorted item hashes when array order is ignored; numbers via `canonicalNumber` when numeric equality is on), memoised in a `WeakMap`. Objects diff by key (ignored keys dropped, last duplicate wins). Ordered arrays trim the common prefix/suffix, run an LCS over item hashes (capped at `MAX_LCS_CELLS` = 4,000,000 table cells, else position-based), then `pairUp` diffs leftover removed/added items pairwise. Unordered arrays match by hash from a pool, then pair leftover containers of the same type. `toJsonPatch` walks the tree tracking each item's index in the partly patched array.

## Limits

- `MAX_INPUT_CHARS` = 5,000,000 per side; list view `MAX_LIST` = 1,000 changes; tree `MAX_CHILDREN` = 300 per page.
- `diff`/`hash` are recursive: very deep documents throw and the page shows "nested too deeply". Runs on the main thread.

## Tests

- Unit: `tests/tools/json-diff/diff.test.ts` (add/remove/change paths, key order, array alignment, ignore array order, numeric equality, decoded strings, ignored keys, type changes, path quoting, pointer escaping, patches applied back to the left produce the right, big numbers, number canonicalisation, change summary). `npm test -- json-diff`
- E2E: `e2e/json-diff.spec.ts` (tree, list and JSON Patch, ignore array order, per-side parse errors, 320 px layout). `npm run test:e2e -- json-diff`

## Known Gaps

- No side-by-side text view of the two documents.
- No `move`/`copy` operations in the patch; reordered items become remove + add (or are left in place when order is ignored).
- No **Open file** button; files can only be dropped onto the inputs.
