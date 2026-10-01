# Color Converter

## Purpose

Parses any CSS colour and shows it in every CSS notation, with a WCAG contrast checker, palettes and colour-vision previews. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `ColorConverterPage.tsx` | Colour input, formats list, contrast checker, palette and colour-blindness panels; share state and copy shortcut |
| `features/color-converter.ts` | Pure maths: `parseColor`, CSS Color 4 conversions (sRGB, linear, XYZ D65/D50, Lab/LCH, OKLab/OKLCH, P3, HSL, HWB), `toSrgbGamut`, `formatAll`, WCAG `wcag` / `contrastRatio`, `apca`, `nearestPassing`, `tints` / `shades` / `harmony`, `simulate` |
| `features/named.ts` | The 148 CSS named colours and reverse lookup `nameForHex` |

## Core Logic

Internally a colour is gamma-encoded sRGB channels that may fall outside 0–1 (so wide-gamut input round-trips), plus alpha. `formatAll` gamut-maps only the sRGB notations via `toSrgbGamut` (30-step binary search on OKLCH chroma). `contrastRatio` composites the foreground over an opaque background with `over`. `nearestPassing` scans OKLCH lightness in 400 steps each way, bisects, then nudges until the rounded hex passes. State is shared through `useShareState` (`color`, `fg`, `bg`, `harmony`, with `harmony` limited to known IDs).

## Limits

- `color()` spaces: `srgb`, `srgb-linear`, `display-p3`, `xyz`, `xyz-d65`, `xyz-d50`.
- No relative colour syntax, `calc()`, `color-mix()` or `currentColor`; `none` reads as 0.
- Contrast ignores background alpha.

## Tests

- Unit: `tests/tools/color-converter/color-converter.test.ts` (every input syntax and error messages, all notations and round trips, gamut mapping, WCAG ratios, translucent text, APCA, nearest passing colour, palettes, CVD simulation, grey hue). `npm test -- color-converter`
- E2E: `e2e/color-converter.spec.ts` (conversion, out-of-gamut notice, error message, contrast suggestion, harmony swatches, no CSP errors or off-origin requests, phone layout). `npm run test:e2e -- color-converter`

## Known Gaps

- Gamut mapping is plain chroma reduction, not the CSS Color 4 algorithm with a deltaE OK tolerance, so results can differ slightly from browsers.
- `nearestPassing` only varies lightness; it returns nothing when no lightness at that hue and chroma reaches the target.
- The page ends with a short explanatory paragraph (conversions, contrast formula) that overlaps with `docs.ts`.
