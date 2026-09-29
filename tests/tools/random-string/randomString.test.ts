import { describe, expect, it } from 'vitest';
import {
  alphabetFor,
  clampInt,
  dedupeCharset,
  formatOutput,
  generateStrings,
  PRESETS,
  stringBits,
} from '../../../src/tools/random-string/features/randomString';

describe('charsets', () => {
  it('has the expected preset sizes', () => {
    expect(PRESETS['hex-lower'].chars).toHaveLength(16);
    expect(PRESETS.base64.chars).toHaveLength(64);
    expect(PRESETS.base64url.chars).toHaveLength(64);
    expect(PRESETS.alphanumeric.chars).toHaveLength(62);
    expect(PRESETS.letters.chars).toHaveLength(52);
  });

  it('dedupes custom sets by code point and drops newlines/tabs', () => {
    expect(dedupeCharset('aabbc\n\tc 😀😀')).toEqual(['a', 'b', 'c', ' ', '😀']);
    expect(alphabetFor('custom', 'xyzx')).toEqual(['x', 'y', 'z']);
    expect(alphabetFor('numeric', 'ignored')).toHaveLength(10);
  });
});

describe('generateStrings', () => {
  it('respects length, count, prefix and suffix', () => {
    const out = generateStrings({ alphabet: [...PRESETS['hex-lower'].chars], length: 32, count: 100, prefix: 'sk_', suffix: '_x' });
    expect(out).toHaveLength(100);
    for (const s of out) expect(s).toMatch(/^sk_[0-9a-f]{32}_x$/);
    expect(new Set(out).size).toBe(100);
  });

  it('handles multi-code-unit characters', () => {
    const [s] = generateStrings({ alphabet: ['😀', 'é'], length: 10, count: 1, prefix: '', suffix: '' });
    expect([...s]).toHaveLength(10);
  });

  it('generates the maximum size quickly', () => {
    const out = generateStrings({ alphabet: [...PRESETS.base64.chars], length: 4096, count: 1000, prefix: '', suffix: '' });
    expect(out.join('').length).toBe(4_096_000);
  });
});

describe('output helpers', () => {
  it('formats output', () => {
    expect(formatOutput(['a', 'b'], 'lines')).toBe('a\nb');
    expect(formatOutput(['a', 'b'], 'comma')).toBe('a,b');
    expect(JSON.parse(formatOutput(['a', '"b'], 'json'))).toEqual(['a', '"b']);
  });

  it('computes entropy and clamps', () => {
    expect(stringBits(16, 32)).toBe(128);
    expect(stringBits(64, 22)).toBe(132);
    expect(clampInt(5000, 1, 4096)).toBe(4096);
    expect(clampInt(Number.NaN, 1, 10)).toBe(1);
    expect(clampInt(2.6, 1, 10)).toBe(3);
  });
});
