# Percentage Calculator

## Purpose

Nine calculation cards (percent of, what percent, percent change, add/subtract, reverse percentage, stacked discount, margin vs markup, GST/VAT with CGST/SGST split, percentage points vs percent), each showing its formula. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `PercentageCalculatorPage.tsx` | Page: one `Card` per calculation, all inputs held as strings in one `DEFAULTS`-shaped state object, `aria-live="polite"` results, share state (the whole object as one JSON string, validated key by key) |
| `features/percentage-calculator.ts` | Pure functions: `round`, `parseNum`, `percentOf`, `whatPercent`, `percentChange`, `addPercent`, `subtractPercent`, `reversePercent`, `discount`, `marginMarkup`, `priceFromMargin`, `priceFromMarkup`, `tax`, `pointsVsPercent` |

## Core Logic

Functions return full-precision numbers, or `null` when undefined (division by zero, 100% margin). `round` rounds half away from zero via `toPrecision(12)` first so `1.005` gives `1.01`. `discount` multiplies `(1 - d)` sequentially. `tax` rounds gross/net to 2 places, derives tax as the difference and splits it into CGST (rounded half) and SGST (remainder).

## Limits

- Plain decimal input only (no exponent notation); display rounding is 2 dp (4 dp for the simple percent cards).
- No country-specific tax rounding or slabs.

## Tests

- Unit: `tests/tools/percentage-calculator/percentage-calculator.test.ts` (each calculation, rounding, parsing, undefined cases). `npm test -- percentage-calculator`
- E2E: `e2e/percentage-calculator.spec.ts` (main flow, no off-origin requests, phone layout). `npm run test:e2e -- percentage-calculator`

## Known Gaps

- No country-specific tax rounding or slabs; plain decimal input only.
