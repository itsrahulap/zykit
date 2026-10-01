# Random String Generator

## Purpose

Generates batches of random strings from a preset or custom character set, with optional fixed prefix/suffix and lines / comma / JSON output. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts` / `produces`, not shareable) |
| `RandomStringPage.tsx` | Character preset select, custom set input, `NumberField`s, prefix / suffix, output format, output panel with copy, **Send to…** and download |
| `features/randomString.ts` | `PRESETS`, `MAX_LENGTH`, `MAX_COUNT`, `dedupeCharset`, `alphabetFor`, `generateStrings`, `formatOutput`, `stringBits`, `clampInt` |

Shared code: `createSampler`, `randomFrom`, `entropyBits` from `src/shared/lib/random.ts`; `SendToMenu`, `downloadText`.

## Core Logic

The alphabet is an array of code points (`[...text]`), so multi-unit characters stay whole. Values regenerate in a `useMemo` on any option change or when **Generate** bumps a nonce, using one batched sampler per run. `SendToMenu` sends `kind: 'json'` for the JSON format, `'text'` otherwise. The on-screen preview is capped at `MAX_PREVIEW_CHARS` (200,000).

## Limits

- `MAX_LENGTH` 4,096, `MAX_COUNT` 1,000 (worst case ~4 M characters, generated synchronously on the main thread).
- `dedupeCharset` drops all whitespace except a plain space.
- Comma output is a plain `join(',')` with no escaping.

## Tests

- Unit: `tests/tools/random-string/randomString.test.ts` (preset sizes, custom-set dedupe and whitespace handling, length / count / prefix / suffix, multi-code-unit characters, maximum size timing, output formats, entropy and clamping). `npm test -- random-string`
- E2E: `e2e/random-string.spec.ts` (hex with prefix, custom set, JSON output, copy, download filename, no off-origin or non-GET requests, 320 px layout). `npm run test:e2e -- random-string`

## Known Gaps

- No grapheme-aware custom sets (emoji sequences are split into code points).
- No CSV quoting for comma output.
- The page footer about `crypto.getRandomValues` and rejection sampling overlaps with `docs.ts`.
