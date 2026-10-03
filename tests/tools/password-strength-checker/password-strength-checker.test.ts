import { describe, expect, it } from 'vitest';
import { COMMON_PASSWORDS, EXTRA_WORDS, NAMES } from '../../../src/tools/password-strength-checker/features/data';
import { WORDS } from '../../../src/tools/password-generator/features/words';
import {
  analyse,
  buildDicts,
  humanTime,
  mostGuessable,
  omnimatch,
  parseCustomWords,
  scoreFromGuesses,
} from '../../../src/tools/password-strength-checker/features/password-strength-checker';

const dicts = buildDicts({ passwords: COMMON_PASSWORDS, words: [...EXTRA_WORDS, ...WORDS], names: NAMES });
const patterns = (pw: string) => analyse(pw, dicts).sequence.map((m) => m.pattern);

describe('password strength', () => {
  it('rates top common passwords as very weak with a warning', () => {
    for (const pw of ['password', '123456', 'qwerty', 'iloveyou']) {
      const a = analyse(pw, dicts);
      expect(a.score, pw).toBe(0);
      expect(a.feedback.warning, pw).toMatch(/common password|easy to guess/i);
    }
    expect(analyse('password', dicts).feedback.warning).toMatch(/top-100|top-10/);
  });

  it('sees through l33t substitutions and capitalisation', () => {
    const a = analyse('P@ssw0rd', dicts);
    expect(a.score).toBeLessThanOrEqual(1);
    expect(a.sequence[0].l33t).toBe(true);
    expect(analyse('Password1', dicts).score).toBeLessThanOrEqual(1);
  });

  it('detects keyboard walks across layouts', () => {
    expect(omnimatch('zxcvbnm', dicts).some((m) => m.pattern === 'spatial')).toBe(true);
    const walk = omnimatch('asdfghjk', dicts).find((m) => m.pattern === 'spatial');
    expect(walk?.graph).toBe('qwerty');
    expect(omnimatch('azertyui', dicts).some((m) => m.pattern === 'spatial' && m.graph === 'azerty')).toBe(true);
    expect(omnimatch('7894561', dicts).some((m) => m.pattern === 'spatial' && m.graph === 'keypad')).toBe(true);
    expect(analyse('qwertyuiop', dicts).score).toBe(0);
  });

  it('detects repeats and sequences', () => {
    const rep = omnimatch('abcabcabc', dicts).find((m) => m.pattern === 'repeat');
    expect(rep).toMatchObject({ base: 'abc', count: 3 });
    expect(analyse('aaaaaaaaaaaa', dicts).score).toBeLessThanOrEqual(1);
    const seq = omnimatch('xyz98765', dicts).filter((m) => m.pattern === 'sequence');
    expect(seq.some((m) => m.token === '98765' && m.ascending === false)).toBe(true);
    expect(patterns('abcdefgh')).toEqual(['sequence']);
  });

  it('detects years and dates', () => {
    expect(omnimatch('1998', dicts).some((m) => m.pattern === 'year')).toBe(true);
    expect(omnimatch('1/1/2000', dicts).some((m) => m.pattern === 'date')).toBe(true);
    expect(omnimatch('25121990', dicts).some((m) => m.pattern === 'date')).toBe(true);
    expect(omnimatch('13/13/2000', dicts).some((m) => m.pattern === 'date' && m.token === '13/13/2000')).toBe(false);
    expect(analyse('01011990', dicts).score).toBeLessThanOrEqual(1);
  });

  it('rates long random-looking and multi-word passwords higher', () => {
    expect(analyse('correcthorsebatterystaple', dicts).score).toBeGreaterThanOrEqual(3);
    expect(analyse('x8$Qm!vL2#pZr9Tw', dicts).score).toBe(4);
    expect(analyse('x8$Qm!vL2#pZr9Tw', dicts).log10).toBeGreaterThan(14);
  });

  it('uses the minimum-guesses decomposition', () => {
    const pw = 'passwordqwerty';
    const { sequence, guesses } = mostGuessable(pw, omnimatch(pw, dicts), false);
    expect(sequence.map((m) => m.token).join('')).toBe(pw);
    expect(sequence.length).toBeGreaterThanOrEqual(2);
    expect(guesses).toBeLessThan(1e9);
  });

  it('applies the user-supplied words', () => {
    const base = analyse('zebrafish2013', dicts);
    const withCustom = analyse('zebrafish2013', dicts, parseCustomWords('Zebrafish, 2013'));
    expect(withCustom.guesses).toBeLessThan(base.guesses);
    expect(withCustom.sequence.some((m) => m.dictionary === 'custom')).toBe(true);
    expect(withCustom.feedback.warning).toMatch(/your own words/);
  });

  it('computes crack times for four scenarios', () => {
    const a = analyse('x8$Qm!vL2#pZr9Tw', dicts);
    expect(a.crackTimes.map((c) => c.scenario.id)).toEqual(['online-throttled', 'online', 'offline-slow', 'offline-fast']);
    expect(a.crackTimes[0].seconds).toBeGreaterThan(a.crackTimes[3].seconds);
    expect(analyse('password', dicts).crackTimes[3].display).toBe('less than a second');
  });

  it('formats times and scores', () => {
    expect(humanTime(0.2)).toBe('less than a second');
    expect(humanTime(1)).toBe('1 second');
    expect(humanTime(90)).toBe('2 minutes');
    expect(humanTime(86400 * 3)).toBe('3 days');
    expect(humanTime(86400 * 365 * 2)).toBe('2 years');
    expect(humanTime(1e12)).toBe('centuries');
    expect(humanTime(Infinity)).toBe('centuries');
    expect([10, 1e4, 1e7, 1e9, 1e11].map(scoreFromGuesses)).toEqual([0, 1, 2, 3, 4]);
  });

  it('handles empty and very long input', () => {
    expect(analyse('', dicts).score).toBe(0);
    let seed = 7;
    const random = Array.from({ length: 150 }, () => String.fromCharCode(33 + ((seed = (seed * 1103515245 + 12345) % 2147483648) % 90))).join('');
    const long = analyse(random, dicts);
    expect(long.truncated).toBe(true);
    expect(Number.isFinite(long.guesses) || long.guesses === Infinity).toBe(true);
    expect(long.score).toBe(4);
    expect(analyse('aB3$'.repeat(60), dicts).score).toBeLessThanOrEqual(1);
  });

  it('gives suggestions for weak passwords and none for strong ones', () => {
    expect(analyse('monkey', dicts).feedback.suggestions.length).toBeGreaterThan(0);
    expect(analyse('x8$Qm!vL2#pZr9Tw', dicts).feedback).toEqual({ warning: '', suggestions: [] });
  });

  it('parses custom words', () => {
    expect(parseCustomWords('Rex, Fluffy  rex;a')).toEqual(['rex', 'fluffy']);
  });
});
