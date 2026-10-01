# Unit Converter

## Purpose

Converts a value to every unit in one of 15 categories at once, using exact rational arithmetic, with cross-category unit search and display precision from 3 to 20 significant digits. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `UnitConverterPage.tsx` | Page: category buttons, unit search, precision select, category note, absolute-zero notice, one editable field per unit, share state (category, unit, value, precision), copy shortcut (all results) |
| `features/unit-converter.ts` | `CATEGORIES` (unit definitions: `factor`, optional `offset` for temperatures, `inverse` for L/100 km), `toBase` / `fromBase` / `convertAll` / `convert`, `belowAbsoluteZero`, `searchUnits` |
| `features/rational.ts` | `BigInt` rationals: `rat` (normalised by gcd), `add` / `sub` / `mul` / `div`, `parseDecimal`, `formatRational` (significant digits, half away from zero), `isExactWithin` |

## Core Logic

Factors are strings like `1e-9`, `5/9` or `149597870700*648000/<π>`, parsed once into rationals and cached (`r`). Linear units: `base = value × factor`; affine: `base = (value + offset) × factor`; inverse: `base = factor ÷ value` (null at zero). The page keeps one active unit and its raw text; every other field is `formatRational(fromBase(...))`, and typing in any field makes it the active one. `isExactWithin` re-parses the formatted string to decide the "≈ rounded" badge.

## Limits

- Exponents in input are at most 4 digits; π is a 50-decimal constant (`PI`).
- `formatRational` switches to scientific notation for exponents `< -6` or `>= 21`.
- Page precision options: `PRECISIONS = [3, 4, 6, 8, 10, 12, 15, 20]` (formatter supports 1–30).

## Tests

- Unit: `tests/tools/unit-converter/unit-converter.test.ts` (exact decimal parsing, addition, significant-digit formatting, exactness check; data size SI vs IEC, data rate, length, affine temperature, inverse fuel economy, other categories, exact round trip for every unit, unique ids, unit search). `npm test -- unit-converter`
- E2E: `e2e/unit-converter.spec.ts` (TB → GiB/GB, °C ↔ °F, metre → centimetre, search for psi and psi → atm, L/100 km → km/L, no off-origin requests, phone layout). `npm run test:e2e -- unit-converter`

## Known Gaps

- `pickUnit` from search within the current category copies the rounded display value into the input, so precision can be lost.
- No currency units and no historic temperature scales such as Réaumur.
- Some factors are rounded published constants (`inhg`, `hp`, `ftlb`), so those round trips are exact only against the stored factor.
