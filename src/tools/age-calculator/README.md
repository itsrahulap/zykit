# Age Calculator

## Purpose

Exact age between a date of birth and another date (default today): years, months and days, totals, weekday of birth and the next birthday.

## File Structure

```text
src/tools/age-calculator/
├── index.ts                 tool definition
├── AgeCalculatorPage.tsx    two date inputs and the result cards
├── docs.ts                  user guide shown on the page
└── features/age-calculator.ts   date parsing and age maths (pure)
tests/tools/age-calculator/age-calculator.test.ts
e2e/age-calculator.spec.ts
```

## Core Logic

`age(birth, at)` works on `{ y, m, d }` values converted with `Date.UTC`, so there is no time-zone drift. Years and months are subtracted; when days go negative, one month is borrowed and the days are counted from the birth day in the previous month, clamped to that month's length. `birthdayIn()` maps 29 February to 28 February in non-leap years for the next-birthday countdown.

## Limits

- Calendar days only; no time of day.
- Inputs must be valid `YYYY-MM-DD` dates and the birth date must not be after the "age at" date.

## Tests

`tests/tools/age-calculator/age-calculator.test.ts` covers ordinary ages, month ends (31 Jan → 1 Mar, leap February), totals, weekday, leap-day birthdays and invalid input. The e2e spec checks the main flow, no off-origin requests and no sideways scroll at 320 px.

## Known Gaps

- No "difference between two people" mode.
- Dates aren't kept in a share link (they're personal data).
