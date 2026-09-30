import { describe, expect, it } from 'vitest';
import {
  bump,
  check,
  compare,
  explainRange,
  formatVersion,
  maxSatisfying,
  minSatisfying,
  parseRange,
  parseVersion,
  satisfies,
  sortVersions,
} from '../../../src/tools/semver-checker/features/semver-checker';

describe('parseVersion', () => {
  it('parses prerelease and build metadata', () => {
    const v = parseVersion('1.2.3-beta.11+exp.sha.5114f85')!;
    expect(v).toEqual({ major: 1, minor: 2, patch: 3, prerelease: ['beta', 11], build: ['exp', 'sha', '5114f85'] });
    expect(formatVersion(v)).toBe('1.2.3-beta.11');
    expect(formatVersion(v, true)).toBe('1.2.3-beta.11+exp.sha.5114f85');
    expect(parseVersion(' v1.0.0 ')).not.toBeNull();
    expect(parseVersion('=1.0.0')).not.toBeNull();
  });

  it('rejects invalid versions', () => {
    for (const bad of ['1.2', '1.2.3.4', '01.2.3', '1.02.3', '1.2.3-01', '1.2.3-', '1.2.3+', 'a.b.c', '1.2.3-beta..1', `${2 ** 60}.0.0`]) {
      expect(parseVersion(bad), bad).toBeNull();
    }
    expect(parseVersion('1.2.3-0a')).not.toBeNull(); // alphanumeric ids may start with a digit
  });
});

describe('compare (SemVer 2.0.0 §11)', () => {
  it('orders the spec example chain', () => {
    const chain = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0'];
    for (let i = 0; i < chain.length - 1; i++) expect(compare(parseVersion(chain[i])!, parseVersion(chain[i + 1])!), chain[i]).toBe(-1);
    expect(sortVersions([...chain].reverse())).toEqual(chain);
    expect(sortVersions(['2.0.0', '1.10.0', '1.9.0', 'nope'])).toEqual(['1.9.0', '1.10.0', '2.0.0']);
    expect(sortVersions(['1.0.0', '2.0.0'], true)).toEqual(['2.0.0', '1.0.0']);
  });

  it('ignores build metadata', () => {
    expect(compare(parseVersion('1.0.0+a')!, parseVersion('1.0.0+b')!)).toBe(0);
  });
});

describe('explainRange (node-semver README)', () => {
  const cases: [string, string][] = [
    ['1.2.3 - 2.3.4', '>=1.2.3 <=2.3.4'],
    ['1.2 - 2.3.4', '>=1.2.0 <=2.3.4'],
    ['1.2.3 - 2.3', '>=1.2.3 <2.4.0-0'],
    ['1.2.3 - 2', '>=1.2.3 <3.0.0-0'],
    ['*', '*'],
    ['', '*'],
    ['1.x', '>=1.0.0 <2.0.0-0'],
    ['1.2.x', '>=1.2.0 <1.3.0-0'],
    ['1', '>=1.0.0 <2.0.0-0'],
    ['1.2', '>=1.2.0 <1.3.0-0'],
    ['~1.2.3', '>=1.2.3 <1.3.0-0'],
    ['~1.2', '>=1.2.0 <1.3.0-0'],
    ['~1', '>=1.0.0 <2.0.0-0'],
    ['~0.2.3', '>=0.2.3 <0.3.0-0'],
    ['~0.2', '>=0.2.0 <0.3.0-0'],
    ['~0', '>=0.0.0 <1.0.0-0'],
    ['~1.2.3-beta.2', '>=1.2.3-beta.2 <1.3.0-0'],
    ['~>1.2', '>=1.2.0 <1.3.0-0'],
    ['^1.2.3', '>=1.2.3 <2.0.0-0'],
    ['^0.2.3', '>=0.2.3 <0.3.0-0'],
    ['^0.0.3', '>=0.0.3 <0.0.4-0'],
    ['^1.2.3-beta.2', '>=1.2.3-beta.2 <2.0.0-0'],
    ['^0.0.3-beta', '>=0.0.3-beta <0.0.4-0'],
    ['^1.2.x', '>=1.2.0 <2.0.0-0'],
    ['^0.0.x', '>=0.0.0 <0.1.0-0'],
    ['^0.0', '>=0.0.0 <0.1.0-0'],
    ['^1.x', '>=1.0.0 <2.0.0-0'],
    ['^0.x', '>=0.0.0 <1.0.0-0'],
    ['>1.2', '>=1.3.0'],
    ['>=1.2', '>=1.2.0'],
    ['<1.2', '<1.2.0-0'],
    ['<=1.2', '<1.3.0-0'],
    ['>1', '>=2.0.0'],
    ['<=1', '<2.0.0-0'],
    ['<*', '<0.0.0-0'],
    ['>= 1.2.3 < 2', '>=1.2.3 <2.0.0-0'],
    ['1.2.7 || >=1.2.9 <2.0.0', '1.2.7 || >=1.2.9 <2.0.0'],
    ['=1.2.3', '1.2.3'],
  ];
  it.each(cases)('%s → %s', (range, bounds) => {
    expect(explainRange(range)).toBe(bounds);
  });

  it('uses -0 lower bounds for partial versions with includePrerelease', () => {
    expect(explainRange('^1.2', { includePrerelease: true })).toBe('>=1.2.0-0 <2.0.0-0');
    expect(explainRange('*', { includePrerelease: true })).toBe('*');
  });

  it('throws on invalid comparators', () => {
    expect(() => parseRange('>=abc')).toThrow(/isn’t a valid/);
    expect(() => parseRange('>=')).toThrow(/missing a version/);
  });
});

