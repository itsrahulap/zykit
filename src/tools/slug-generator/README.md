# Slug Generator

## Purpose

Turns lines of text into URL slugs with accent stripping, a choice of separator, stop-word removal and a word-boundary length limit. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`accepts`/`produces: ['text']`, `shareable: true`) |
| `SlugGeneratorPage.tsx` | Input, options, output with Copy / Send to…, share state, shortcuts |
| `features/slug.ts` | `transliterate`, `slugify`, `slugifyLines`, `STOP_WORDS`, `DEFAULT_SLUG_OPTIONS` |

## Core Logic

`transliterate` runs NFKD, removes all `\p{M}` marks and maps the letters in `TRANSLIT` that don't decompose. `slugify` then drops apostrophes, optionally replaces `&` with ` and `, optionally lowercases, splits on `[^\p{L}\p{N}]+` and joins with the separator. Stop-word removal falls back to all words if nothing would remain. `maxLength` (0 = none) cuts at the last separator within `maxLength + 1` chars, else hard-cuts. `slugifyLines` keeps blank lines as empty strings so output lines align with input.

## Limits

- Non-Latin scripts are kept, not transliterated; `STOP_WORDS` is English.
- Length is `String.length` (UTF-16 code units).
- The share-state `separator` is restricted to `-`, `_`, `.`.

## Tests

- Unit: `tests/tools/slug-generator/slug.test.ts` (transliteration, basic slugs, ampersand/separator/case options, non-Latin letters, word-boundary cut, stop words, symbol-only input, per-line output). `npm test -- slug-generator`
- E2E: `e2e/slug-generator.spec.ts` (lines to slugs with options, 320 px layout). `npm run test:e2e -- slug-generator`

## Known Gaps

- Removing every `\p{M}` after NFKD also strips marks that are part of letters in other scripts (Cyrillic `й` → `и`, Japanese dakuten `が` → `か`), and leaves Hangul as decomposed jamo instead of syllables. Recomposing with NFC, or only stripping marks after Latin base letters, would fix it.
- No per-language transliteration (e.g. German `ä` → `ae`, Cyrillic → Latin).
