# Stopwatch & Timer

## Purpose

A stopwatch with laps, multiple countdown timers with finish alerts, and a Pomodoro focus timer. User-facing docs live in [`docs.ts`](docs.ts).

## File Structure

| File | Responsibility |
|---|---|
| `index.ts` | Tool definition (`shareable: true`: settings only) |
| `StopwatchTimerPage.tsx` | Page: Stopwatch, Timers and Pomodoro tabs, hotkeys, tab-title countdown |
| `features/time.ts` | Pure time math: elapsed, formatting, h/m/s, laps, Pomodoro phase order |
| `features/alert.ts` | WebAudio beep and permission-gated Notification |

## Core Logic

Each clock keeps `performance.now()` timestamps (a start time for the stopwatch, an end time for countdowns) and derives the displayed time on every refresh, so throttled background tabs stay exact. The refresh interval is 50 ms for the stopwatch (1 s under `prefers-reduced-motion`) and 250 ms for countdowns. Finished timers are detected on refresh; Pomodoro chains the next phase from the exact previous end time. The tab title shows the shortest running countdown. All three tabs stay mounted so running clocks survive tab switches.

## Limits

Timer max 99:59:59. Pomodoro focus 1-180, short 1-60, long 1-120 min, 1-12 sessions per cycle. State is not persisted. Only the settings (`work`, `short`, `long`, `cycles`, `auto`, `h`, `m`, `s`) are shared via URL fragment, clamped on restore.

## Tests

- Unit: `tests/tools/stopwatch-timer/stopwatch-timer.test.ts`. `npm test -- stopwatch-timer`
- E2E: `e2e/stopwatch-timer.spec.ts`. `npm run test:e2e -- stopwatch-timer`

## Known Gaps

No persistence across reloads, no custom timer names, and no Notification fallback via a service worker on mobile browsers that need one.
