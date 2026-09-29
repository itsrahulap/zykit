import { describe, expect, it } from 'vitest';
import {
  buildPool,
  crackTime,
  generatePassphrase,
  generatePasswords,
  LOOK_ALIKES,
  passphraseBits,
  strengthLabel,
  type PasswordOptions,
} from '../../../src/tools/password-generator/features/password';
import { WORDS } from '../../../src/tools/password-generator/features/words';

const ALL = { lower: true, upper: true, digits: true, symbols: true };
const base: PasswordOptions = { length: 20, sets: ALL, excludeLookAlikes: false, exclude: '', requireEach: true };

describe('word list', () => {
  it('has at least 2048 unique, short, lowercase words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(2048);
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const w of WORDS) expect(w).toMatch(/^[a-z]{3,9}$/);
  });
});

describe('passwords', () => {
  it('honours length, count and sets', () => {
    const r = generatePasswords({ ...base, sets: { ...ALL, symbols: false, upper: false } }, 50);
    if (!r.ok) throw new Error(r.error);
    expect(r.passwords).toHaveLength(50);
    for (const p of r.passwords) expect(p).toMatch(/^[a-z0-9]{20}$/);
    expect(r.bits).toBeCloseTo(20 * Math.log2(36));
  });

  it('includes every chosen set when required, even at minimum length', () => {
    const r = generatePasswords({ ...base, length: 8 }, 300);
    if (!r.ok) throw new Error(r.error);
    for (const p of r.passwords) {
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('excludes look-alikes and custom characters', () => {
    const pool = buildPool({ sets: ALL, excludeLookAlikes: true, exclude: 'abc$' });
    for (const c of LOOK_ALIKES + 'abc$') expect(pool.chars).not.toContain(c);
    const r = generatePasswords({ ...base, excludeLookAlikes: true, exclude: 'abc$', length: 128 }, 20);
    if (!r.ok) throw new Error(r.error);
    for (const p of r.passwords) expect(p).not.toMatch(/[0O1lI|abc$]/);
  });

  it('reports impossible settings', () => {
    expect(generatePasswords({ ...base, sets: { lower: false, upper: false, digits: false, symbols: false } }, 1).ok).toBe(false);
    expect(generatePasswords({ ...base, sets: { ...ALL, digits: true, lower: false, upper: false, symbols: false }, exclude: '0123456789' }, 1).ok).toBe(false);
  });

  it('is roughly uniform over the pool', () => {
    const r = generatePasswords({ ...base, sets: { lower: false, upper: false, digits: true, symbols: false }, length: 100, requireEach: false }, 200);
    if (!r.ok) throw new Error(r.error);
    const counts = new Map<string, number>();
    for (const c of r.passwords.join('')) counts.set(c, (counts.get(c) ?? 0) + 1);
    for (const n of counts.values()) expect(Math.abs(n - 2000)).toBeLessThan(250);
  });
});

describe('passphrases', () => {
  it('builds words with separator, capitals and a number', () => {
    const p = generatePassphrase({ words: 5, separator: '-', capitalize: true, addNumber: true });
    const parts = p.split('-');
    expect(parts).toHaveLength(5);
    for (const w of parts) expect(w).toMatch(/^[A-Z][a-z]+\d?$/);
    expect(p.match(/\d/g)).toHaveLength(1);
  });

  it('computes entropy', () => {
    expect(passphraseBits({ words: 4, separator: ' ', capitalize: false, addNumber: false }, 2048)).toBe(44);
    expect(passphraseBits({ words: 4, separator: ' ', capitalize: false, addNumber: true }, 2048)).toBeCloseTo(44 + Math.log2(40));
  });
});

describe('strength', () => {
  it('labels and estimates crack time', () => {
    expect(strengthLabel(20)).toBe('Very weak');
    expect(strengthLabel(50)).toBe('Fair');
    expect(strengthLabel(128)).toBe('Very strong');
    expect(crackTime(10)).toBe('less than a second');
    expect(crackTime(40)).toBe("about 5 seconds");
    expect(crackTime(48)).toBe("about 23 minutes");
    expect(crackTime(128)).toBe('longer than a trillion years');
    expect(crackTime(70)).toMatch(/years?$/);
  });
});
