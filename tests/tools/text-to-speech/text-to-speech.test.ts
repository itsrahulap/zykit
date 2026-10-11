import { describe, expect, it } from 'vitest';
import { chunkText, groupVoices, wordAt } from '../../../src/tools/text-to-speech/features/text-to-speech';

describe('Text to Speech chunker', () => {
  it('keeps short text as one chunk and returns none for blank text', () => {
    expect(chunkText('Hello world. Bye!')).toEqual([{ text: 'Hello world. Bye!', start: 0 }]);
    expect(chunkText('  \n ')).toEqual([]);
  });
  it('splits at sentence boundaries when over the limit, with offsets', () => {
    const input = 'First one. Second one. Third one.';
    const chunks = chunkText(input, 15);
    expect(chunks.map((c) => c.text)).toEqual(['First one.', 'Second one.', 'Third one.']);
    for (const c of chunks) expect(input.slice(c.start, c.start + c.text.length)).toBe(c.text);
  });
  it('breaks overlong sentences at spaces and never exceeds the limit', () => {
    const input = 'word '.repeat(100).trim();
    const chunks = chunkText(input, 50);
    expect(chunks.every((c) => c.text.length <= 50)).toBe(true);
    expect(chunks.map((c) => c.text).join(' ')).toBe(input);
    const solid = chunkText('x'.repeat(120), 50);
    expect(solid.map((c) => c.text.length)).toEqual([50, 50, 20]);
  });
  it('treats newlines as breaks', () => {
    const chunks = chunkText('Line one\nLine two', 200);
    expect(chunks.map((c) => c.text)).toEqual(['Line one', 'Line two']);
  });
  it('finds the word at an index', () => {
    expect(wordAt('hello big world', 6)).toEqual([6, 9]);
    expect(wordAt('hello big world', 6, 2)).toEqual([6, 8]);
    expect(wordAt('hi', 2)).toEqual([2, 2]);
  });
  it('groups voices by language', () => {
    const v = (name: string, lang: string) => ({ name, lang, voiceURI: name, localService: true, default: false });
    const g = groupVoices([v('B', 'en_US'), v('A', 'en-US'), v('C', 'fr-FR')]);
    expect(g.map((x) => [x.lang, x.voices.map((y) => y.name)])).toEqual([['en-US', ['A', 'B']], ['fr-FR', ['C']]]);
  });
});
