# Word Counter

## Purpose

Counts words, characters, sentences, paragraphs, lines and bytes as you type, with reading and speaking time and the most frequent words. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text', 'markdown']`, `shareable: true`, no `produces`) |
| `WordCounterPage.tsx` | Input, summary cards, Details rows, most-frequent-words panel with stop-word toggle, share state, incoming Send to… text |
| `features/count.ts` | `READING_WPM`, `SPEAKING_WPM`, `STOP_WORDS`, `words`, `countGraphemes`, `utf8Bytes`, `countSentences`, `countParagraphs`, `countLines`, `computeStats`, `formatDuration` |

## Core Logic

`words` keeps `isWordLike` segments from a module-level `Intl.Segmenter` (word granularity, default locale) and falls back to a Unicode letter/mark/number regex that joins on `'’.-`. `countGraphemes` uses a grapheme segmenter (code points without one). `countSentences` splits after terminal punctuation plus optional closing quotes/brackets and whitespace, keeping parts that contain a letter or digit. `computeStats` builds the lowercase frequency map (top 10, ties alphabetical), average and longest word in code points, and times via `Math.ceil` seconds. Runs on the main thread behind `useDeferredValue`.

## Limits

- `READING_WPM` 238, `SPEAKING_WPM` 150; `STOP_WORDS` is 126 English words.
- `charactersNoSpaces` is `string.length` after removing `\s`, so it is UTF-16 units while "Characters" is graphemes.
- Word boundaries depend on the browser's segmenter data.

## Tests

- Unit: `tests/tools/word-counter/count.test.ts` (Segmenter and regex fallback word counts, graphemes, UTF-8 bytes, sentences/paragraphs/lines, duration formatting, full stats, stop-word filtering, 1 MB performance). `npm test -- word-counter`
- E2E: `e2e/word-counter.spec.ts` (live counts and frequent words, responsiveness on 1 MB input, 320 px layout). `npm run test:e2e -- word-counter`

## Known Gaps

- "Characters (no spaces)" uses a different unit from "Characters".
- No abbreviation handling in sentence counting, and no Send to… for the stats.