describe('satisfies', () => {
  it('handles the README examples', () => {
    expect(satisfies('1.2.8', '1.2.7 || >=1.2.9 <2.0.0')).toBe(false);
    expect(satisfies('1.2.7', '1.2.7 || >=1.2.9 <2.0.0')).toBe(true);
    expect(satisfies('1.4.6', '1.2.7 || >=1.2.9 <2.0.0')).toBe(true);
    expect(satisfies('1.2.3-alpha.7', '>1.2.3-alpha.3')).toBe(true);
    expect(satisfies('3.4.5-alpha.9', '>1.2.3-alpha.3')).toBe(false);
    expect(satisfies('3.4.5', '>1.2.3-alpha.3')).toBe(true);
    expect(satisfies('1.2.4-beta', '^1.2.3')).toBe(false);
    expect(satisfies('1.2.4-beta', '^1.2.3', { includePrerelease: true })).toBe(true);
    expect(satisfies('1.2.3-beta.4', '^1.2.3-beta.2')).toBe(true);
    expect(satisfies('1.2.4-beta.2', '^1.2.3-beta.2')).toBe(false);
    expect(satisfies('2.0.0-0', '^1.2.3')).toBe(false);
    expect(satisfies('2.0.0-alpha', '^1.0.0', { includePrerelease: true })).toBe(false);
    expect(satisfies('0.0.0', '*')).toBe(true);
    expect(satisfies('1.0.0-beta', '*')).toBe(false);
    expect(satisfies('1.0.0-beta', '*', { includePrerelease: true })).toBe(true);
    expect(satisfies('1.3.0', '<*')).toBe(false);
    expect(satisfies('not-a-version', '*')).toBe(false);
  });

  it('explains why', () => {
    expect(check('2.0.0', '^1.2.0')).toEqual({ ok: false, reason: '2.0.0 is not <2.0.0-0' });
    expect(check('1.5.0', '^1.2.0')).toEqual({ ok: true, reason: 'matches >=1.2.0 <2.0.0-0' });
    expect(check('1.5.0-rc.1', '^1.2.0').reason).toMatch(/is a prerelease/);
    expect(check('1.2', '*').reason).toMatch(/isn’t a valid/);
  });

  it('finds max and min satisfying', () => {
    const list = ['1.2.3', '1.2.4', '1.3.0', '2.0.0', '2.1.0-beta'];
    expect(maxSatisfying(list, '~1.2')).toBe('1.2.4');
    expect(maxSatisfying(list, '^1')).toBe('1.3.0');
    expect(minSatisfying(list, '>=1.2.4')).toBe('1.2.4');
    expect(maxSatisfying(list, '>=3')).toBeNull();
  });
});

describe('bump (node-semver inc)', () => {
  const cases: [string, Parameters<typeof bump>[1], string, string][] = [
    ['1.2.3', 'major', '', '2.0.0'],
    ['1.2.3', 'minor', '', '1.3.0'],
    ['1.2.3', 'patch', '', '1.2.4'],
    ['1.2.3-4', 'patch', '', '1.2.3'],
    ['1.2.0-4', 'minor', '', '1.2.0'],
    ['1.0.0-4', 'major', '', '1.0.0'],
    ['1.2.3', 'premajor', '', '2.0.0-0'],
    ['1.2.3', 'preminor', 'beta', '1.3.0-beta.0'],
    ['1.2.3', 'prepatch', 'alpha', '1.2.4-alpha.0'],
    ['1.2.3', 'prerelease', '', '1.2.4-0'],
    ['1.2.3', 'prerelease', 'beta', '1.2.4-beta.0'],
    ['1.2.4-beta.0', 'prerelease', 'beta', '1.2.4-beta.1'],
    ['1.2.4-alpha.3', 'prerelease', 'beta', '1.2.4-beta.0'],
    ['1.2.4-beta', 'prerelease', '', '1.2.4-beta.0'],
    ['1.2.4-1.beta', 'prerelease', '', '1.2.4-2.beta'],
  ];
  it.each(cases)('%s %s %s → %s', (from, kind, id, to) => {
    expect(bump(from, kind, id)).toBe(to);
  });
  it('rejects invalid input', () => {
    expect(bump('1.2', 'major')).toBeNull();
    expect(bump('1.2.3', 'prerelease', 'bad id')).toBeNull();
  });
});
