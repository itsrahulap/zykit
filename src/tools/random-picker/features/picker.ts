// Pure logic for Random Picker: list parsing, winners, teams, coin streaks and dice.
// All randomness comes from a Sampler (see shared/lib/random.ts), so tests can inject a fake source.

import { shuffle, type Sampler } from '../../../shared/lib/random';

export const MAX_ENTRIES = 10_000;
export const MAX_WEIGHT = 1000;
export const MAX_DICE = 100;
export const MAX_SIDES = 1000;
export const MAX_MODIFIER = 10_000;

export interface Entry {
  name: string;
  weight: number;
}

export interface ParsedList {
  entries: Entry[];
  /** Lines dropped as duplicates. */
  duplicates: number;
  /** True when more than MAX_ENTRIES lines were given and the rest ignored. */
  truncated: boolean;
}

/**
 * One entry per line; blank lines are skipped. With `weights`, "name*3" gives "name" three times the
 * chance (a positive number up to 1000, decimals allowed); anything else after a star stays in the name.
 * With `dedupe`, repeated names (ignoring case) keep their first line.
 */
export function parseList(text: string, opts: { dedupe: boolean; weights: boolean }): ParsedList {
  const entries: Entry[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  let truncated = false;
  for (const raw of text.split(/\r?\n/)) {
    let name = raw.trim();
    if (!name) continue;
    let weight = 1;
    const m = opts.weights ? /^(.*\S)\s*\*\s*(\d+(?:\.\d+)?)$/.exec(name) : null;
    if (m && Number(m[2]) > 0 && Number(m[2]) <= MAX_WEIGHT) {
      name = m[1];
      weight = Number(m[2]);
    }
    if (opts.dedupe) {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
    }
    if (entries.length >= MAX_ENTRIES) {
      truncated = true;
      break;
    }
    entries.push({ name, weight });
  }
  return { entries, duplicates, truncated };
}

/** A uniform float in [0, 1) with 32 bits of resolution. */
const unit = (s: Sampler) => s.int(2 ** 32) / 2 ** 32;

/** Picks up to `n` different entries; each draw is proportional to weight among those still left. */
export function pickWinners(entries: Entry[], n: number, sampler: Sampler): Entry[] {
  const pool = [...entries];
  const out: Entry[] = [];
  let total = pool.reduce((sum, e) => sum + e.weight, 0);
  while (out.length < n && pool.length) {
    let r = unit(sampler) * total;
    let i = 0;
    while (i < pool.length - 1 && r >= pool[i].weight) r -= pool[i++].weight;
    const [won] = pool.splice(i, 1);
    total -= won.weight;
    out.push(won);
  }
  return out;
}

export const shuffled = <T>(items: readonly T[], sampler: Sampler): T[] => shuffle([...items], sampler);

/**
 * Shuffles, then deals round-robin, so team sizes differ by at most one.
 * Give either `teams` (K teams) or `size` (teams of up to S, which means ceil(n / S) teams).
 */
export function makeTeams<T>(items: readonly T[], by: { teams: number } | { size: number }, sampler: Sampler): T[][] {
  const n = items.length;
  if (!n) return [];
  const raw = 'teams' in by ? by.teams : Math.ceil(n / Math.max(1, by.size));
  const k = Math.min(n, Math.max(1, Math.floor(raw)));
  const teams: T[][] = Array.from({ length: k }, () => []);
  shuffled(items, sampler).forEach((item, i) => teams[i % k].push(item));
  return teams;
}

export type Side = 'H' | 'T';

export const flipCoin = (sampler: Sampler): Side => (sampler.int(2) === 0 ? 'H' : 'T');

export interface CoinStats {
  heads: number;
  tails: number;
  /** The run the latest flips are in (length 0 with no flips). */
  current: { side: Side | null; length: number };
  longest: number;
}

export function coinStats(history: readonly Side[]): CoinStats {
  let heads = 0;
  let longest = 0;
  let run = 0;
  let prev: Side | null = null;
  for (const s of history) {
    if (s === 'H') heads++;
    run = s === prev ? run + 1 : 1;
    prev = s;
    longest = Math.max(longest, run);
  }
  return { heads, tails: history.length - heads, current: { side: prev, length: run }, longest };
}

export interface DiceSpec {
  count: number;
  sides: number;
  modifier: number;
}

export type DiceParse = { ok: true; spec: DiceSpec } | { ok: false; error: string };

/** Parses NdM with an optional +K or -K: "d20", "3d8", "2d6+3", "4d6 - 1". */
export function parseDice(input: string): DiceParse {
  const m = /^\s*(\d*)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i.exec(input);
  if (!m) return { ok: false, error: 'Use dice notation like d20, 3d6 or 2d6+3.' };
  const count = m[1] === '' ? 1 : Number(m[1]);
  const sides = Number(m[2]);
  const modifier = m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
  if (count < 1 || count > MAX_DICE) return { ok: false, error: `Roll between 1 and ${MAX_DICE} dice at a time.` };
  if (sides < 2 || sides > MAX_SIDES) return { ok: false, error: `Dice need 2 to ${MAX_SIDES} sides.` };
  if (Math.abs(modifier) > MAX_MODIFIER) return { ok: false, error: `The modifier can be at most ${MAX_MODIFIER}.` };
  return { ok: true, spec: { count, sides, modifier } };
}

export function rollDice(spec: DiceSpec, sampler: Sampler): { rolls: number[]; total: number } {
  const rolls = Array.from({ length: spec.count }, () => sampler.int(spec.sides) + 1);
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) + spec.modifier };
}

/** A uniform integer from min to max, both included. Null if the range is empty or too large. */
export function randomInRange(min: number, max: number, sampler: Sampler): number | null {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min || max - min + 1 > 2 ** 32) return null;
  return min + sampler.int(max - min + 1);
}
