import { describe, expect, it } from 'vitest';
import {
  addLap,
  clampInt,
  elapsedMs,
  formatCountdown,
  formatStopwatch,
  hmsToMs,
  lapExtremes,
  lapsToText,
  msToHms,
  nextPhase,
} from '../../../src/tools/stopwatch-timer/features/time';

describe('formatting', () => {
  it('formats the stopwatch with centiseconds, truncating', () => {
    expect(formatStopwatch(0)).toBe('00:00.00');
    expect(formatStopwatch(1239)).toBe('00:01.23');
    expect(formatStopwatch(61_000)).toBe('01:01.00');
    expect(formatStopwatch(3_723_450)).toBe('1:02:03.45');
    expect(formatStopwatch(3_723_450, false)).toBe('1:02:03');
    expect(formatStopwatch(-5)).toBe('00:00.00');
  });
  it('rounds countdowns up', () => {
    expect(formatCountdown(1)).toBe('00:01');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(90_000)).toBe('01:30');
    expect(formatCountdown(3_600_000)).toBe('1:00:00');
  });
});

describe('elapsed time', () => {
  it('is derived from timestamps, so a long gap between ticks is still exact', () => {
    expect(elapsedMs(500, null, 99_999)).toBe(500);
    expect(elapsedMs(500, 1000, 1000 + 3_600_000)).toBe(3_600_500);
    expect(elapsedMs(0, 2000, 1000)).toBe(0);
  });
});

describe('hms', () => {
  it('converts and clamps', () => {
    expect(hmsToMs(1, 30, 15)).toBe(5_415_000);
    expect(hmsToMs(0, 0, 90)).toBe(90_000);
    expect(hmsToMs(500, 0, 0)).toBe(99 * 3_600_000);
    expect(hmsToMs(-1, -1, NaN)).toBe(0);
    expect(msToHms(5_415_000)).toEqual({ h: 1, m: 30, s: 15 });
    expect(clampInt(3.6, 1, 3)).toBe(3);
  });
});

describe('laps', () => {
  const laps = [1500, 2600, 6000].reduce(addLap, []);
  it('records lap and split times', () => {
    expect(laps.map((l) => l.lap)).toEqual([1500, 1100, 3400]);
    expect(laps.map((l) => l.split)).toEqual([1500, 2600, 6000]);
  });
  it('finds fastest and slowest only with two or more laps', () => {
    expect(lapExtremes(laps)).toEqual({ fastest: 2, slowest: 3 });
    expect(lapExtremes(laps.slice(0, 1))).toEqual({ fastest: null, slowest: null });
  });
  it('exports as tab-separated text', () => {
    expect(lapsToText(laps).split('\n')[2]).toBe('2\t00:01.10\t00:02.60');
  });
});

describe('pomodoro', () => {
  it('takes a long break after every N focus sessions', () => {
    expect(nextPhase('work', 0, 4)).toEqual({ phase: 'short', sessions: 1 });
    expect(nextPhase('work', 3, 4)).toEqual({ phase: 'long', sessions: 4 });
    expect(nextPhase('short', 1, 4)).toEqual({ phase: 'work', sessions: 1 });
    expect(nextPhase('long', 4, 4)).toEqual({ phase: 'work', sessions: 4 });
  });
});
