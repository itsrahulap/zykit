import { describe, expect, it } from 'vitest';
import { compile, explain, findMatches, groupNames, replacePreview, segments } from '../../../src/tools/regex-tester/features/regex';

describe('findMatches', () => {
  it('finds all matches with g and groups', () => {
    const r = findMatches('(?<y>\\d{4})-(\\d{2})', 'g', 'a 2024-01 b 1999-12');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.matches.map((m) => [m.index, m.text])).toEqual([
      [2, '2024-01'],
      [12, '1999-12'],
    ]);
    expect(r.matches[0].groups).toEqual(['2024', '01']);
    expect(r.matches[0].named).toEqual({ y: '2024' });
  });
  it('stops after the first match without g', () => {
    const r = findMatches('a', '', 'aaa');
    expect(r.ok && r.matches.length).toBe(1);
  });
  it('handles empty matches without looping, including surrogate pairs with u', () => {
    const r = findMatches('', 'g', 'abc');
    expect(r.ok && r.matches.length).toBe(4);
    const u = findMatches('', 'gu', '😀a');
    expect(u.ok && u.matches.map((m) => m.index)).toEqual([0, 2, 3]);
  });
  it('caps the number of matches', () => {
    const r = findMatches('a', 'g', 'a'.repeat(100), 10);
    expect(r.ok && r.matches.length).toBe(10);
    expect(r.ok && r.truncated).toBe(true);
  });
  it('records indices with d and undefined groups', () => {
    const r = findMatches('(a)|(b)', 'gd', 'b');
    expect(r.ok && r.matches[0].groups).toEqual([undefined, 'b']);
    expect(r.ok && r.matches[0].indices).toEqual([undefined, [0, 1]]);
  });
  it('sticky only matches consecutively', () => {
    const r = findMatches('a', 'gy', 'aab');
    expect(r.ok && r.matches.length).toBe(2);
    expect(findMatches('b', 'y', 'ab')).toMatchObject({
      ok: true,
      matches: [],
    });
  });
  it('reports syntax errors', () => {
    const r = findMatches('(', 'g', 'x');
    expect(r.ok).toBe(false);
    expect(compile('a', 'gg').ok).toBe(false);
  });
});

describe('replace & segments', () => {
  it('supports $1 and $<name>', () => {
    expect(replacePreview('(?<first>\\w+) (\\w+)', 'g', 'Ada Lovelace', '$2, $<first>')).toBe('Lovelace, Ada');
    expect(replacePreview('(', 'g', 'keep', 'x')).toBe('keep');
  });
  it('splits text into highlighted runs', () => {
    const r = findMatches('b+', 'g', 'abbcb');
    expect(r.ok && segments('abbcb', r.matches)).toEqual([
      { text: 'a', match: -1 },
      { text: 'bb', match: 0 },
      { text: 'c', match: -1 },
      { text: 'b', match: 1 },
    ]);
  });
  it('lists group names', () => {
    expect(groupNames('(?<a>x)(y)(?<b_2>z)')).toEqual(['a', 'b_2']);
  });
});

describe('explain', () => {
  it('tokenizes common constructs', () => {
    const t = explain('^(?<word>[A-Z]\\w+?)\\s*(?:foo|ba.){2,3}\\1$');
    expect(t.map((x) => [x.text, x.kind])).toEqual([
      ['^', 'anchor'],
      ['(?<word>', 'group'],
      ['[A-Z]', 'class'],
      ['\\w', 'escape'],
      ['+?', 'quantifier'],
      [')', 'group'],
      ['\\s', 'escape'],
      ['*', 'quantifier'],
      ['(?:', 'group'],
      ['foo', 'literal'],
      ['|', 'alternation'],
      ['ba', 'literal'],
      ['.', 'any'],
      [')', 'group'],
      ['{2,3}', 'quantifier'],
      ['\\1', 'backref'],
      ['$', 'anchor'],
    ]);
    expect(t[1].info).toBe('Start of capture group 1 named “word”');
    expect(t[4].info).toBe('One or more times (lazy: as few as possible)');
    expect(t[14].info).toBe('Between 2 and 3 times');
  });
  it('explains classes, escapes and lookarounds', () => {
    expect(explain('[^a\\]b]')[0]).toMatchObject({
      text: '[^a\\]b]',
      info: 'Any character except “a\\]b”',
    });
    expect(explain('\\p{L}')[0].info).toBe('A character with Unicode property L');
    expect(explain('(?<!x)')[0].info).toMatch(/Negative lookbehind/);
    expect(explain('\\.')[0]).toMatchObject({
      kind: 'literal',
      info: 'The character “.”',
    });
    expect(explain('a{3}')[1].info).toBe('Exactly 3 times');
    expect(explain('a{3,}')[1].info).toBe('3 or more times');
  });
});
