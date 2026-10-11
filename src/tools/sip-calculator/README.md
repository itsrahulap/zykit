# SIP & Compound Interest Calculator

## Purpose

Estimates how a monthly SIP (with optional yearly step-up) or a one-off lump sum grows at a constant annual return, with an inflation-adjusted view and a year-by-year table.

## File Structure

```text
src/tools/sip-calculator/
├── index.ts                 tool definition
├── SipCalculatorPage.tsx    inputs, result card and yearly table
├── docs.ts                  user guide shown on the page
└── features/sip-calculator.ts   sip(), lumpSum(), inflationAdjusted(), parseAmount() (pure)
tests/tools/sip-calculator/sip-calculator.test.ts
e2e/sip-calculator.spec.ts
```

Currencies come from `src/shared/lib/currency.ts` (shared with the Loan Calculator).

## Core Logic

`sip()` simulates month by month with `r = annual / 12`, adding each instalment at the start or end of the month and raising it by the step-up after every 12 payments. `lumpSum()` applies `P × (1 + r/n)^(n × years)` per year. `inflationAdjusted()` divides by `(1 + inflation)^years`.

## Limits

- Constant return; no taxes, fees or expense ratios.
- Years: whole number 1–100. Amounts must be non-negative.

## Tests

Unit tests check the standard benchmark (₹10,000/month, 12%, 10 years ≈ ₹23.23 lakh start-of-month, ₹23.00 lakh end-of-month), step-up, 0% return, compounding frequency, inflation and parsing. The e2e spec checks the main flow, no off-origin requests and no sideways scroll at 320 px.

## Known Gaps

- No chart (the year-by-year table carries the same data).
- No SWP (systematic withdrawal) mode and no share link.
