import { describe, expect, it } from 'vitest';
import { addPeriods, amortise, isValidDate, periodsFor, savings, toCsv, yearly, type LoanInput } from '../../../src/tools/loan-calculator/features/loan-calculator';

const base: LoanInput = { principal: 100_000_000, annualRate: 8.5, periods: 240, frequency: 'monthly', start: '2026-01-15' };

describe('Loan / EMI Calculator', () => {
  it('matches the known EMI for 10,00,000 at 8.5% over 20 years', () => {
    const r = amortise(base);
    expect(r.emi).toBe(867_823); // Rs 8,678.23
    expect(r.rows).toHaveLength(240);
    expect(r.rows[239].balance).toBe(0);
    expect(r.totalInterest + base.principal).toBe(r.totalPaid);
    expect(Math.abs(r.totalPaid - 240 * r.emi)).toBeLessThan(240); // final payment absorbs rounding only
  });
  it('handles a 0% rate', () => {
    const r = amortise({ ...base, principal: 120_000, annualRate: 0, periods: 12 });
    expect(r.emi).toBe(10_000);
    expect(r.totalInterest).toBe(0);
    expect(r.rows[11].balance).toBe(0);
  });
  it('final payment absorbs rounding when the principal does not divide', () => {
    const r = amortise({ ...base, principal: 100_000, annualRate: 0, periods: 3 });
    expect(r.rows.map((x) => x.payment)).toEqual([33_333, 33_333, 33_334]);
  });
  it('single period loan', () => {
    const r = amortise({ ...base, principal: 100_000, periods: 1, annualRate: 12 });
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].interest).toBe(1000);
    expect(r.rows[0].balance).toBe(0);
  });
  it('periods from years and months for each frequency', () => {
    expect(periodsFor(2, 6, 'monthly')).toBe(30);
    expect(periodsFor(1, 0, 'weekly')).toBe(52);
    expect(periodsFor(1, 0, 'fortnightly')).toBe(26);
    expect(periodsFor(0, 18, 'quarterly')).toBe(6);
  });
  it('dates: month-end clamp, weekly, fortnightly, quarterly', () => {
    expect(addPeriods('2026-01-31', 'monthly', 1)).toBe('2026-02-28');
    expect(addPeriods('2026-01-31', 'monthly', 2)).toBe('2026-03-31');
    expect(addPeriods('2026-11-30', 'monthly', 3)).toBe('2027-02-28');
    expect(addPeriods('2026-01-01', 'weekly', 2)).toBe('2026-01-15');
    expect(addPeriods('2026-01-01', 'fortnightly', 1)).toBe('2026-01-15');
    expect(addPeriods('2026-01-31', 'quarterly', 1)).toBe('2026-04-30');
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-02-28')).toBe(true);
  });
  it('recurring extra payment reduces tenure and saves interest', () => {
    const input = { ...base, extra: 100_000, prepay: 'tenure' as const };
    const r = amortise(input);
    const s = savings(input, r);
    expect(r.rows.length).toBeLessThan(240);
    expect(s.interestSaved).toBeGreaterThan(0);
    expect(s.periodsSaved).toBe(240 - r.rows.length);
    expect(r.rows[r.rows.length - 1].balance).toBe(0);
  });
  it('one-off prepayment can reduce the EMI instead', () => {
    const input: LoanInput = { ...base, oneOff: { date: '2027-01-15', amount: 20_000_000 }, prepay: 'emi' };
    const r = amortise(input);
    expect(r.rows).toHaveLength(240);
    expect(r.rows[11].extra).toBe(20_000_000);
    expect(r.rows[12].payment).toBeLessThan(r.emi);
    expect(r.rows[239].balance).toBe(0);
    expect(savings(input, r).interestSaved).toBeGreaterThan(0);
  });
  it('a prepayment larger than the balance clears the loan', () => {
    const r = amortise({ ...base, oneOff: { date: '2026-01-01', amount: 999_999_999 }, prepay: 'tenure' });
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].balance).toBe(0);
    expect(r.rows[0].extra).toBe(base.principal - r.rows[0].principal);
  });
  it('yearly summary and CSV', () => {
    const r = amortise(base);
    const y = yearly(r.rows, 'monthly');
    expect(y).toHaveLength(20);
    expect(y[19].balance).toBe(0);
    expect(y.reduce((a, b) => a + b.interest, 0)).toBe(r.totalInterest);
    const csv = toCsv(r.rows.slice(0, 1), 2).split('\n');
    expect(csv[0]).toBe('Period,Date,Payment,Principal,Interest,Extra payment,Balance');
    expect(csv[1].startsWith('1,2026-02-15,8678.23,')).toBe(true);
  });
});
