import { createSampler, entropyBits, randomFrom, shuffle, type Sampler } from '../../../shared/lib/random';
import { WORDS } from './words';

export const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~|',
} as const;
export type SetName = keyof typeof SETS;
export const SET_NAMES: SetName[] = ['lower', 'upper', 'digits', 'symbols'];

export const LOOK_ALIKES = '0O1lI|';
export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

export interface PasswordOptions {
  length: number;
  sets: Record<SetName, boolean>;
  excludeLookAlikes: boolean;
  /** Extra characters to leave out. */
  exclude: string;
  /** Every chosen set appears at least once. */
  requireEach: boolean;
}

export interface Pool {
  /** Each chosen set after exclusions (empty sets removed). */
  groups: string[][];
  /** All usable characters, deduplicated. */
  chars: string[];
}

export function buildPool(o: Pick<PasswordOptions, 'sets' | 'excludeLookAlikes' | 'exclude'>): Pool {
  const banned = new Set([...o.exclude, ...(o.excludeLookAlikes ? LOOK_ALIKES : '')]);
  const groups = SET_NAMES.filter((n) => o.sets[n])
    .map((n) => [...SETS[n]].filter((c) => !banned.has(c)))
    .filter((g) => g.length > 0);
  return { groups, chars: [...new Set(groups.flat())] };
}

export type PasswordResult = { ok: true; passwords: string[]; bits: number } | { ok: false; error: string };

/** Entropy of one password. With `requireEach` this is a slight overestimate, which we accept. */
export function passwordBits(pool: Pool, length: number): number {
  return entropyBits(pool.chars.length, length);
}

export function generatePasswords(o: PasswordOptions, count: number, sampler: Sampler = createSampler()): PasswordResult {
  const pool = buildPool(o);
  if (pool.chars.length === 0) return { ok: false, error: 'Choose at least one character set with characters left after exclusions.' };
  if (o.requireEach && pool.groups.length > o.length) return { ok: false, error: `A ${o.length}-character password can't include all ${pool.groups.length} sets.` };
  const passwords: string[] = [];
  for (let i = 0; i < count; i++) passwords.push(onePassword(pool, o.length, o.requireEach, sampler));
  return { ok: true, passwords, bits: passwordBits(pool, o.length) };
}

function onePassword(pool: Pool, length: number, requireEach: boolean, sampler: Sampler): string {
  if (!requireEach || pool.groups.length < 2) return randomFrom(pool.chars, length, sampler);
  // Redraw until every set is present: this keeps the result uniform over all valid passwords.
  for (let attempt = 0; attempt < 200; attempt++) {
    const pw = randomFrom(pool.chars, length, sampler);
    if (pool.groups.every((g) => g.some((c) => pw.includes(c)))) return pw;
  }
  // Very short passwords with many sets: place one of each, fill the rest, then shuffle.
  const chars = pool.groups.map((g) => g[sampler.int(g.length)]);
  while (chars.length < length) chars.push(pool.chars[sampler.int(pool.chars.length)]);
  return shuffle(chars, sampler).join('');
}

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  /** Append one random digit to one random word. */
  addNumber: boolean;
}

export const MIN_WORDS = 3;
export const MAX_WORDS = 12;

export function passphraseBits(o: PassphraseOptions, listSize = WORDS.length): number {
  return entropyBits(listSize, o.words) + (o.addNumber ? Math.log2(10 * o.words) : 0);
}

export function generatePassphrase(o: PassphraseOptions, sampler: Sampler = createSampler(), list: readonly string[] = WORDS): string {
  const words = Array.from({ length: o.words }, () => {
    const w = list[sampler.int(list.length)];
    return o.capitalize ? w[0].toUpperCase() + w.slice(1) : w;
  });
  if (o.addNumber) {
    const i = sampler.int(words.length);
    words[i] += String(sampler.int(10));
  }
  return words.join(o.separator);
}

export type Strength = 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';

export function strengthLabel(bits: number): Strength {
  if (bits < 28) return 'Very weak';
  if (bits < 40) return 'Weak';
  if (bits < 60) return 'Fair';
  if (bits < 90) return 'Strong';
  return 'Very strong';
}

/** Guesses per second assumed for an offline attack on a fast hash with a GPU rig. */
export const GUESSES_PER_SECOND = 1e11;

/** Rough average time to guess (half the key space) at GUESSES_PER_SECOND. */
export function crackTime(bits: number, rate = GUESSES_PER_SECOND): string {
  const seconds = 2 ** Math.max(0, bits - 1) / rate;
  if (seconds < 1) return 'less than a second';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [365.25, 'day'],
    [1000, 'year'],
    [1000, 'thousand years'],
    [1000, 'million years'],
    [1000, 'billion years'],
  ];
  let v = seconds;
  for (const [size, name] of units) {
    if (v < size) {
      const n = Math.floor(v);
      return name.includes(' ') ? `about ${n} ${name}` : `about ${n} ${name}${n === 1 ? '' : 's'}`;
    }
    v /= size;
  }
  return 'longer than a trillion years';
}
