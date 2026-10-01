# Unicode Inspector

## Purpose

Breaks text into grapheme clusters and code points, shows each code point's name, category, script, block, encodings and escapes, flags invisible, bidi-control and look-alike characters, compares normalization forms and offers a cleaned copy. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`, `produces: ['text']`, `shareable: true`) |
| `UnicodeInspectorPage.tsx` | Input, summary and warning banner, grapheme chips, code point table and detail panel, scripts/look-alikes, normalization table, cleaned text with Copy / Send to… |
| `features/unicode-inspector.ts` | `CATEGORIES` / `generalCategory`, `SCRIPTS` / `scriptOf`, `BLOCKS` / `blockOf`, `utf8Bytes`, `utf16Units`, `escapes`, `flagsFor`, `HOMOGLYPHS`, `graphemes`, `mixedScriptWords`, `analyze`, `cleanText` |
| `features/names.ts` | `charName` (static table for common blocks plus algorithmic names) and `INVISIBLE_LABELS` |

## Core Logic

`analyze` segments with `Intl.Segmenter` (falls back to code points), marks a cluster as emoji when it contains `\p{Extended_Pictographic}`, a regional indicator or U+20E3, and describes each code point. Category and script are found by testing `\p{…}` / `\p{Script=…}` regexes in order, so they follow the engine's Unicode version; blocks are a sorted range table searched by binary search. `flagsFor` assigns one primary flag (bidi > invisible > space > variation > tag > control > private > surrogate > unassigned > replacement) plus an optional confusable flag; emoji context downgrades ZWJ, variation selectors and tags to `info`. Past `maxRows` only plain ASCII word characters skip `describeCodePoint`, so flag counts stay complete. `cleanText` drops warn/danger code points of the removable kinds and optionally maps odd spaces (U+2028/2029 → `\n`) and look-alikes.

## Limits

- Page constants: `MAX_INPUT` 1,000,000 chars, `MAX_ROWS` 2,000 table rows, `MAX_CHIPS` 1,000 chips from the first 20,000 chars; `mixedScriptWords` stops at 50 words.
- `HOMOGLYPHS` is a hand-picked subset, not UTS #39 confusables; 36 scripts are recognised.
- Runs on the main thread (no worker).

## Tests

- Unit: `tests/tools/unicode-inspector/unicode-inspector.test.ts` (names incl. algorithmic and null fallback; category, script, block; UTF-8/UTF-16 and escapes; grapheme segmentation; bidi, invisible, space, tag and control flags; emoji exceptions; homoglyphs and mixed scripts; normalization; row cap; `cleanText` options). `npm test -- unicode-inspector`
- E2E: `e2e/unicode-inspector.spec.ts` (code points listed, hidden and look-alike characters flagged; 320 px layout). `npm run test:e2e -- unicode-inspector`

## Known Gaps

- No full Unicode name data, so many characters outside common blocks have no name.
- Look-alike replacement only covers `HOMOGLYPHS` and fullwidth ASCII.
