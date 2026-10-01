# Case Converter

## Purpose

Shows text in 14 case styles at once (programming identifiers, Title Case, Sentence case and character-level styles), converting line by line. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts: ['text']`, `shareable: true`) |
| `CaseConverterPage.tsx` | Input, one card per format with Copy, share state, incoming Send to… text, 20,000-char preview cap |
| `features/case.ts` | `splitWords`, `CASE_FORMATS`, `titleCase`, `sentenceCase`, `alternatingCase`, `inverseCase`, `convertLines` |

## Core Logic

`splitWords` drops in-word apostrophes, takes `[\p{L}\p{M}\p{N}]+` runs, then splits each run on acronym boundaries, camel humps and letter/digit changes. The eight identifier formats are `byWords` joins of that list. `titleCase` and `sentenceCase` work on the original line with regex replacements, so spacing and punctuation survive; `SMALL_WORDS` holds the Title Case exceptions. `convertLines` splits on `\r?\n`, so CRLF input comes back as LF. The input goes through `useDeferredValue` so typing stays responsive on large text.

## Limits

- Case mapping is `toUpperCase` / `toLowerCase` (no locale), and Title Case small words are English.
- Word-based formats discard symbols, emoji and apostrophes.
- On-screen preview truncated at `MAX_PREVIEW_CHARS` (20,000); Copy gets the full value.

## Tests

- Unit: `tests/tools/case-converter/case.test.ts` (word splitting: humps, acronyms, separators, digits, Unicode, apostrophes; every format; Title/Sentence rules; line-by-line conversion). `npm test -- case-converter`
- E2E: `e2e/case-converter.spec.ts` (all cards line by line, Copy, same-origin GETs only, 320 px layout). `npm run test:e2e -- case-converter`

## Known Gaps

- No locale-aware casing (Turkish, Lithuanian) and no acronym preservation in Title Case.
- The page offers no Send to… for its results.
