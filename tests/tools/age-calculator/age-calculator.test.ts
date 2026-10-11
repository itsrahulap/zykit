import { describe, expect, it } from 'vitest';
import { age, birthdayIn, parseDate } from '../../../src/tools/age-calculator/features/age-calculator';

const d = (s: string) => parseDate(s)!;

describe('age', () => {
  it('counts years, months and days', () => {
    expect(age(d('1990-05-15'), d('2026-10-10'))).toMatchObject({ years: 36, months: 4, days: 25 });
    expect(age(d('2000-01-15'), d('2001-03-10'))).toMatchObject({ years: 1, months: 1, days: 23 });
  });

  it('handles month ends', () => {
    expect(age(d('2023-01-31'), d('2023-03-01'))).toMatchObject({ years: 0, months: 1, days: 1 });
    expect(age(d('2024-01-31'), d('2024-02-29'))).toMatchObject({ years: 0, months: 0, days: 29 });
    expect(age(d('2023-12-31'), d('2024-01-01'))).toMatchObject({ years: 0, months: 0, days: 1, totalDays: 1 });
  });

  it('gives totals and the weekday of birth', () => {
    const a = age(d('2000-01-01'), d('2000-01-15'))!;
    expect(a).toMatchObject({ totalDays: 14, totalWeeks: 2, totalHours: 336, bornOn: 'Saturday' });
  });

  it('treats 28 February as the birthday of 29 February babies in non-leap years', () => {
    expect(birthdayIn(d('2000-02-29'), 2025)).toEqual({ y: 2025, m: 2, d: 28 });
    expect(birthdayIn(d('2000-02-29'), 2028)).toEqual({ y: 2028, m: 2, d: 29 });
    expect(age(d('2000-02-29'), d('2025-03-01'))!.nextBirthday).toEqual({ date: '2026-02-28', daysUntil: 364, turning: 26 });
  });

  it('says 0 days on the birthday and rejects future birth dates and bad input', () => {
    expect(age(d('1990-10-10'), d('2026-10-10'))!.nextBirthday).toEqual({ date: '2026-10-10', daysUntil: 0, turning: 36 });
    expect(age(d('2030-01-01'), d('2026-01-01'))).toBeNull();
    expect(parseDate('2023-02-29')).toBeNull();
    expect(parseDate('nope')).toBeNull();
  });
});
