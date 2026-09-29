import { describe, expect, it } from 'vitest';
import { buildRegex, runRules, toSegments, type FindOptions, type Rule } from '../../../src/tools/find-replace/features/findReplace';

const base: FindOptions = { regex: false, caseSensitive: false, wholeWord: false, multiline: false, replaceAll: true };
const rule = (find: string, replace: string, enabled = true, id = 1): Rule => ({ id, find, replace, enabled });
const out = (text: string, rules: Rule[], o: Partial<FindOptions> = {}) => runRules(text, rules, { ...base, ...o }, 0).output;

describe('runRules', () => {
  it('replaces plain text literally, case-insensitively by default', () => {
    expect(out('a.b A.B axb', [rule('a.b', '$1 $&')])).toBe('$1 $& $1 $& axb');
    expect(out('Cat cat', [rule('cat', 'dog')], { caseSensitive: true })).toBe('Cat dog');
  });
  it('replaces the first match only when asked', () => {
    const r = runRules('x x x', [rule('x', 'y')], { ...base, replaceAll: false }, 0);
    expect(r.output).toBe('y x x');
    expect(r.rules[0]).toEqual({ count: 3, replaced: 1 });
  });
  it('supports $1, $<name> and $& in regex mode', () => {
    expect(out('2024-01-31', [rule('(\\d+)-(\\d+)-(\\d+)', '$3/$2/$1')], { regex: true })).toBe('31/01/2024');
    expect(out('John Smith', [rule('(?<first>\\w+) (?<last>\\w+)', '$<last>, $<first>')], { regex: true })).toBe('Smith, John');
    expect(out('ab', [rule('b', '[$&]')], { regex: true })).toBe('a[b]');
  });
  it('matches whole words only, including non-ASCII words and patterns with symbols', () => {
    expect(out('cat concat cat.', [rule('cat', 'X')], { wholeWord: true })).toBe('X concat X.');
    expect(out('über überall', [rule('über', 'X')], { wholeWord: true })).toBe('X überall');
    expect(out('a c++ c+++', [rule('c++', 'X')], { wholeWord: true })).toBe('a X X+');
    expect(out('cat concat', [rule('ca\\w', 'X')], { wholeWord: true, regex: true })).toBe('X concat');
  });
  it('uses multiline anchors when enabled', () => {
    expect(out('a\nb', [rule('^', '> ')], { regex: true })).toBe('> a\nb');
    expect(out('a\nb', [rule('^', '> ')], { regex: true, multiline: true })).toBe('> a\n> b');
  });
  it('applies rules in sequence and skips disabled or empty ones', () => {
    const rules = [rule('a', 'b', true, 1), rule('b', 'c', true, 2), rule('c', 'X', false, 3), rule('', 'Y', true, 4)];
    const r = runRules('ab', rules, base, 1);
    expect(r.output).toBe('cc');
    expect(r.rules.map((x) => x?.count ?? null)).toEqual([1, 2, null, null]);
    // The second rule sees the output of the first.
    expect(r.active).toEqual({ text: 'bb', matches: [{ index: 0, end: 1 }, { index: 1, end: 2 }], truncated: false });
  });
  it('reports invalid regexes per rule and carries on', () => {
    const r = runRules('abc', [rule('(', 'x', true, 1), rule('b', 'B', true, 2)], { ...base, regex: true }, 0);
    expect(r.rules[0]?.error).toMatch(/Unterminated group|missing \)/i);
    expect(r.output).toBe('aBc');
  });
  it('caps the number of highlighted matches', () => {
    const r = runRules('aaaa', [rule('a', 'b')], base, 0, 2);
    expect(r.active?.matches).toHaveLength(2);
    expect(r.active?.truncated).toBe(true);
    expect(r.output).toBe('bbbb');
  });
});

describe('buildRegex and toSegments', () => {
  it('escapes plain text', () => {
    const r = buildRegex('1+1=(2)', base);
    expect(r.ok && new RegExp(r.source, r.flags).test('is 1+1=(2)?')).toBe(true);
  });
  it('splits text into highlight segments', () => {
    expect(toSegments('a-b-', [{ index: 1, end: 2 }, { index: 3, end: 4 }])).toEqual([
      { text: 'a', match: -1 },
      { text: '-', match: 0 },
      { text: 'b', match: -1 },
      { text: '-', match: 1 },
    ]);
  });
});
