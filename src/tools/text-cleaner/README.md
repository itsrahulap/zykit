# Text Cleaner

## Purpose

Cleans text line by line through a reorderable pipeline of 12 toggleable steps (trim, collapse, dedupe, filter, sort, tabs, strip invisibles, affix, number, line endings and more). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`, `produces: ['text']`, `shareable: true`) |
| `TextCleanerPage.tsx` | Step list with per-step options and reordering, input, `OutputPanel`, stats, `restoreSteps` for share links, incoming Send to… text |
| `features/clean.ts` | `StepId` / `StepOptions`, `STEP_LABELS`, `defaultSteps`, `applyStep`, `cleanText` |

## Core Logic

`cleanText` splits on `\r\n|\r|\n`, remembers a trailing newline and the detected line ending, runs every enabled step's `applyStep` in array order and joins with the detected EOL (or the one from `lineEndings`, which only changes the joiner). Sorting uses `Intl.Collator('en')` (`numeric` for natural, `sensitivity: 'accent'` to ignore case) with a code-unit tie-break; random order is a Fisher–Yates shuffle with `mulberry32(seed)`. `NON_PRINTABLE` covers C0/C1 controls except tab/LF/CR, U+00AD, U+180E, U+200B–U+200F, U+202A–U+202E, U+2060–U+2064, U+2066–U+2069 and U+FEFF. Runs on the main thread behind `useDeferredValue`.

## Limits

- Tab width clamped to 1–16 (UI offers 2, 4, 8); spaces → tabs only for leading spaces.
- Duplicate and filter case-folding use `toLocaleLowerCase`, so they follow the browser locale.
- Character stats are `string.length` (UTF-16 units).

## Tests

- Unit: `tests/tools/text-cleaner/clean.test.ts` (default pipeline, trim modes, collapse keeping indentation, dedupe first/last, every sort order and seeded shuffle, reverse/number/affix, filter, tabs, line endings, stripping invisibles, empty input, disabled steps and order). `npm test -- text-cleaner`
- E2E: `e2e/text-cleaner.spec.ts` (step pipeline with stats, copy and download; 320 px layout). `npm run test:e2e -- text-cleaner`

## Known Gaps

- Stripping removes U+200D (ZWJ), which splits emoji ZWJ sequences.
- No regex filter and no locale choice for sorting.
