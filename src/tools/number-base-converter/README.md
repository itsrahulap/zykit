# Number Base Converter

## Purpose

Converts arbitrary-size integers between bases 2–36 and shows two's complement, IEEE-754 float bits, bitwise operations and character codes. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `NumberBaseConverterPage.tsx` | Input and conversions, two's complement panel, IEEE-754 panel, bitwise calculator, characters ↔ codes, share state, copy shortcut (decimal) |
| `features/number-base-converter.ts` | Pure logic, no DOM: `parseInteger`, `toBase` / `groupDigits`, `bitLength`, `twosComplement`, `floatBits` / `decodeFloatBits` / `exactDecimal` / `parseFloatInput`, `bitwise` + `BIT_OPS`, `charInfo`, `codesToText` |

## Core Logic

`parseInteger` strips separators, handles sign and `0x`/`0b`/`0o` prefixes (auto-detected, or consumed only when they match a forced base), then accumulates digits into a `BigInt`. `twosComplement` and `bitwise` wrap with `BigInt.asUintN` / `asIntN`; rotations reduce the amount modulo the width. `decodeFloatBits` splits sign/exponent/mantissa, classifies the value and computes the exact decimal as `significand × 5^k / 10^k` (`exactDecimal`), which always terminates.

## Limits

- Integers only in the base converter; bitwise width 1–4096 in `bitwise` (page offers 8–128), shifts 0–100,000.
- `charInfo` is fed `chars.slice(0, 500)` (UTF-16 units).

## Tests

- Unit: `tests/tools/number-base-converter/number-base-converter.test.ts` (prefixes and bases, arbitrary precision, digit errors, grouping/case, bit length, two's complement wrapping, float64 layout, exact stored value, special values, raw-bit decoding, float input parsing, logic ops, shifts and rotations, code points / UTF-8, codes → text). `npm test -- number-base-converter`
- E2E: `e2e/number-base-converter.spec.ts` (conversions, float, bitwise and character sections working with only local requests, phone layout without sideways scroll). `npm run test:e2e -- number-base-converter`

## Known Gaps

- No fractional base conversion (e.g. `0.1` in binary) and no float16 / bfloat16.
- The 500-unit slice in `Text → codes` can cut a surrogate pair in half at the boundary.
