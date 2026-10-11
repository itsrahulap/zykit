import { describe, expect, it } from 'vitest';
import { inflationAdjusted, lumpSum, parseAmount, sip } from '../../../src/tools/sip-calculator/features/sip-calculator';

const last = <T,>(a: T[]) => a[a.length - 1];

describe('sip', () => {
  it('matches the standard SIP values for ₹10,000/month at 12% for 10 years', () => {
    expect(last(sip(10_000, 12, 10, 0, 'start')).value).toBeCloseTo(2_323_391, -1);
    expect(last(sip(10_000, 12, 10, 0, 'end')).value).toBeCloseTo(2_300_387, -1);
    expect(last(sip(10_000, 12, 10)).invested).toBe(1_200_000);
  });

  it('steps up the instalment every year', () => {
    const rows = sip(1000, 0, 2, 10);
    expect(rows[0].invested).toBe(12_000);
    expect(rows[1].invested).toBeCloseTo(12_000 + 13_200);
  });

  it('handles a 0% return', () => {
    expect(last(sip(500, 0, 3)).value).toBe(18_000);
  });
});

describe('lump sum and inflation', () => {
  it('compounds at the chosen frequency', () => {
    expect(last(lumpSum(100_000, 10, 1, 1)).value).toBeCloseTo(110_000);
    expect(last(lumpSum(100_000, 12, 1, 12)).value).toBeCloseTo(112_682.5, 0);
  });

  it('discounts a future value for inflation', () => {
    expect(inflationAdjusted(121, 10, 2)).toBeCloseTo(100);
  });

  it('parses amounts', () => {
    expect(parseAmount('1,00,000')).toBe(100000);
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});
