# Timestamp Converter

## Purpose

Converts Unix timestamps (s, ms, µs, ns) to dates in any time zone and wall-clock dates back to timestamps. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`) |
| `TimestampConverterPage.tsx` | Live "now" clock, timestamp → date panel, date → timestamp panel, share state |
| `features/timestamp.ts` | Pure logic: `parseTimestamp` / `detectUnit`, zone formatting (`civilIn`, `offsetMinutes`, `formatInZone`, `isoInZone`, `rfc2822`), `calendarInfo`, `relativeTime`, `civilToMs`, `timeZones` |

## Core Logic

`parseTimestamp` strips spaces, commas and underscores, validates a decimal/exponent number, picks the unit by magnitude (`detectUnit`: `<1e11` s, `<1e14` ms, `<1e17` µs, else ns) unless overridden, and rejects anything beyond `MAX_DATE_MS` (8.64e15). All zone maths goes through `civilIn`, which reads wall-clock parts from a cached `Intl.DateTimeFormat` per zone (era-aware for BC years); offsets are derived from it rather than from `Date#getTimezoneOffset`. `civilToMs` tries the two offsets around a guess, keeps the earliest that round-trips (DST overlap) and shifts forward in a gap.

## Limits

- Numbers are plain `Number`s, so ns input above 2^53 loses precision; output is to the millisecond.
- Time zones come from `Intl.supportedValuesOf('timeZone')`, falling back to `FALLBACK_ZONES` (18 zones) when unsupported.

## Tests

- Unit: `tests/tools/timestamp-converter/timestamp.test.ts` (unit detection and override, separators, invalid and out-of-range input, zone formatting, negative timestamps, ISO weeks, relative time, `civilToMs` incl. DST gaps/overlaps and invalid dates, zone list). `npm test -- timestamp-converter`
- E2E: `e2e/timestamp-converter.spec.ts` (both directions across zones, unit override, errors, only same-origin GETs, 320 px layout). `npm run test:e2e -- timestamp-converter`

## Known Gaps

- The timestamp field doesn't parse date strings (ISO 8601, RFC 2822); reverse conversion only uses the `datetime-local` picker.
- No µs/ns output rows, and relative time is English only.
