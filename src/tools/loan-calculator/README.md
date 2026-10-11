# Loan / EMI Calculator

## Purpose

Computes the EMI, total interest, total paid and a full amortisation schedule for a loan, with prepayments (one-off and recurring), interest saved, a two-loan comparison, an SVG chart and CSV export. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `LoanCalculatorPage.tsx` | Page: currency select (`Intl.NumberFormat`, INR uses en-IN), `LoanForm` for loan A and optional B, parsing/validation (`parseLoan`), result boxes (`aria-live`), comparison table, SVG `Chart` with a text alternative, yearly table, paged schedule (24 rows), CSV download, share state (both loans as JSON strings, validated per key) |
| `features/loan-calculator.ts` | `pmt`, `periodsFor`, `addPeriods`, `isValidDate`, `amortise`, `savings`, `yearly`, `toCsv` |

## Core Logic

Money is integer minor units. `amortise` rounds each period's interest, repays `EMI - interest` as principal, and on the last period (or when the EMI covers the balance) pays the exact balance plus interest so the final balance is 0. Prepayments add to principal repayment; `prepay: 'emi'` recomputes the EMI over the remaining periods, `'tenure'` keeps it. `savings` re-runs the loan without prepayments. 0% rate divides evenly.

## Limits

- Fixed rate, compounded per payment period; at most `MAX_PERIODS = 6000` payments; one one-off prepayment per loan.
- Dates are UTC `YYYY-MM-DD`; month-based steps clamp to month end.

## Tests

- Unit: `tests/tools/loan-calculator/loan-calculator.test.ts` (known EMI 10,00,000 at 8.5% for 20 years = 8,678.23, 0% rate, rounding absorption, single period, tenure per frequency, dates, prepayments, yearly sums, CSV). `npm test -- loan-calculator`
- E2E: `e2e/loan-calculator.spec.ts` (EMI, prepayment saving, compare, no off-origin requests, phone layout). `npm run test:e2e -- loan-calculator`

## Known Gaps

- Only one one-off prepayment per loan; no variable rates, fees or moratoriums.
