import { describe, expect, it } from 'vitest';
import {
  computeStats,
  countGraphemes,
  countLines,
  countParagraphs,
  countSentences,
  formatDuration,
  utf8Bytes,
  words,
} from '../../../src/tools/word-counter/features/count';

describe('words', () => {
  it('counts words with Intl.Segmenter', () => {
    expect(words("Hello, world! It's 2024.")).toEqual(['Hello', 'world', "It's", '2024']);
    expect(words('')).toEqual([]);
  });

  it('falls back to a regex without Intl.Segmenter', () => {
    expect(words("Hello, world! It's 2024.", null)).toEqual(['Hello', 'world', "It's", '2024']);
  });
});

describe('counts', () => {
  it('counts emoji and combined characters as one grapheme', () => {
    expect(countGraphemes('👍🏽👨‍👩‍👧é')).toBe(3);
    expect(countGraphemes('abc', null)).toBe(3);
  });

  it('counts UTF-8 bytes', () => {
    expect(utf8Bytes('aé€😀')).toBe(1 + 2 + 3 + 4);
    expect(utf8Bytes('')).toBe(0);
  });

  it('counts sentences, paragraphs and lines', () => {
    expect(countSentences('One. Two! Three? Four')).toBe(4);
    expect(countSentences('Version 1.5 is out.')).toBe(1);
    expect(countSentences('   ')).toBe(0);
    expect(countParagraphs('a\nb\n\n\nc\n  \nd')).toBe(3);
    expect(countLines('a\nb\r\nc')).toBe(3);
    expect(countLines('')).toBe(0);
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0 sec');
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(180)).toBe('3 min');
    expect(formatDuration(3900)).toBe('1 hr 5 min');
  });
});

describe('computeStats', () => {
  it('computes the full set', () => {
    const s = computeStats('The cat sat on the mat.\n\nThe dog barked loudly!');
    expect(s.words).toBe(10);
    expect(s.sentences).toBe(2);
    expect(s.paragraphs).toBe(2);
    expect(s.lines).toBe(3);
    expect(s.longestWord).toBe('barked'); // first of the longest
    expect(s.topWords[0]).toEqual({ word: 'the', count: 3 });
    expect(s.readingSeconds).toBe(Math.ceil((10 / 238) * 60));
    expect(s.charactersNoSpaces).toBe(s.characters - 10);
  });

  it('filters stop words from the top list', () => {
    const s = computeStats('The cat and the cat and the dog', { ignoreStopWords: true });
    expect(s.topWords).toEqual([
      { word: 'cat', count: 2 },
      { word: 'dog', count: 1 },
    ]);
  });

  it('handles 1 MB quickly', () => {
    const text = 'lorem ipsum dolor sit amet. '.repeat(40_000);
    const t = performance.now();
    const s = computeStats(text);
    expect(s.words).toBe(200_000);
    expect(performance.now() - t).toBeLessThan(3000);
  });
});
