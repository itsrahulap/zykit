# Lorem Ipsum Generator

## Purpose

Generates reproducible placeholder text (lorem ipsum or plain English) as paragraphs, sentences, words or list items, in plain text, HTML or Markdown. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`produces: ['text']`, `shareable: true`, no `accepts`) |
| `LoremIpsumPage.tsx` | Options, seed input, Regenerate, word/character status, `OutputPanel` (Copy, Send to…, Download) |
| `features/lorem-ipsum.ts` | `seededRng` (cyrb128 → sfc32), `randomSeed`, word lists, `LIMITS`, `generateBlocks`, `formatBlocks`, `generateLorem`, `countWords` |

## Core Logic

`seededRng` hashes the seed string with cyrb128, discards the first 12 sfc32 outputs and returns floats in [0, 1). `generateBlocks` clamps the count to `LIMITS[unit]`, builds words / sentences (6–16 words, optional comma) / paragraphs (3–7 sentences) / list items (2–7 words), and overwrites the start with the classic Latin opening when `startWithLorem` is on and the lorem list is selected. `formatBlocks` adds `<p>` / `<ul><li>` (HTML-escaped) or `- ` bullets. The output is a pure function of the options, so share links reproduce it; `randomSeed` (`crypto.getRandomValues`) is only used for new seeds.

## Limits

- `LIMITS`: 500 paragraphs, 5,000 sentences, 50,000 words, 1,000 list items. The page also clamps to at least 1.
- Markdown only changes list output; paragraphs are identical to plain.
- `countWords` matches `[A-Za-z]+`, so it is only meaningful for these ASCII word lists.

## Tests

- Unit: `tests/tools/lorem-ipsum/lorem-ipsum.test.ts` (PRNG determinism and range, classic opening, seed reproducibility, counts per unit, HTML and Markdown formatting, English list, lorem vocabulary, count clamping). `npm test -- lorem-ipsum`
- E2E: `e2e/lorem-ipsum.spec.ts` (reproducible text across formats, 320 px layout). `npm run test:e2e -- lorem-ipsum`

## Known Gaps

- Only two built-in word lists; no custom vocabulary.
- No headings or other block types in HTML/Markdown output.
