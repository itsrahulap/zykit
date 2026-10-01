# Date Calculator

## Purpose

Calculates differences between date-times, adds or subtracts durations, and counts or adds business days, all in a chosen IANA time zone. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `DateCalculatorPage.tsx` | Time zone picker, three modes (Difference, Add / subtract, Business days), notices, share state |
| `features/date-calculator.ts` | Pure logic: `addMonths` (clamping), `difference` / `describeDifference`, `addDuration`, date-only helpers (`parseDay`, `parseHolidays`, `businessDaysBetween`, `addBusinessDays`, `dayInfo`, `dayOf`), `WEEKENDS` presets |

Shared code this tool depends on: `src/tools/timestamp-converter/features/timestamp.ts` (`civilIn`, `civilToMs`, formatting, `timeZones`, `localZone`).

## Core Logic

Date-times are wall-clock strings converted with `civilToMs` / `civilIn` from the Timestamp Converter, so all DST handling lives there. `difference` counts whole months via `addMonths` from the start (stepping back one if it overshoots), then splits the wall-clock remainder; `totalMs` is exact and `dstShiftMinutes` is wall minus exact. `addDuration` applies years/months (clamped), then weeks/days on the wall clock, converts back (`gapShiftMinutes` if moved out of a DST gap), then adds h/m/s as elapsed ms. Business days use integer day numbers since 1970 (UTC, no zones): `businessDaysBetween` is an inclusive loop (NETWORKDAYS), `addBusinessDays` excludes the start (WORKDAY).

## Limits

- `MAX_SPAN_DAYS` = 366,000 for counting and as a loop guard; `addBusinessDays` rejects |n| > 100,000; the page rejects duration fields above ±1,000,000; `addDuration` results limited to years 1–9999.
- Business-day loops are O(days); fine at these limits.

## Tests

- Unit: `tests/tools/date-calculator/date-calculator.test.ts` (month lengths and clamping, differences incl. month ends, reversed order and DST, `addDuration` mixing units, DST gaps, invalid input, strict date parsing, NETWORKDAYS / WORKDAY, holiday parsing, ISO weeks, zone-dependent dates). `npm test -- date-calculator`
- E2E: `e2e/date-calculator.spec.ts` (all three modes end to end, phone layout without sideways scroll). `npm run test:e2e -- date-calculator`

## Known Gaps

- No built-in holiday calendars or custom weekend days beyond the four presets.
- `parseDay` uses `Date.UTC`, which maps years 0–99 to 1900–1999, so dates in years 0001–0099 are rejected in business-day mode.
- When **Add business days** exceeds ±100,000 the page shows the generic "Enter a start date and a whole number." message.
