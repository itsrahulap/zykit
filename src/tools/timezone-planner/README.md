# Time Zone Meeting Planner

## Purpose

Compare cities side by side on a 24-hour grid, see where working hours overlap, pick a slot to get that moment in every zone (copyable text and an `.ics` file). User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (produces `text`, shareable) |
| `TimezonePlannerPage.tsx` | Page: city list, keyboard-navigable grid, selected moment, ICS download |
| `features/cities.ts` | Bundled list of ~230 cities with their IANA zone |
| `features/timezone-planner.ts` | Search, grid/overlap maths, moment text, ICS writer |

## Core Logic

`buildGrid` takes the base zone's local midnight to next midnight (so 23/25-hour days are right) and makes one hourly slot per hour; each row converts every slot with `civilIn`/`offsetMinutes` from `timestamp-converter`. `isWorking` handles overnight windows. `buildIcs` writes a UTC `VEVENT` with escaping and 75-byte folding.

## Limits

Hourly slots, whole-hour working windows, 12 cities, no weekends/holidays or recurrence. Zone rules come from the browser's Intl data.

## Tests

- Unit: `tests/tools/timezone-planner/timezone-planner.test.ts`. `npm test -- timezone-planner`
- E2E: `e2e/timezone-planner.spec.ts`. `npm run test:e2e -- timezone-planner`

## Known Gaps

No per-day working schedules, no 30-minute slots, no calendar-specific invites (attendees, reminders).
