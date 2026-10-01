# Cron Expression Builder

## Purpose

Parses cron expressions, explains them in plain English, edits them field by field and lists the next run times in any time zone. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `CronBuilderPage.tsx` | Expression input, per-field builder, presets, time zone picker, next runs, share state |
| `features/cron.ts` | Everything else, dependency-free: `parseCron` / `parseField`, `describeCron`, `nextRuns`, time-zone helpers (`wallTime`, `resolveWall`), builder ↔ field conversion, `PRESETS` |

## Core Logic

`parseCron` accepts 5 fields or 6 (seconds first), expands macros, and returns per-field errors. Each field becomes a set of allowed values plus day-specific items (`lastDay`, `nearestWeekday`, `nthDow`…). `nextRuns(cron, from, tz, count = 10, years = 8)` walks forward day by day on the time zone's wall clock, applies classic OR semantics when both day fields are restricted (`dayMatches`), and maps each wall time to an instant with `resolveWall` (DST gaps skipped, repeated times run once). It returns `complete: false` when fewer than `count` runs exist within the horizon.

## Limits

- No year field (7 fields rejected); day-of-week uses standard numbering (0/7 = Sunday), not Quartz's.
- 8-year search horizon; `@reboot` has no runs.
- Time zones come from `Intl.supportedValuesOf('timeZone')`, so the list depends on the browser.

## Tests

- Unit: `tests/tools/cron-builder/cron.test.ts` (parsing, errors, macros, descriptions, next runs incl. leap years, L/W/#, OR semantics, seconds, DST gaps and repeats, impossible schedules). `npm test -- cron-builder`
- E2E: `e2e/cron-builder.spec.ts` (explain + next runs + builder edits, errors and macros, 320 px layout). `npm run test:e2e -- cron-builder`

## Known Gaps

- No dialect switch (e.g. Quartz day-of-week numbering, AWS EventBridge or GitHub Actions specifics).
- Descriptions are English only.
