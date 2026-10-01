# Diff Checker

## Purpose

Line diff of two texts with word-level highlights, side-by-side and unified views, collapsible context and a unified-diff export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text', 'code']`, `shareable: true`) |
| `DiffCheckerPage.tsx` | Page: two `CodeArea` inputs, options, status, notes (line endings, final newline, inexact), share state |
| `config/limits.ts` | `MAX_CHARS`, `MAX_LINES`, `DEBOUNCE_MS`, `ROW_PAGE` |
| `features/myers.ts` | `diffSequences`: linear-space Myers over integer sequences with a cost budget; `Interner` |
| `features/diff.ts` | `splitLines`, `diffTexts`, `diffWords`/`tokenize`, `toSideBySide`, `collapse`, `unifiedDiff` |
| `hooks/useDiff.ts` | Size checks (`sizeProblem`), debounced worker requests, stale-worker termination |
| `workers/diff.worker.ts`, `diff.protocol.ts` | Runs `diffTexts` + `unifiedDiff` off the main thread |
| `components/DiffView.tsx` | Split / unified tables, collapsed gaps, paged rows |

## Core Logic

`diffTexts` normalises line endings, maps each line to an interned id of its comparison key (trim / strip whitespace / lower-case), and appends a sentinel to the last line when only one side has a trailing newline (unless whitespace is ignored). `diffSequences` trims common prefix/suffix and recurses on the middle snake; when `DEFAULT_MAX_COST` (100,000,000 steps) runs out, the rest becomes delete + insert and `exact` is false. Within each change block, dels and adds are paired by position and `diffWords` re-runs Myers on tokens (budget 200,000), skipped above `MAX_WORD_DIFF_CHARS` = 20,000. `useDiff` terminates a still-busy worker when a newer request arrives instead of queuing.

## Limits

- `MAX_CHARS` = 2,000,000 and `MAX_LINES` = 50,000 per side; `DEBOUNCE_MS` = 250; `ROW_PAGE` = 2,000 rows per page.
- Unified export always uses 3 context lines and fixed headers `original` / `changed`, independent of the **Context lines** setting.
- Screens under 640 px always render the unified view.

## Tests

- Unit: `tests/tools/diff-checker/diff.test.ts` (Myers minimality on random inputs, budget fallback, line-ending detection, insert/delete/replace, ignore options, missing final newline, word highlights, reconstruction from large random diffs, unified hunks and merging, `collapse`). `npm test -- diff-checker`
- E2E: `e2e/diff-checker.spec.ts` (word highlights, both views and unified copy, ignore options, collapse/expand, phone layout). `npm run test:e2e -- diff-checker`

## Known Gaps

- No moved-block detection; no character-level diff for single long tokens.
- No **Open file** button; files can only be dropped onto the inputs.
- Context lines setting doesn't affect the copied unified diff.
