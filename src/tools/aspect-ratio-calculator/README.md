# Aspect Ratio Calculator

## Purpose

Computes the simplified ratio, decimal and nearest common ratio of a width and height, solves a missing side with a locked ratio, scales by a percentage, and lists matching common resolutions with a CSS `aspect-ratio` snippet and a preview box. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `AspectRatioCalculatorPage.tsx` | Page: inputs, lock, presets, result, preview, scale, resolution chips, share state (w, h, lock, pct) |
| `features/aspect-ratio-calculator.ts` | `gcd`, `parseSide`, `simplify`, `nearestCommon`, `solveHeight` / `solveWidth`, `scaleBy`, `PRESETS`, `RESOLUTIONS`, `resolutionsFor`, `cssSnippet` |

## Core Logic

`simplify` scales decimals by 10^k (k up to 4) to integers and divides by the gcd. `nearestCommon` compares log ratios against `COMMON_RATIOS`. Locked editing stores the ratio at lock time (or the preset) and rounds the solved side.

## Limits

- Sides 0 < n ≤ `MAX_SIDE` (100000); scale 0–10000 %.
- Solved sizes are rounded to integers. A-paper and golden presets are 7071:5000 and 8090:5000.

## Tests

- Unit: `tests/tools/aspect-ratio-calculator/aspect-ratio-calculator.test.ts`. `npm test -- aspect-ratio-calculator`
- E2E: `e2e/aspect-ratio-calculator.spec.ts`. `npm run test:e2e -- aspect-ratio-calculator`

## Known Gaps

- Decimal sides with many digits give very large exact ratios.
- Preview box is capped at a small size and is not to scale.
