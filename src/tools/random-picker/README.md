# Random Picker

## Purpose

Pick winners, shuffle a list, make balanced teams, flip a coin, roll dice and draw a number in a range. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`: the list only, never results) |
| `RandomPickerPage.tsx` | Page: mode switch, options, result, coin history, spin animation |
| `features/picker.ts` | Pure logic: list parsing, weighted winners, teams, coin stats, dice parser and roller, range |

## Core Logic

Every function takes a `Sampler` from `shared/lib/random.ts` (rejection-sampled `crypto.getRandomValues`), so tests inject a seeded source. `pickWinners` draws without replacement, proportionally to weight. `makeTeams` shuffles then deals round-robin, so sizes differ by at most one. `parseDice` accepts `[N]dM[+-K]` and returns a typed error otherwise. The spin animation only runs after the result is chosen and is skipped under `prefers-reduced-motion`.

## Limits

10,000 entries, weights in (0, 1000], 1-100 dice with 2-1000 sides, modifier up to 10,000, numbers within +/-1e9. Coin history keeps the last 1000 flips.

## Tests

- Unit: `tests/tools/random-picker/random-picker.test.ts`. `npm test -- random-picker`
- E2E: `e2e/random-picker.spec.ts`. `npm run test:e2e -- random-picker`

## Known Gaps

No compound dice expressions, no per-name history of past winners, no saved lists.
