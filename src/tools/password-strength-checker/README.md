# Password Strength Checker

## Purpose

Estimates how long a password would take to crack, flags the patterns that make it weak, and suggests improvements, all locally. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (not shareable: handles secrets) |
| `PasswordStrengthCheckerPage.tsx` | Masked input with reveal, own-words field, result and breakdown |
| `features/password-strength-checker.ts` | Pure zxcvbn-style estimator: matchers, minimum-guesses DP, crack times, feedback |
| `features/data.ts` | Compact common-password, extra-word and first-name lists (lazy-loaded chunk) |

## Core Logic

`omnimatch` finds dictionary (plain, reversed, l33t), spatial (qwerty/azerty/keypad), repeat, sequence, year and date matches. `mostGuessable` runs a DP over match sequences minimising `l! * product(guesses) + 10000^(l-1)`, with brute force (10^length) filling gaps. Guesses map to a 0-4 score and to crack times at four attack rates. Dictionaries are passed in (`buildDicts`), so tests and the page share the code; the page imports `data.ts` dynamically. The shared passphrase word list (`password-generator/features/words.ts`) supplies general words.

## Limits

Only the first 100 characters are analysed. Lists are compact (about 950 passwords, 1,300 names, a few thousand words), not a full 10k+ corpus; word rank is list position.

## Tests

- Unit: `tests/tools/password-strength-checker/password-strength-checker.test.ts`. `npm test -- password-strength-checker`
- E2E: `e2e/password-strength-checker.spec.ts`. `npm run test:e2e -- password-strength-checker`

## Known Gaps

No date-of-birth cross-checking beyond pattern detection, no non-English or leaked-password (k-anonymity) lookup because the tool makes no network requests.
