import { describe, expect, it } from 'vitest';
import { slugify, slugifyLines, transliterate } from '../../../src/tools/slug-generator/features/slug';

describe('transliterate', () => {
  it('strips accents and maps special letters', () => {
    expect(transliterate('Crème Brûlée')).toBe('Creme Brulee');
    expect(transliterate('Straße Æsir Øre Łódź Đorđe Þór')).toBe('Strasse AEsir Ore Lodz Dorde THor');
  });
});

describe('slugify', () => {
  it('makes a basic slug', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('10 Tips & Tricks')).toBe('10-tips-and-tricks');
    expect(slugify("Don't stop")).toBe('dont-stop');
    expect(slugify('Ünïcödé — naïve café')).toBe('unicode-naive-cafe');
  });

  it('respects ampersand, separator and case options', () => {
    expect(slugify('Salt & Pepper', { ampersand: false })).toBe('salt-pepper');
    expect(slugify('Hello World', { separator: '_' })).toBe('hello_world');
    expect(slugify('Hello World', { separator: '.' })).toBe('hello.world');
    expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World');
  });

  it('keeps non-Latin letters', () => {
    expect(slugify('Привет мир')).toBe('привет-мир');
  });

  it('cuts at a word boundary', () => {
    expect(slugify('The quick brown fox jumps', { maxLength: 15 })).toBe('the-quick-brown');
    expect(slugify('The quick brown fox jumps', { maxLength: 14 })).toBe('the-quick');
    expect(slugify('Supercalifragilistic', { maxLength: 5 })).toBe('super');
  });

  it('removes stop words but never everything', () => {
    expect(slugify('The Lord of the Rings', { removeStopWords: true })).toBe('lord-rings');
    expect(slugify('The a of', { removeStopWords: true })).toBe('the-a-of');
  });

  it('returns empty for symbol-only input', () => {
    expect(slugify('!!! ???')).toBe('');
  });
});

describe('slugifyLines', () => {
  it('converts one slug per line', () => {
    expect(slugifyLines('First Post\n\nSecond Post\r\nThird')).toEqual(['first-post', '', 'second-post', 'third']);
  });
});
