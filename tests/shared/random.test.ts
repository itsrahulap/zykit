import { describe, expect, it } from 'vitest';
import { createSampler, entropyBits, randomFrom, shuffle, type RandomFill } from '../../src/shared/lib/random';

/** A fake source that returns the given values in order, then repeats them. */
function scripted(values: number[]): RandomFill {
  let i = 0;
  return (buf) => {
    for (let k = 0; k < buf.length; k++) buf[k] = values[i++ % values.length];
  };
}

describe('createSampler', () => {
  it('rejects values in the biased top slice', () => {
    // max = 3: limit = 2^32 - (2^32 % 3) = 4294967295, so 4294967295 must be rejected.
    const s = createSampler(scripted([4294967295, 4294967295, 7]));
    expect(s.int(3)).toBe(1);
  });

  it('accepts the largest unbiased value', () => {
    const s = createSampler(scripted([4294967294]));
    expect(s.int(3)).toBe(4294967294 % 3);
  });

  it('handles max = 1 and max = 2^32', () => {
    const s = createSampler(scripted([123456789]));
    expect(s.int(1)).toBe(0);
    expect(s.int(2 ** 32)).toBe(123456789);
  });

  it('validates max', () => {
    const s = createSampler();
    expect(() => s.int(0)).toThrow(RangeError);
    expect(() => s.int(1.5)).toThrow(RangeError);
    expect(() => s.int(2 ** 32 + 1)).toThrow(RangeError);
  });

  it('stays in range with the real CSPRNG', () => {
    const s = createSampler();
    for (let i = 0; i < 10_000; i++) {
      const v = s.int(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });

  it('is roughly uniform (chi-squared) for a non power-of-two range', () => {
    const s = createSampler();
    const k = 62;
    const n = 124_000;
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) counts[s.int(k)]++;
    const expected = n / k;
    const chi2 = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
    // df = 61; the 99.99th percentile is about 114. A biased sampler would not fail this
    // at k = 62, but a broken one (e.g. off-by-one, stuck value) would.
    expect(chi2).toBeLessThan(114);
    expect(Math.min(...counts)).toBeGreaterThan(expected * 0.85);
  });

  it('is uniform when the source is adversarially biased toward the top slice', () => {
    // A 3-way split where every value in the rejected zone is presented first.
    const values = [4294967295, 0, 1, 2];
    const s = createSampler(scripted(values));
    const seen = [s.int(3), s.int(3), s.int(3)];
    expect(seen).toEqual([0, 1, 2]);
  });
});

describe('randomFrom / shuffle / entropyBits', () => {
  it('builds strings from the alphabet', () => {
    const out = randomFrom(['a', 'b', 'c'], 500);
    expect(out).toMatch(/^[abc]{500}$/);
    expect(new Set(out).size).toBe(3);
    expect(() => randomFrom([], 3)).toThrow();
  });

  it('shuffles without losing items', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffle([...items]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it('computes entropy', () => {
    expect(entropyBits(16, 32)).toBe(128);
    expect(entropyBits(1, 10)).toBe(0);
    expect(entropyBits(64, 0)).toBe(0);
  });
});
