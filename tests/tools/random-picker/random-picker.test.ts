import { describe, expect, it } from 'vitest';
import {
  coinStats,
  makeTeams,
  parseDice,
  parseList,
  pickWinners,
  randomInRange,
  rollDice,
  shuffled,
  type Side,
} from '../../../src/tools/random-picker/features/picker';
import { createSampler, type RandomFill } from '../../../src/shared/lib/random';

// Deterministic xorshift32 source so the statistical tests never flake.
function seeded(seed: number): RandomFill {
  let x = seed >>> 0 || 1;
  return (buf) => {
    for (let i = 0; i < buf.length; i++) {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5;
      x >>>= 0;
      buf[i] = x;
    }
  };
}
const rng = () => createSampler(seeded(12345));
const opts = { dedupe: false, weights: false };

describe('parseList', () => {
  it('skips blank lines, trims, and keeps stars as text unless weights are on', () => {
    expect(parseList(' a \n\n b*3 \r\nc', opts).entries.map((e) => e.name)).toEqual(['a', 'b*3', 'c']);
  });
  it('reads weights', () => {
    const { entries } = parseList('ann*3\nbob * 0.5\ncy*0\ndi*x\nei*5000', { ...opts, weights: true });
    expect(entries).toEqual([
      { name: 'ann', weight: 3 },
      { name: 'bob', weight: 0.5 },
      { name: 'cy*0', weight: 1 },
      { name: 'di*x', weight: 1 },
      { name: 'ei*5000', weight: 1 },
    ]);
  });
  it('removes duplicates ignoring case and counts them', () => {
    const r = parseList('Ann\nann\nBob\nANN', { ...opts, dedupe: true });
    expect(r.entries.map((e) => e.name)).toEqual(['Ann', 'Bob']);
    expect(r.duplicates).toBe(2);
  });
});

describe('pickWinners', () => {
  const names = ['a', 'b', 'c', 'd', 'e'].map((name) => ({ name, weight: 1 }));
  it('never repeats and caps at the list size', () => {
    const w = pickWinners(names, 99, rng());
    expect(w.map((e) => e.name).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('is roughly uniform', () => {
    const s = rng();
    const hits: Record<string, number> = {};
    for (let i = 0; i < 10_000; i++) {
      const [w] = pickWinners(names, 1, s);
      hits[w.name] = (hits[w.name] ?? 0) + 1;
    }
    for (const n of Object.values(hits)) expect(Math.abs(n - 2000)).toBeLessThan(200);
  });
  it('follows weights', () => {
    const s = rng();
    const list = [{ name: 'heavy', weight: 3 }, { name: 'light', weight: 1 }];
    let heavy = 0;
    for (let i = 0; i < 8000; i++) if (pickWinners(list, 1, s)[0].name === 'heavy') heavy++;
    expect(heavy / 8000).toBeGreaterThan(0.72);
    expect(heavy / 8000).toBeLessThan(0.78);
  });
});

describe('shuffled', () => {
  it('keeps every item and does not touch the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    expect(shuffled(input, rng()).sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('puts each item first about equally often', () => {
    const s = rng();
    const first = [0, 0, 0, 0];
    for (let i = 0; i < 8000; i++) first[shuffled([0, 1, 2, 3], s)[0]]++;
    for (const n of first) expect(Math.abs(n - 2000)).toBeLessThan(200);
  });
});

describe('makeTeams', () => {
  const items = Array.from({ length: 11 }, (_, i) => i);
  it('splits into K balanced teams', () => {
    const t = makeTeams(items, { teams: 4 }, rng());
    expect(t.map((x) => x.length).sort()).toEqual([2, 3, 3, 3]);
    expect(t.flat().sort((a, b) => a - b)).toEqual(items);
  });
  it('makes teams of size S, balanced and never larger than S', () => {
    const t = makeTeams(items, { size: 4 }, rng());
    expect(t).toHaveLength(3);
    expect(t.map((x) => x.length).sort()).toEqual([3, 4, 4]);
  });
  it('copes with edge cases', () => {
    expect(makeTeams([], { teams: 3 }, rng())).toEqual([]);
    expect(makeTeams([1, 2], { teams: 9 }, rng())).toHaveLength(2);
    expect(makeTeams([1, 2, 3], { teams: 0 }, rng())).toHaveLength(1);
    expect(makeTeams([1, 2, 3], { size: 0 }, rng())).toHaveLength(3);
  });
});

describe('coinStats', () => {
  it('counts heads, tails and streaks', () => {
    const h: Side[] = ['H', 'H', 'T', 'T', 'T', 'H'];
    expect(coinStats(h)).toEqual({ heads: 3, tails: 3, current: { side: 'H', length: 1 }, longest: 3 });
    expect(coinStats([])).toEqual({ heads: 0, tails: 0, current: { side: null, length: 0 }, longest: 0 });
  });
});

describe('dice', () => {
  it('parses notation', () => {
    expect(parseDice('2d6+3')).toEqual({ ok: true, spec: { count: 2, sides: 6, modifier: 3 } });
    expect(parseDice(' D20 ')).toEqual({ ok: true, spec: { count: 1, sides: 20, modifier: 0 } });
    expect(parseDice('4d6 - 1')).toEqual({ ok: true, spec: { count: 4, sides: 6, modifier: -1 } });
  });
  it('rejects bad input and limits', () => {
    for (const bad of ['', 'abc', '2d', '0d6', '101d6', '2d1', '2d1001', '2d6+', '2d6*3', '1d6+99999']) expect(parseDice(bad).ok, bad).toBe(false);
  });
  it('rolls within range with the modifier applied', () => {
    const s = rng();
    for (let i = 0; i < 500; i++) {
      const { rolls, total } = rollDice({ count: 2, sides: 6, modifier: 3 }, s);
      expect(rolls).toHaveLength(2);
      expect(rolls.every((r) => r >= 1 && r <= 6)).toBe(true);
      expect(total).toBe(rolls[0] + rolls[1] + 3);
    }
  });
  it('rolls each face about equally often', () => {
    const s = rng();
    const c = Array(6).fill(0);
    for (let i = 0; i < 12_000; i++) c[rollDice({ count: 1, sides: 6, modifier: 0 }, s).rolls[0] - 1]++;
    for (const n of c) expect(Math.abs(n - 2000)).toBeLessThan(200);
  });
});

describe('randomInRange', () => {
  it('stays inside the inclusive range, negatives included', () => {
    const s = rng();
    for (let i = 0; i < 500; i++) expect(randomInRange(-3, 3, s)!).toBeGreaterThanOrEqual(-3);
    expect(randomInRange(5, 5, s)).toBe(5);
  });
  it('rejects empty or invalid ranges', () => {
    expect(randomInRange(5, 4, rng())).toBeNull();
    expect(randomInRange(1.5, 4, rng())).toBeNull();
    expect(randomInRange(0, 2 ** 32, rng())).toBeNull();
  });
});
