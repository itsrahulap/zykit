# Password Generator

## Purpose

Generates random passwords or word passphrases with the shared unbiased CSPRNG sampler and shows entropy, a strength label and a rough crack time. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (no `accepts` / `produces`, not shareable) |
| `PasswordGeneratorPage.tsx` | Mode switch, password / passphrase options, `RangeField` (slider + number box), strength card, result list with copy buttons |
| `features/password.ts` | `SETS`, `LOOK_ALIKES`, length / word limits, `buildPool`, `generatePasswords`, `generatePassphrase`, `passwordBits`, `passphraseBits`, `strengthLabel`, `crackTime` |
| `features/words.ts` | Built-in word list (`WORDS`), deduplicated and filtered to `/^[a-z]{3,9}$/` at load (2,494 words) |

Shared code: `createSampler`, `randomFrom`, `shuffle`, `entropyBits` from `src/shared/lib/random.ts`.

## Core Logic

Results are recomputed in a `useMemo` whenever an option changes or **Generate** bumps a nonce; nothing is persisted. `buildPool` drops banned characters per set and removes empty sets. With `requireEach`, `onePassword` rejection-samples whole passwords (up to 200 attempts) and only then falls back to one-per-set + fill + Fisher–Yates shuffle. Strength thresholds: <28, <40, <60, <90 bits; `crackTime` assumes `GUESSES_PER_SECOND = 1e11` and half the key space.

## Limits

- `MIN_LENGTH` 8 / `MAX_LENGTH` 128, `MIN_WORDS` 3 / `MAX_WORDS` 12, count 1–50 (page constant).
- `passwordBits` ignores the `requireEach` constraint (slight overestimate, documented in code).
- `passphraseBits` ignores capitalisation and separator, and doesn't account for ambiguity when the separator is empty.

## Tests

- Unit: `tests/tools/password-generator/password.test.ts` (word list size and shape, length / count / sets, every set present at minimum length, look-alike and custom exclusions, impossible settings, rough uniformity, passphrase options and entropy, strength labels and crack time). `npm test -- password-generator`
- E2E: `e2e/password-generator.spec.ts` (options, regenerate, count, passphrase mode, **Copy all**, nothing in local/session storage, no off-origin or non-GET requests, 320 px layout). `npm run test:e2e -- password-generator`

## Known Gaps

- English word list only; no custom list or EFF list import.
- No custom symbol set beyond excluding characters.
- The page footer ("Generated in your browser with `crypto.getRandomValues`…") overlaps with `docs.ts`.
