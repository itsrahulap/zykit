import { describe, expect, it } from 'vitest';
import { parseRegex, RegexSyntaxError, type RegexNode } from '../../../src/tools/regex-tester/features/regex-tree';

/** Indented "label [text]" lines, for readable expectations. */
const dump = (n: RegexNode, d = 0): string[] => [`${'  '.repeat(d)}${n.label} [${n.text}]`, ...n.children.flatMap((c) => dump(c, d + 1))];
const tree = (p: string, f = '') => parseRegex(p, f).children.flatMap((c) => dump(c)).join('\n');
const err = (p: string, f = '') => {
  try {
    parseRegex(p, f);
  } catch (e) {
    if (e instanceof RegexSyntaxError) return `${e.index}: ${e.message}`;
    throw e;
  }
  return 'ok';
};

describe('parseRegex', () => {
  it('explains a typical pattern as a tree', () => {
    expect(tree('^(?<user>[\\w.]+)@(\\w+\\.)+[a-z]{2,}$', 'i')).toBe(
      [
        'Start of the input [^]',
        'Capture group 1 named “user” [(?<user>[\\w.]+)]',
        '  One or more times (greedy: as many as possible, then gives back if needed) [[\\w.]+]',
        '    Any one character from this set [[\\w.]]',
        '      A word character (letter, digit or _) [\\w]',
        '      The character “.” [.]',
        'The text “@” [@]',
        'One or more times (greedy: as many as possible, then gives back if needed) [(\\w+\\.)+]',
        '  Capture group 2 [(\\w+\\.)]',
        '    One or more times (greedy: as many as possible, then gives back if needed) [\\w+]',
        '      A word character (letter, digit or _) [\\w]',
        '    The text “.” [\\.]',
        '2 or more times (greedy: as many as possible, then gives back if needed) [[a-z]{2,}]',
        '  Any one character from this set [[a-z]]',
        '    Any character from “a” to “z” [a-z]',
        'End of the input [$]',
      ].join('\n'),
    );
  });

  it('merges plain text but keeps a quantified last character separate', () => {
    expect(tree('abc+')).toBe('The text “ab” [ab]\nOne or more times (greedy: as many as possible, then gives back if needed) [c+]\n  The text “c” [c]');
  });

  it('handles alternation, lookarounds, lazy quantifiers and backreferences', () => {
    const t = tree('(a|b|)(?=x)(?<!y).*?\\1\\k<n>(?<n>z)');
    expect(t).toContain('Either of 3 options');
    expect(t).toContain('Option 3 (empty');
    expect(t).toContain('Lookahead: only if followed by [(?=x)]');
    expect(t).toContain('Negative lookbehind: only if NOT preceded by [(?<!y)]');
    expect(t).toContain('Zero or more times (lazy: as few as possible) [.*?]');
    expect(t).toContain('Back-reference to group 1 [\\1]');
    expect(t).toContain('Back-reference to group “n” [\\k<n>]');
    expect(t).toContain('Capture group 2 named “n”');
  });

  it('reads classes with ] - and escapes, and v-mode set operations', () => {
    expect(tree('[\\]\\-a-]')).toBe('Any one character from this set [[\\]\\-a-]]\n  The character “]” [\\]]\n  The character “-” [\\-]\n  The character “a” [a]\n  The character “-” [-]');
    expect(tree('[^]')).toBe('Any character at all [[^]]');
    expect(tree('[]')).toBe('An empty set (never matches) [[]]');
    const v = tree('[[a-z]--[aeiou]&&\\q{ch|sh}]', 'v');
    expect(v).toContain('Minus (removes these) [--]');
    expect(v).toContain('Intersected with (must be in both) [&&]');
    expect(v).toContain('One of the strings “ch”, “sh”');
  });

  it('explains flags-dependent anchors and modifier groups', () => {
    expect(tree('^.$', 'ms')).toBe('Start of a line [^]\nAny character [.]\nEnd of a line [$]');
    expect(tree('(?i-m:a)')).toContain('Group that turns on i and turns off m for its contents');
  });

  it('reports errors at the right position', () => {
    expect(err('(ab')).toMatch(/^0: .*never closed/);
    expect(err('ab)')).toMatch(/^2: .*no matching/);
    expect(err('a**')).toMatch(/^2: Nothing to repeat/);
    expect(err('[a-')).toMatch(/^0: .*class is never closed/);
    expect(err('[z-a]')).toMatch(/^1: .*out of order/);
    expect(err('a{3,1}')).toMatch(/^1: .*backwards/);
    expect(err('(?x)')).toMatch(/^0: Unknown group/);
    expect(err('a\\')).toMatch(/^1: .*lone backslash/);
    expect(err('a{', 'u')).toMatch(/^1: .*must be escaped/);
    expect(err('a{')).toBe('ok'); // Annex B: a literal brace outside u/v
    expect(err('('.repeat(5000) + ')'.repeat(5000))).toMatch(/nested more than 200/);
  });

  it('agrees with the JavaScript engine on what is valid', () => {
    const cases: [string, string][] = [
      ['a|b', ''], ['(?:x)+?', ''], ['\\d{1,3}(\\.\\d{1,3}){3}', ''], ['[\\w-]+', ''], ['\\p{L}+', 'u'], ['(?<y>\\d{4})-\\k<y>', ''],
      ['x{2}', 'u'], ['^\\s*$', 'm'], ['[a&&b]', ''], ['\\cA', ''], ['\\u{1F600}', 'u'], ['(a)(b)\\2', 'u'], ['[\\d-z]', ''],
      ['(', ''], [')', ''], ['*', ''], ['+a', ''], ['[b-a]', ''], ['x{5,2}', ''], ['(?<1a>x)', ''], ['\\', ''], ['(?<=a', ''], ['a{', 'u'], ['\\2(a)', 'u'], ['[\\d-z]', 'u'],
    ];
    for (const [p, f] of cases) {
      let native = true;
      try {
        new RegExp(p, f);
      } catch {
        native = false;
      }
      expect(err(p, f) === 'ok', `/${p}/${f}`).toBe(native);
    }
  });
});
